import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { randomBytes, createHash } from "node:crypto";

process.loadEnvFile(".test-runtime/.env.test");
const origin = "http://localhost:3217";
const pb = new PocketBase("http://127.0.0.1:8097");
pb.autoCancellation(false);

test("archiva, recupera y conserva el historial con permisos de personal", async ({
  page,
  request,
}) => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  const ids: string[] = [];
  const token = randomBytes(32).toString("hex");
  async function createOrder() {
    const key = randomBytes(32).toString("hex");
    const order = await pb.collection("orders").create({
      reference: `PRUEBA-ARCHIVO-${key.slice(0, 8)}`,
      tokenHash: createHash("sha256")
        .update(ids.length ? key : token)
        .digest("hex"),
      idempotencyKey: key,
      requestHash: key,
      email: "archivo@example.test",
      status: "pending",
      items: [
        {
          id: "abcdefghijklmno",
          name: "Alfombra de prueba de archivo",
          quantity: 1,
          unitPriceMinor: 15000000,
          subtotalMinor: 15000000,
        },
      ],
      totalMinor: 15000000,
      currency: "ARS",
    });
    ids.push(order.id);
    return order;
  }
  try {
    const one = await createOrder();
    const two = await createOrder();
    const anonymous = await request.post("/api/admin/orders/archive", {
      headers: { origin },
      data: { ids: [one.id], archived: true },
    });
    expect(anonymous.status()).toBe(401);
    await page.goto("/admin/login");
    await page.locator("input[name=email]").fill(process.env.STAFF_EMAIL!);
    await page
      .locator("input[name=password]")
      .fill(process.env.STAFF_PASSWORD!);
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await page.waitForURL("**/admin");
    await page.goto("/admin/pedidos");
    const card = (reference: string) =>
      page.locator("article").filter({
        has: page.getByRole("heading", { name: reference, exact: true }),
      });
    await expect(card(one.reference)).toBeVisible();
    const forbidden = await page.request.post("/api/admin/orders/archive", {
      headers: { origin: "https://otro.example" },
      data: { ids: [one.id], archived: true },
    });
    expect(forbidden.status()).toBe(403);
    const invalid = await page.request.post("/api/admin/orders/archive", {
      headers: { origin },
      data: { ids: [one.id], archived: true, totalMinor: 1 },
    });
    expect(invalid.status()).toBe(400);
    await page.route("**/api/admin/orders/archive", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Error de prueba al archivar." }),
      }),
    );
    await card(one.reference)
      .getByRole("button", { name: "Archivar pedido", exact: true })
      .click();
    await expect(page.locator(".form-error[role=alert]")).toHaveText(
      "Error de prueba al archivar.",
    );
    expect((await pb.collection("orders").getOne(one.id)).archived).toBe(false);
    await page.unroute("**/api/admin/orders/archive");
    await card(one.reference)
      .getByRole("button", { name: "Archivar pedido", exact: true })
      .click();
    await expect(card(one.reference)).toHaveCount(0);
    await page.getByRole("button", { name: /^Archivados/ }).click();
    await expect(card(one.reference)).toBeVisible();
    await card(one.reference)
      .getByRole("button", { name: "Volver a pendientes" })
      .click();
    await expect(card(one.reference)).toHaveCount(0);
    await page.getByRole("button", { name: /^Pendientes/ }).click();
    await expect(card(one.reference)).toBeVisible();
    page.once("dialog", (dialog) => dialog.dismiss());
    await page
      .getByRole("button", { name: "Archivar todos los pendientes" })
      .click();
    await expect(card(two.reference)).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Archivar todos los pendientes" })
      .click();
    await expect(
      page.getByText("No hay pedidos pendientes.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Archivados/ }).click();
    await expect(card(one.reference)).toBeVisible();
    await expect(card(two.reference)).toBeVisible();
    const archived = await pb.collection("orders").getOne(one.id);
    expect(archived.archived).toBe(true);
    for (const key of [
      "reference",
      "email",
      "items",
      "totalMinor",
      "currency",
      "tokenHash",
      "idempotencyKey",
      "status",
      "created",
    ])
      expect(archived[key]).toEqual(one[key]);
    await page.screenshot({
      path: "test-results/pedidos-archivados.png",
      fullPage: true,
    });
    const future = await createOrder();
    await page.reload();
    await page.getByRole("button", { name: /^Pendientes/ }).click();
    await expect(card(future.reference)).toBeVisible();
    const staff = new PocketBase(pb.baseURL);
    await staff
      .collection("staff")
      .authWithPassword(process.env.STAFF_EMAIL!, process.env.STAFF_PASSWORD!);
    await expect(
      staff
        .collection("orders")
        .update(one.id, { archived: false, totalMinor: 1 }),
    ).rejects.toMatchObject({ status: 403 });
    await page.goto(`/pedido/${token}`);
    await expect(page.getByText(one.reference, { exact: true })).toBeVisible();
  } finally {
    // Exclusivamente registros sintéticos creados en la base local descartable.
    for (const id of ids) await pb.collection("orders").delete(id);
    pb.authStore.clear();
  }
});
