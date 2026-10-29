import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
process.loadEnvFile(".test-runtime/.env.test");
const fixtures = JSON.parse(
  readFileSync(".test-runtime/fixtures.json", "utf8"),
);
const origin = "http://localhost:3217";
const pb = new PocketBase("http://127.0.0.1:8097");
pb.autoCancellation(false);
test.beforeAll(async () => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  // Todos los registros de esta URL pertenecen a la base local descartable.
  for (const record of await pb
    .collection("news")
    .getFullList({ filter: 'title = "Noticia creada desde panel"' }))
    await pb.collection("news").delete(record.id);
  for (const record of await pb.collection("orders").getFullList())
    await pb.collection("orders").delete(record.id);
});

test("sitio institucional, tienda, carrito y pedido en escritorio y móvil", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "ALFOMBRAS",
  );
  await expect(page.locator(".news-card")).toHaveCount(6);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.goto("/la-fabrica");
  await expect(
    page.getByText("Contenido institucional de prueba local."),
  ).toBeVisible();
  await page.goto("/proceso-artesanal");
  await expect(
    page.getByRole("heading", { name: "Proceso artesanal", exact: true }),
  ).toBeVisible();
  await page.goto("/noticias");
  await expect(page.locator(".news-card")).toHaveCount(7);
  await page.locator(".news-card-link").first().click();
  await expect(page.locator(".news-body")).toContainText(
    "Contenido de prueba del entorno local.",
  );
  await page.goto(`/colecciones/${fixtures.collection}`);
  await expect(
    page.locator('article.news-detail a[href^="/tienda"]'),
  ).toHaveCount(0);
  await page.goto(`/tienda?coleccion=${fixtures.collection}`);
  await expect(page).toHaveURL(/tienda\?coleccion=/);
  await expect(
    page.getByRole("link", {
      name: "Fábrica de Alfombras Catamarca",
      exact: true,
    }),
  ).toHaveCSS("color", "rgb(237, 128, 35)");
  await expect(page.getByText("Borrador privado", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", {
      name: "Ver Alfombra de prueba más grande",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Medidas: 1,50 × 2,00 m")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Ver Alfombra de prueba más grande",
      exact: true,
    }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Agregar", exact: true })
    .first()
    .click();
  await page.getByRole("spinbutton", { name: "Cantidad" }).fill("2");
  await page.reload();
  await expect(page.getByRole("spinbutton", { name: "Cantidad" })).toHaveValue(
    "2",
  );
  await expect(
    page.getByRole("button", { name: "Vendido", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: "test-results/store-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Email de contacto").fill("comprador@example.test");
  await page.route("**/api/pedidos", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Error temporal de prueba" }),
    }),
  );
  await page
    .getByRole("button", { name: "Enviar pedido por WhatsApp" })
    .click();
  await expect(page.locator("p[role=alert]")).toContainText("Error temporal");
  await expect(page.getByRole("spinbutton", { name: "Cantidad" })).toHaveValue(
    "2",
  );
  await page.unroute("**/api/pedidos");
  await pb
    .collection("products")
    .update(fixtures.product, { priceMinor: 15000100 });
  await page
    .getByRole("button", { name: "Enviar pedido por WhatsApp" })
    .click();
  await expect(page.locator("p[role=alert]")).toContainText(
    "Los precios se actualizaron",
  );
  await page
    .getByRole("button", { name: "Enviar pedido por WhatsApp" })
    .click();
  await expect(page).toHaveURL(/\/pedido\/[a-f0-9]{64}$/);
  await expect(
    page.getByRole("heading", { name: "Tu pedido está pendiente" }),
  ).toBeVisible();
  const wa = page.getByRole("link", { name: "Continuar por WhatsApp" });
  await expect(wa).toHaveAttribute(
    "href",
    /^https:\/\/wa.me\/5493834000000\?text=/,
  );
  const href = await wa.getAttribute("href");
  expect(decodeURIComponent(href!)).toContain("comprador@example.test");
  expect(decodeURIComponent(href!)).toContain("× 2");
  await page.reload();
  await expect(wa).toBeVisible();
  await pb
    .collection("products")
    .update(fixtures.product, { priceMinor: 15000000 });
  await page.screenshot({
    path: "test-results/order-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByText("Menú", { exact: true }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Navegación móvil" })
      .getByRole("link", { name: "Tienda", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByText("Menú", { exact: true }).click();
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.goto("/tienda");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/store-mobile.png",
    fullPage: true,
  });
  await page.evaluate(() =>
    localStorage.setItem("alfombras-catamarca-cart", '{"invalid":true}'),
  );
  await page.reload();
  await expect(page.getByText("El carrito está vacío.")).toBeVisible();
  await page.getByText("Menú", { exact: true }).click();
  await page
    .getByRole("navigation", { name: "Navegación móvil" })
    .getByRole("link", { name: "Inicio", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "ALFOMBRAS",
  );
  expect(
    await page
      .locator(".hero")
      .evaluate((e) => getComputedStyle(e).backgroundColor),
  ).toBe("rgb(21, 149, 219)");
});

