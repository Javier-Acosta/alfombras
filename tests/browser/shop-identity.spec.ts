import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { readFileSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";

process.loadEnvFile(".test-runtime/.env.test");
const fixtures = JSON.parse(
  readFileSync(".test-runtime/fixtures.json", "utf8"),
);
const pb = new PocketBase("http://127.0.0.1:8097");

test("Home, tienda y pedido comparten identidad y navegación en escritorio y móvil", async ({
  page,
}) => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  const saved = await pb.collection("site_settings").getOne("alfombrasconfig");
  const token = randomBytes(32).toString("hex");
  const key = createHash("sha256").update(token).digest("hex");
  let orderId: string | undefined;
  try {
    await pb
      .collection("site_settings")
      .update(saved.id, {
        accent_color: "#8b5a36",
        background_color: "#ffffff",
        surface_color: "#ffffff",
        text_color: "#301812",
      });
    const order = await pb
      .collection("orders")
      .create({
        reference: "PRUEBA-IDENTIDAD",
        tokenHash: key,
        idempotencyKey: key,
        requestHash: key,
        email: "identidad@example.test",
        status: "pending",
        currency: "ARS",
        totalMinor: 15000000,
        items: [
          {
            id: fixtures.product,
            name: "Alfombra de prueba",
            quantity: 1,
            unitPriceMinor: 15000000,
            subtotalMinor: 15000000,
          },
        ],
      });
    orderId = order.id;
    await page.setViewportSize({ width: 1440, height: 1000 });
    const chrome = () =>
      page.locator("header.nav").evaluate((header) => ({
        background: getComputedStyle(header).backgroundColor,
        color: getComputedStyle(header).color,
        font: getComputedStyle(header).fontFamily,
        logo:
          header.querySelector(".site-logo")?.getAttribute("src") ||
          header.querySelector(".brand")?.textContent,
        links: Array.from(header.querySelectorAll(".nav-links a"), (link) => ({
          href: link.getAttribute("href"),
          label: link.textContent,
        })),
      }));
    await page.goto("/");
    const home = await chrome();
    const footer = await page.locator(".institution > footer").textContent();
    await page
      .locator(".nav-links")
      .getByRole("link", { name: "Tienda", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Tienda", exact: true }),
    ).toBeVisible();
    expect(await chrome()).toEqual(home);
    await expect(page.locator(".institution > footer")).toHaveText(footer!);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "Vendedor", exact: true }),
    ).toHaveCount(0);
    const theme = await page
      .getByRole("main")
      .evaluate((el) => ({
        color: getComputedStyle(el).color,
        font: getComputedStyle(el).fontFamily,
      }));
    expect(theme).toEqual({ color: "rgb(48, 24, 18)", font: home.font });
    await expect(page.locator("aside")).toHaveCSS(
      "border-top-color",
      "rgb(139, 90, 54)",
    );
    await page
      .getByRole("button", {
        name: "Ver Alfombra de prueba más grande",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Agregar", exact: true })
      .first()
      .click();
    await page.getByRole("spinbutton", { name: "Cantidad" }).fill("2");
    await page.reload();
    await expect(
      page.getByRole("spinbutton", { name: "Cantidad" }),
    ).toHaveValue("2");
    await page.screenshot({
      path: "test-results/tienda-identidad-desktop.png",
      fullPage: true,
    });
    await page.goto(`/pedido/${token}`);
    expect(await chrome()).toEqual(home);
    await expect(
      page.getByRole("heading", {
        name: "Tu pedido está pendiente",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.locator(".institution > footer")).toHaveText(footer!);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByText("Menú", { exact: true }).click();
    await page
      .getByRole("navigation", { name: "Navegación móvil" })
      .getByRole("link", { name: "Tienda", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Tienda", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Menú", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("spinbutton", { name: "Cantidad" }),
    ).toHaveValue("2");
    const cart = await page.locator("aside").boundingBox();
    const lastProduct = await page.locator("main article").last().boundingBox();
    expect(cart!.y).toBeGreaterThanOrEqual(
      lastProduct!.y + lastProduct!.height,
    );
    await page.screenshot({
      path: "test-results/tienda-identidad-mobile.png",
      fullPage: true,
    });
    await page.getByText("Menú", { exact: true }).click();
    await page
      .getByRole("navigation", { name: "Navegación móvil" })
      .getByRole("link", { name: "Inicio", exact: true })
      .click();
    expect(await chrome()).toEqual(home);
  } finally {
    await pb
      .collection("site_settings")
      .update(saved.id, {
        accent_color: saved.accent_color,
        background_color: saved.background_color,
        surface_color: saved.surface_color,
        text_color: saved.text_color,
      });
    if (orderId) await pb.collection("orders").delete(orderId);
    pb.authStore.clear();
  }
});
