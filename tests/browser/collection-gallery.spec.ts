import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { readFileSync } from "node:fs";
process.loadEnvFile(".test-runtime/.env.test");
const pb = new PocketBase("http://127.0.0.1:8097");
test("colección muestra sus diseños y permite administrar varias fotos", async ({
  page,
}) => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  const photo = readFileSync(".test-runtime/sample.png");
  const cover = () => new File([photo], "foto.png", { type: "image/png" });
  const data = new FormData();
  data.set("name", "Colección galería de prueba");
  data.set("slug", "coleccion-galeria-prueba");
  data.set("description", "Descripción de colección");
  data.set("published", "true");
  data.set("priority", "9999");
  data.set("image", cover());
  const collection = await pb.collection("collections").create(data);
  const ids: string[] = [];
  try {
    for (const published of [true, false]) {
      const f = new FormData();
      for (const [k, v] of Object.entries({
        name: published ? "Diseño con galería" : "Diseño oculto",
        description: "Tejido artesanal con varias vistas",
        collection: collection.id,
        published: String(published),
      }))
        f.set(k, v);
      f.set("image", cover());
      ids.push((await pb.collection("designs").create(f)).id);
    }
    await page.goto("/admin/login");
    await page
      .getByLabel("Correo", { exact: true })
      .fill(process.env.STAFF_EMAIL!);
    await page
      .getByLabel("Contraseña", { exact: true })
      .fill(process.env.STAFF_PASSWORD!);
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await page.waitForURL("**/admin");
    const created = await page.request.post("/api/admin/designs", {
      headers: { origin: "http://localhost:3217" },
      multipart: {
        name: "Diseño independiente nuevo",
        description: "Creado sin precio desde el panel",
        collection: collection.id,
        published: "false",
        image: { name: "nuevo.png", mimeType: "image/png", buffer: photo },
      },
    });
    expect(created.status()).toBe(200);
    const createdDesign = await created.json();
    ids.push(createdDesign.id);
    expect(createdDesign.priceMinor).toBeUndefined();
    await page.goto("/admin/designs");
    const row = page
      .locator(".record-list article")
      .filter({ hasText: "Diseño con galería" });
    await row.getByRole("button", { name: "Editar", exact: true }).click();
    await expect(page.getByLabel(/Precio/)).toHaveCount(0);
    await page.locator('input[type="file"][multiple]').setInputFiles([
      { name: "vista1.png", mimeType: "image/png", buffer: photo },
      { name: "vista2.png", mimeType: "image/png", buffer: photo },
    ]);
    await page
      .getByRole("button", { name: "Guardar y publicar", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Contenido guardado");
    expect(
      (await pb.collection("designs").getOne(ids[0])).gallery,
    ).toHaveLength(2);
    await page.goto("/");
    const card = page
      .locator(".guest-card")
      .filter({ hasText: collection.name });
    await expect(card.locator("p, .news-read-more")).toHaveCount(0);
    await card.getByRole("link").click();
    await expect(page).toHaveURL(
      "http://localhost:3217/coleccion-galeria-prueba",
    );
    await page.goto(`/colecciones/${collection.id}`);
    await expect(page).toHaveURL(
      "http://localhost:3217/coleccion-galeria-prueba",
    );
    await expect(
      page.getByRole("heading", { name: "Diseño con galería" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Diseño oculto" }),
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: "Ver imagen 3 de Diseño con galería",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("img", {
        name: "Diseño con galería, imagen 3",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.locator('article.news-detail a[href^="/tienda"]'),
    ).toHaveCount(0);
    await page.goto("/admin/designs");
    await row.getByRole("button", { name: "Editar", exact: true }).click();
    await page
      .getByRole("button", { name: "Quitar foto", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Guardar y publicar", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Contenido guardado");
    expect(
      (await pb.collection("designs").getOne(ids[0])).gallery,
    ).toHaveLength(1);
    const savedGallery = (await pb.collection("designs").getOne(ids[0]))
      .gallery;
    const invalid = await page.request.patch(`/api/admin/designs/${ids[0]}`, {
      headers: { origin: "http://localhost:3217" },
      multipart: {
        "gallery-": savedGallery[0],
        "gallery+": {
          name: "falsa.png",
          mimeType: "image/png",
          buffer: Buffer.from("no es una imagen"),
        },
      },
    });
    expect(invalid.status()).toBe(400);
    expect((await pb.collection("designs").getOne(ids[0])).gallery).toEqual(
      savedGallery,
    );
    await row.getByRole("button", { name: "Duplicar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Copia creada");
    const copies = await pb
      .collection("designs")
      .getFullList({ filter: `collection="${collection.id}"` });
    const copy = copies.find((p) => !ids.includes(p.id));
    expect(copy?.gallery).toHaveLength(1);
    if (copy) ids.push(copy.id);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/colecciones/${collection.id}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/coleccion-galeria-movil.png",
      fullPage: true,
    });
  } finally {
    for (const id of ids) await pb.collection("designs").delete(id);
    await pb.collection("collections").delete(collection.id);
  }
});