test("permisos y flujo editorial completo desde administración", async ({
  page,
  request,
}) => {
  expect((await request.get("/api/admin/products")).status()).toBe(401);
  expect(
    (
      await request.patch("/api/admin/products/" + fixtures.product, {
        headers: { Origin: "https://otro.example" },
        multipart: { published: "false" },
      })
    ).status(),
  ).toBe(403);
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin\/login/);
  await page.getByLabel("Correo").fill(process.env.STAFF_EMAIL!);
  await page.getByLabel("Contraseña").fill(process.env.STAFF_PASSWORD!);
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(
    page.getByRole("heading", { name: "Administración", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/news");
  await page.getByRole("button", { name: "+ Nuevo" }).click();
  await page
    .getByLabel("Título", { exact: true })
    .fill("Noticia creada desde panel");
  await page
    .getByLabel("Resumen", { exact: true })
    .fill("Resumen editorial de prueba");
  await page
    .getByLabel("Contenido", { exact: false })
    .fill("<p>Texto para comprobar la vista previa.</p>");
  await page.getByLabel("Fecha de publicación").fill("2026-10-14");
  await page
    .getByLabel("Imagen (hasta 5 MB)")
    .setInputFiles(".test-runtime/sample.png");
  await page
    .locator("form.content-form")
    .getByRole("button", { name: "Vista previa", exact: true })
    .click();
  await expect(page.locator(".content-preview")).toContainText(
    "Noticia creada desde panel",
  );
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByRole("status")).toContainText("Contenido guardado");
  const article = page
    .locator(".record-list article")
    .filter({ hasText: "Noticia creada desde panel" });
  await expect(article).toContainText("Borrador");
  const saved = (
    await pb
      .collection("news")
      .getList(1, 1, { filter: 'title = "Noticia creada desde panel"' })
  ).items[0];
  const publicPb = new PocketBase("http://127.0.0.1:8097");
  await expect(
    publicPb.collection("news").getOne(saved.id),
  ).rejects.toMatchObject({ status: 404 });
  await article.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Publicar en el sitio").check();
  await page.getByLabel("Prioridad (mayor primero)").fill("999");
  await page.getByRole("button", { name: "Guardar y publicar" }).click();
  await expect(article).toContainText("Publicado");
  await expect(
    publicPb.collection("news").getOne(saved.id),
  ).resolves.toMatchObject({ published: true });
  await article.getByRole("button", { name: "Duplicar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Copia creada");
  const duplicates = await pb
    .collection("news")
    .getFullList({ filter: 'title = "Noticia creada desde panel"' });
  expect(duplicates).toHaveLength(2);
  expect(duplicates.some((d) => !d.published && d.image)).toBe(true);
  await page.goto("/admin/settings");
  await page
    .getByLabel("WhatsApp comercial", { exact: false })
    .fill("+54 inválido");
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("WhatsApp");
  await page.goto("/admin/pedidos");
  await expect(
    page.getByText("comprador@example.test", { exact: false }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-orders.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/admin\/login/);
  expect((await page.request.get("/api/admin/orders")).status()).toBe(401);
  for (const d of duplicates) await pb.collection("news").delete(d.id);
});

test("pedidos: precios, privacidad, reintentos y cambios de disponibilidad", async ({
  request,
}) => {
  const item = { id: fixtures.product, quantity: 1 };
  const price = (await pb.collection("products").getOne(fixtures.product))
    .priceMinor;
  const input = {
    email: "api@example.test",
    items: [item],
    seenPrices: { [fixtures.product]: price },
    confirmationToken: randomBytes(32).toString("hex"),
  };
  const post = (data: unknown) =>
    request.post("/api/pedidos", { headers: { Origin: origin }, data });
  expect(
    (await post({ ...input, items: [{ ...item, quantity: 0 }] })).status(),
  ).toBe(400);
  expect(
    (
      await post({ ...input, items: [{ id: fixtures.sold, quantity: 1 }] })
    ).status(),
  ).toBe(400);
  const changed = await post({
    ...input,
    seenPrices: { [fixtures.product]: 1 },
    totalMinor: 1,
  });
  expect(changed.status()).toBe(409);
  expect((await changed.json()).prices[fixtures.product]).toBe(price);
  const responses = await Promise.all([post(input), post(input)]);
  for (const r of responses) expect(r.status()).toBe(200);
  expect(await responses[0].json()).toEqual(await responses[1].json());
  const url = (await responses[0].json()).url;
  const hashKey = (await import("node:crypto"))
    .createHash("sha256")
    .update(input.confirmationToken)
    .digest("hex");
  const orders = await pb
    .collection("orders")
    .getFullList({ filter: `idempotencyKey = '${hashKey}'` });
  expect(orders).toHaveLength(1);
  expect(orders[0].totalMinor).toBe(price);
  const publicPb = new PocketBase("http://127.0.0.1:8097");
  expect((await publicPb.collection("orders").getList()).items).toHaveLength(0);
  await expect(
    publicPb.collection("orders").getOne(orders[0].id),
  ).rejects.toMatchObject({ status: 404 });
  await expect(
    publicPb.collection("products").getOne(fixtures.draft),
  ).rejects.toMatchObject({ status: 404 });
  const r = await request.get(url);
  expect(r.headers()["referrer-policy"]).toBe("no-referrer");
  expect(r.headers()["x-robots-tag"]).toContain("noindex");
  expect((await request.get("/pedido/" + "a".repeat(64))).status()).toBe(404);
  await pb
    .collection("products")
    .update(fixtures.product, { published: false, priceMinor: price + 1000 });
  const snapshot = await request.get(url);
  expect(await snapshot.text()).toContain("Alfombra de prueba");
  expect((await post(input)).status()).toBe(200);
  expect(
    (
      await post({
        ...input,
        confirmationToken: randomBytes(32).toString("hex"),
      })
    ).status(),
  ).toBe(400);
  await pb
    .collection("products")
    .update(fixtures.product, { published: true, priceMinor: price });
  await pb
    .collection("site_settings")
    .update("alfombrasconfig", { whatsapp: "" });
  expect(
    (
      await post({
        ...input,
        confirmationToken: randomBytes(32).toString("hex"),
      })
    ).status(),
  ).toBe(503);
  await pb
    .collection("site_settings")
    .update("alfombrasconfig", { whatsapp: "5493834000000" });
  expect(
    (
      await request.post("/api/pedidos", {
        headers: { Origin: "https://otro.example" },
        data: input,
      })
    ).status(),
  ).toBe(403);
});
