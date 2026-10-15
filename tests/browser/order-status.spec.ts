import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { randomBytes, createHash } from "node:crypto";

process.loadEnvFile(".test-runtime/.env.test");
const origin = "http://localhost:3217";
const pb = new PocketBase("http://127.0.0.1:8097");

test("gestiona estados, correcciones y archivo sin alterar los datos del pedido", async ({
  page,
  request,
}) => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  const token = randomBytes(32).toString("hex");
  const key = randomBytes(32).toString("hex");
  const order = await pb.collection("orders").create({
    reference: `PRUEBA-ESTADOS-${key.slice(0, 8)}`,
    email: "estados@example.test",
    tokenHash: createHash("sha256").update(token).digest("hex"),
    idempotencyKey: key,
    requestHash: key,
    status: "pending",
    currency: "ARS",
    totalMinor: 300000000,
    items: [
      {
        id: "abcdefghijklmno",
        name: "Alfombra de prueba de estados",
        quantity: 1,
        unitPriceMinor: 300000000,
        subtotalMinor: 300000000,
      },
    ],
  });
  try {
    expect(
      (
        await request.post("/api/admin/orders/status", {
          headers: { origin },
          data: {
            id: order.id,
            status: "confirmed",
            previousStatus: "pending",
          },
        })
      ).status(),
    ).toBe(401);
    await page.goto("/admin/login");
    await page.locator("input[name=email]").fill(process.env.STAFF_EMAIL!);
    await page
      .locator("input[name=password]")
      .fill(process.env.STAFF_PASSWORD!);
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await page.waitForURL("**/admin");
    await page.goto("/admin/pedidos");
    const card = page.locator("article").filter({
      has: page.getByRole("heading", { name: order.reference, exact: true }),
    });
    await expect(card.getByText(/· Pendiente/)).toBeVisible();
    const change = (data: object, requestOrigin = origin) =>
      page.request.post("/api/admin/orders/status", {
        headers: { origin: requestOrigin },
        data,
      });
    expect(
      (
        await change(
          { id: order.id, status: "confirmed", previousStatus: "pending" },
          "https://otro.example",
        )
      ).status(),
    ).toBe(403);
    for (const data of [
      { id: order.id, status: "paid", previousStatus: "pending" },
      {
        id: order.id,
        status: "confirmed",
        previousStatus: "pending",
        totalMinor: 1,
      },
      {
        id: order.id,
        status: "confirmed",
        previousStatus: "pending",
        archived: true,
      },
    ])
      expect((await change(data)).status()).toBe(400);
    expect(
      (
        await change({
          id: order.id,
          status: "delivered",
          previousStatus: "pending",
        })
      ).status(),
    ).toBe(409);
    await page.route("**/api/admin/orders/status", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          message: "No se pudo cambiar el estado de prueba.",
        }),
      }),
    );
    await card
      .getByRole("button", { name: "Confirmar venta", exact: true })
      .click();
    await expect(page.locator(".form-error[role=alert]")).toHaveText(
      "No se pudo cambiar el estado de prueba.",
    );
    expect((await pb.collection("orders").getOne(order.id)).status).toBe(
      "pending",
    );
    await page.unroute("**/api/admin/orders/status");
    await card
      .getByRole("button", { name: "Confirmar venta", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Ventas confirmadas", exact: true }),
    ).toBeVisible();
    await expect(card.getByText(/· Venta confirmada/)).toBeVisible();
    expect(
      (
        await change({
          id: order.id,
          status: "cancelled",
          previousStatus: "pending",
        })
      ).status(),
    ).toBe(409);
    await page.reload();
    await page.getByRole("button", { name: /^Pendientes/ }).click();
    await expect(card).toHaveCount(0);
    await page.getByRole("button", { name: /^Ventas confirmadas/ }).click();
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Marcar como entregado" }).click();
    await expect(
      page.getByRole("heading", { name: "Pedidos entregados", exact: true }),
    ).toBeVisible();
    await expect(card.getByText(/· Entregado/)).toBeVisible();
    await page.screenshot({
      path: "test-results/pedidos-estados.png",
      fullPage: true,
    });
    await page.goto(`/pedido/${token}`);
    await expect(
      page.getByRole("heading", {
        name: "Tu pedido fue entregado",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/admin/pedidos");
    await page.getByRole("button", { name: /^Entregados/ }).click();
    await card
      .getByRole("button", { name: "Volver a venta confirmada" })
      .click();
    page.once("dialog", (dialog) => dialog.dismiss());
    await card.getByRole("button", { name: "Cancelar pedido" }).click();
    await expect(card.getByText(/· Venta confirmada/)).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await card.getByRole("button", { name: "Cancelar pedido" }).click();
    await expect(
      page.getByRole("heading", { name: "Pedidos cancelados", exact: true }),
    ).toBeVisible();
    await expect(card.getByText(/· Cancelado/)).toBeVisible();
    await card
      .getByRole("button", { name: "Archivar pedido", exact: true })
      .click();
    await expect(card).toHaveCount(0);
    await page.getByRole("button", { name: /^Archivados/ }).click();
    await expect(card.getByText(/· Cancelado · Archivado/)).toBeVisible();
    expect(
      (
        await change({
          id: order.id,
          status: "pending",
          previousStatus: "cancelled",
        })
      ).status(),
    ).toBe(409);
    await card
      .getByRole("button", { name: "Recuperar pedido", exact: true })
      .click();
    await expect(card).toHaveCount(0);
    await page.getByRole("button", { name: /^Cancelados/ }).click();
    await card
      .getByRole("button", { name: "Volver a pendiente", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Pedidos pendientes", exact: true }),
    ).toBeVisible();
    await expect(card.getByText(/· Pendiente/)).toBeVisible();
    const saved = await pb.collection("orders").getOne(order.id);
    expect(saved.archived).toBe(false);
    for (const field of [
      "reference",
      "email",
      "items",
      "totalMinor",
      "currency",
      "tokenHash",
      "idempotencyKey",
      "requestHash",
      "created",
    ])
      expect(saved[field]).toEqual(order[field]);
    const staff = new PocketBase(pb.baseURL);
    await staff
      .collection("staff")
      .authWithPassword(process.env.STAFF_EMAIL!, process.env.STAFF_PASSWORD!);
    await expect(
      staff.collection("orders").update(order.id, { status: "delivered" }),
    ).rejects.toMatchObject({ status: 403 });
  } finally {
    // Solo el pedido sintético creado en la base local descartable.
    await pb.collection("orders").delete(order.id);
    pb.authStore.clear();
  }
});
