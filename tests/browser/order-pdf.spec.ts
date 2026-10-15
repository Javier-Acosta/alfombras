import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

process.loadEnvFile(".test-runtime/.env.test");
const pb = new PocketBase("http://127.0.0.1:8097");

test("descarga un PDF privado con datos originales y pagina pedidos extensos archivados", async ({
  page,
  request,
}) => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  const key = randomBytes(32).toString("hex");
  const order = await pb.collection("orders").create({
    reference: `PRUEBA-PDF-${key.slice(0, 8)}`,
    email: "registro@example.test",
    status: "pending",
    tokenHash: key,
    idempotencyKey: key,
    requestHash: key,
    currency: "ARS",
    totalMinor: 300000000,
    items: [
      {
        id: "abcdefghijklmno",
        name: "Alfombra geométrica - Hilo de llama - 2 × 2,50 metros",
        quantity: 1,
        unitPriceMinor: 300000000,
        subtotalMinor: 300000000,
      },
    ],
  });
  const url = `/api/admin/orders/${order.id}/pdf`;
  try {
    expect((await request.get(url)).status()).toBe(401);
    await page.goto("/admin/login");
    await page.locator("input[name=email]").fill(process.env.STAFF_EMAIL!);
    await page
      .locator("input[name=password]")
      .fill(process.env.STAFF_PASSWORD!);
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await page.waitForURL("**/admin");
    await page.goto("/admin/pedidos");
    expect(
      (await page.request.get("/api/admin/orders/invalid/pdf")).status(),
    ).toBe(400);
    expect(
      (
        await page.request.get("/api/admin/orders/zzzzzzzzzzzzzzz/pdf")
      ).status(),
    ).toBe(404);
    const card = page.locator("article").filter({
      has: page.getByRole("heading", { name: order.reference, exact: true }),
    });
    await page.route(`**${url}`, (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error de prueba al generar PDF." }),
      }),
    );
    await card
      .getByRole("button", { name: "Descargar PDF", exact: true })
      .click();
    await expect(page.locator(".form-error[role=alert]")).toHaveText(
      "Error de prueba al generar PDF.",
    );
    await page.unroute(`**${url}`);
    const response = await page.request.get(url);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["content-disposition"]).toBe(
      `attachment; filename="pedido-${order.reference}.pdf"`,
    );
    const pdf = await PDFDocument.load(await response.body());
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getTitle()).toBe(`Registro interno - Pedido ${order.reference}`);
    const downloadPromise = page.waitForEvent("download");
    await card
      .getByRole("button", { name: "Descargar PDF", exact: true })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`pedido-${order.reference}.pdf`);
    await download.saveAs("test-results/pedido-descargado.pdf");
    const unchanged = await pb.collection("orders").getOne(order.id);
    expect(unchanged.updated).toBe(order.updated);
    expect(unchanged.items).toEqual(order.items);
    expect(unchanged.totalMinor).toBe(order.totalMinor);
    await pb.collection("orders").update(order.id, {
      status: "delivered",
      archived: true,
      items: Array.from({ length: 30 }, (_, i) => ({
        ...order.items[0],
        name: `Alfombra ${i + 1} - ${"Diseño geométrico artesanal en hilo de llama, tonos tierra y beige. ".repeat(2)}`,
      })),
      totalMinor: 9000000000,
    });
    await page.reload();
    await page.getByRole("button", { name: /^Archivados/ }).click();
    await expect(
      card.getByRole("button", { name: "Descargar PDF", exact: true }),
    ).toBeVisible();
    const longDownloadPromise = page.waitForEvent("download");
    await card
      .getByRole("button", { name: "Descargar PDF", exact: true })
      .click();
    const longDownload = await longDownloadPromise;
    await longDownload.saveAs("test-results/pedido-extenso.pdf");
    const longResponse = await page.request.get(url);
    const longPdf = await PDFDocument.load(await longResponse.body());
    expect(longPdf.getPageCount()).toBeGreaterThan(1);
    await writeFile(
      "test-results/pedido-pdf-verificacion.json",
      JSON.stringify({
        reference: order.reference,
        secret: key,
        pages: longPdf.getPageCount(),
      }),
    );
  } finally {
    // Solo el pedido sintético de la base local descartable.
    await pb.collection("orders").delete(order.id);
    pb.authStore.clear();
  }
});
