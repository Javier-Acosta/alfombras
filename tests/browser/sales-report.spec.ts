import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { execFileSync } from "node:child_process";

process.loadEnvFile(".test-runtime/.env.test");
const pb = new PocketBase("http://127.0.0.1:8097");

test("imprime ventas confirmadas con fechas inclusivas, total y acceso privado", async ({
  page,
  request,
}) => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  const records: { id: string; reference: string; updated: string }[] = [];
  const tag = randomBytes(4).toString("hex");
  async function sale(
    label: string,
    created: string,
    totalMinor = 300000000,
    status = "confirmed",
    archived = false,
  ) {
    const key = randomBytes(32).toString("hex");
    const record = await pb.collection("orders").create({
      reference: `INFORME-${tag}-${label}`,
      created,
      email: "ventas@example.test",
      status,
      archived,
      tokenHash: key,
      idempotencyKey: key,
      requestHash: key,
      totalMinor,
      currency: "ARS",
      items: [
        {
          id: "abcdefghijklmno",
          name: "Alfombra geométrica de prueba - Hilo de llama",
          quantity: 1,
          unitPriceMinor: totalMinor,
          subtotalMinor: totalMinor,
        },
      ],
    });
    records.push(record as unknown as (typeof records)[number]);
    // PocketBase ignores API values for autodate fields. Set fixture dates only
    // in the fixed, disposable SQLite database; no production database is used.
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
      import { DatabaseSync } from "node:sqlite";
      const db = new DatabaseSync(".test-runtime/pb_data/data.db");
      try {
        db.exec("PRAGMA busy_timeout=3000");
        const result = db.prepare("UPDATE orders SET created = ? WHERE id = ? AND reference = ?").run(process.argv[3], process.argv[1], process.argv[2]);
        if (result.changes !== 1) throw new Error("No se pudo preparar la fecha de prueba");
      } finally { db.close(); }
    `,
        record.id,
        record.reference,
        created,
      ],
      { stdio: "pipe" },
    );
    Object.assign(record, await pb.collection("orders").getOne(record.id));
    expect(new Date(record.created).getTime()).toBe(
      new Date(created).getTime(),
    );
    return record;
  }
  const endpoint = "/api/admin/orders/confirmed-report";
  try {
    const first = await sale("INICIO", "2031-02-17 03:00:00.000Z");
    const last = await sale("FIN", "2031-02-18 02:59:59.999Z", 150000000);
    await sale("ANTES", "2031-02-17 02:59:59.999Z");
    await sale("DESPUES", "2031-02-18 03:00:00.000Z");
    await sale("PENDIENTE", "2031-02-17 15:00:00.000Z", 300000000, "pending");
    await sale("ENTREGADO", "2031-02-17 15:00:00.000Z", 300000000, "delivered");
    await sale("CANCELADO", "2031-02-17 15:00:00.000Z", 300000000, "cancelled");
    await sale(
      "ARCHIVADO",
      "2031-02-17 15:00:00.000Z",
      300000000,
      "confirmed",
      true,
    );
    expect((await request.get(endpoint)).status()).toBe(401);
    await page.goto("/admin/login");
    await page.locator("input[name=email]").fill(process.env.STAFF_EMAIL!);
    await page
      .locator("input[name=password]")
      .fill(process.env.STAFF_PASSWORD!);
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await page.waitForURL("**/admin");
    await page.goto("/admin/pedidos");
    await page.getByRole("button", { name: /^Ventas confirmadas/ }).click();
    const form = page.getByRole("form", {
      name: "Informe de ventas confirmadas",
    });
    const print = form.getByRole("button", {
      name: "Imprimir ventas confirmadas",
      exact: true,
    });
    await form.getByLabel("Desde", { exact: true }).fill("2031-02-17");
    await form.getByLabel("Hasta", { exact: true }).fill("2031-02-17");
    await expect(form).toContainText("2 ventas");
    await expect(form).toContainText("4.500.000,00");
    await expect(page.locator("article")).toHaveCount(2);
    for (const query of [
      "from=2031-02-30",
      "from=2031-02-18&to=2031-02-17",
      "status=pending",
      "from=2031-02-17&from=2031-02-18",
    ])
      expect((await page.request.get(`${endpoint}?${query}`)).status()).toBe(
        400,
      );
    expect(
      (
        await page.request.get(`${endpoint}?from=2032-01-01&to=2032-01-01`)
      ).status(),
    ).toBe(404);
    await page.route(`**${endpoint}*`, (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Error de prueba al generar informe.",
        }),
      }),
    );
    await print.click();
    await expect(page.locator(".form-error[role=alert]")).toHaveText(
      "Error de prueba al generar informe.",
    );
    await page.unroute(`**${endpoint}*`);
    const downloadPromise = page.waitForEvent("download");
    await print.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(
      "ventas-confirmadas-desde-2031-02-17-hasta-2031-02-17.pdf",
    );
    await download.saveAs("test-results/ventas-confirmadas.pdf");
    const response = await page.request.get(
      `${endpoint}?from=2031-02-17&to=2031-02-17`,
    );
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["content-type"]).toBe("application/pdf");
    expect((await PDFDocument.load(await response.body())).getTitle()).toBe(
      "Ventas confirmadas - Registro interno",
    );
    expect(
      (await page.request.get(`${endpoint}?from=2031-02-17`)).status(),
    ).toBe(200);
    expect((await page.request.get(`${endpoint}?to=2031-02-17`)).status()).toBe(
      200,
    );
    expect((await page.request.get(endpoint)).status()).toBe(200);
    await page.screenshot({
      path: "test-results/ventas-confirmadas-panel.png",
      fullPage: true,
    });
    await form.getByLabel("Desde", { exact: true }).fill("2031-02-18");
    await expect(form.getByRole("alert")).toHaveText(
      "La fecha Desde debe ser anterior o igual a Hasta.",
    );
    await expect(print).toBeDisabled();
    await form.getByRole("button", { name: "Limpiar fechas" }).click();
    await expect(form.getByLabel("Desde", { exact: true })).toHaveValue("");
    await expect(form.getByLabel("Hasta", { exact: true })).toHaveValue("");
    await expect(page.locator("article")).toHaveCount(4);
    await form.getByLabel("Desde", { exact: true }).fill("2032-01-01");
    await form.getByLabel("Hasta", { exact: true }).fill("2032-01-01");
    await expect(print).toBeDisabled();
    await expect(form).toContainText("0 ventas");
    for (const record of records)
      expect((await pb.collection("orders").getOne(record.id)).updated).toBe(
        record.updated,
      );
    await writeFile(
      "test-results/ventas-confirmadas-verificacion.json",
      JSON.stringify({
        included: [first.reference, last.reference],
        excluded: records.slice(2).map((r) => r.reference),
      }),
    );
  } finally {
    // Solo los registros sintéticos creados en la base local descartable.
    for (const record of records)
      await pb.collection("orders").delete(record.id);
    pb.authStore.clear();
  }
});
