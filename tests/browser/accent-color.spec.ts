import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";

process.loadEnvFile(".test-runtime/.env.test");
const pb = new PocketBase("http://127.0.0.1:8097");

test("Color destacado se guarda desde el panel y cambia los enlaces naranjas y la tienda", async ({
  page,
}) => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  const saved = await pb.collection("site_settings").getOne("alfombrasconfig");
  try {
    await page.goto("/admin/login");
    await page
      .getByLabel("Correo", { exact: true })
      .fill(process.env.STAFF_EMAIL!);
    await page
      .getByLabel("Contraseña", { exact: true })
      .fill(process.env.STAFF_PASSWORD!);
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await page.waitForURL("**/admin");
    await page.goto("/admin/settings");
    const picker = page.getByLabel("Color destacado", { exact: true });
    await picker.fill("#245b47");
    await expect(
      page.locator(".settings-color-control code").first(),
    ).toHaveText("#245B47");
    const bounds = await picker.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(80);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await page
      .getByRole("button", { name: "Guardar configuración", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Configuración guardada",
    );
    expect(
      (await pb.collection("site_settings").getOne(saved.id)).accent_color,
    ).toBe("#245b47");
    await page.reload();
    await expect(picker).toHaveValue("#245b47");
    await page.screenshot({
      path: "test-results/color-destacado-configuracion.png",
      fullPage: true,
    });
    await page.goto("/");
    await expect(page.locator(".guest-card .news-read-more")).toHaveCount(0);
    await expect(page.locator(".news-card .news-read-more").first()).toHaveCSS(
      "color",
      "rgb(36, 91, 71)",
    );
    await expect(page.locator(".map-section h2")).toHaveCSS(
      "color",
      "rgb(36, 91, 71)",
    );
    await page.locator(".guest-card").first().scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "test-results/color-destacado-colecciones.png",
      fullPage: false,
    });
    await page.goto("/tienda");
    await expect(page.locator("aside")).toHaveCSS(
      "border-top-color",
      "rgb(36, 91, 71)",
    );
    await expect(
      page.locator("main p").filter({ hasText: "HECHO A MANO EN CATAMARCA" }),
    ).toHaveCSS("color", "rgb(36, 91, 71)");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/settings");
    await expect(picker).toHaveValue("#245b47");
    const mobileBounds = await picker.boundingBox();
    expect(mobileBounds!.height).toBeGreaterThanOrEqual(44);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    // Solo se restaura el color del entorno local descartable.
    await pb
      .collection("site_settings")
      .update(saved.id, { accent_color: saved.accent_color });
    pb.authStore.clear();
  }
});
