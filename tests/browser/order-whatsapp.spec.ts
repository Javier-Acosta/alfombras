import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { readFileSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";

process.loadEnvFile(".test-runtime/.env.test");
const fixture = JSON.parse(readFileSync(".test-runtime/fixtures.json", "utf8"));
const pb = new PocketBase("http://127.0.0.1:8097");

test("WhatsApp incorpora ficha y foto pública sin enviar mensajes ni exponer borradores", async ({
  page,
}) => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  const product = await pb.collection("products").getOne(fixture.product);
  const token = randomBytes(32).toString("hex");
  const key = createHash("sha256").update(token).digest("hex");
  const line = {
    id: product.id,
    name: product.name,
    quantity: 1,
    unitPriceMinor: 300000000,
    subtotalMinor: 300000000,
  };
  const order = await pb.collection("orders").create({
    reference: "PRUEBA-WHATSAPP",
    tokenHash: key,
    idempotencyKey: key,
    requestHash: key,
    email: "whatsapp@example.test",
    status: "pending",
    totalMinor: 600000000,
    currency: "ARS",
    items: [
      line,
      { ...line, id: fixture.draft, name: "Producto despublicado del pedido" },
    ],
  });
  try {
    await page.goto(`/pedido/${token}`);
    const href = await page
      .getByRole("link", { name: "Continuar por WhatsApp" })
      .getAttribute("href");
    const message = new URL(href!).searchParams.get("text")!;
    const publicUrl = `http://localhost:3217/tienda?alfombra=${product.id}`;
    const photo = pb.files.getURL(product, product.image);
    expect(message).toContain(`Ver alfombra: ${publicUrl}`);
    expect(message).toContain(`Foto: ${photo}`);
    expect(message.match(/Foto: /g)).toHaveLength(1);
    expect(message).toContain("Producto despublicado del pedido");
    expect(message).toContain("6.000.000,00");
    expect(message).not.toContain(token);
    expect((await page.request.get(photo)).status()).toBe(200);
    await page.goto(`/tienda?alfombra=${product.id}`);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("img", { name: product.name, exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.goto("/tienda?alfombra=invalid");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    const saved = await pb.collection("orders").getOne(order.id);
    expect(saved.updated).toBe(order.updated);
    expect(saved.items).toEqual(order.items);
  } finally {
    // Únicamente el pedido sintético de la base local de pruebas.
    await pb.collection("orders").delete(order.id);
    pb.authStore.clear();
  }
});
