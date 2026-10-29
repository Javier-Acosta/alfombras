import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { readFileSync } from "node:fs";
process.loadEnvFile(".test-runtime/.env.test");
const pb = new PocketBase("http://127.0.0.1:8097");
const origin = "http://localhost:3217";
test("mosaico de nueve fotos independientes sin texto con destinos de colección y diseño", async ({
  page,
  request,
}) => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
  const config = await pb.collection("home_mosaic").getOne("mosaicconfig001");
  const previous = await pb.collection("mosaic_tiles").getFullList();
  const photo = readFileSync(".test-runtime/sample.png");
  const file = () => new File([photo], "foto.png", { type: "image/png" });
  const ids: string[] = [];
  let collectionId = "",
    designId = "";
  try {
    for (const tile of previous)
      await pb.collection("mosaic_tiles").update(tile.id, { published: false });
    const c = new FormData();
    c.set("name", "Colección destino mosaico");
    c.set("slug", "destino-mosaico");
    c.set("description", "Colección de prueba");
    c.set("image", file());
    c.set("published", "true");
    collectionId = (await pb.collection("collections").create(c)).id;
    const d = new FormData();
    d.set("name", "Diseño destino mosaico");
    d.set("description", "Detalle del diseño independiente");
    d.set("collection", collectionId);
    d.set("image", file());
    d.set("published", "true");
    designId = (await pb.collection("designs").create(d)).id;
    for (let i = 0; i < 8; i++) {
      const f = new FormData();
      f.set("image", file());
      f.set("target", "/destino-mosaico");
      f.set("published", "true");
      f.set("priority", String(i));
      ids.push((await pb.collection("mosaic_tiles").create(f)).id);
    }
    expect((await request.get("/api/admin/mosaic")).status()).toBe(401);
    await page.goto("/admin/login");
    await page
      .getByLabel("Correo", { exact: true })
      .fill(process.env.STAFF_EMAIL!);
    await page
      .getByLabel("Contraseña", { exact: true })
      .fill(process.env.STAFF_PASSWORD!);
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await page.waitForURL("**/admin");
    await page.goto("/admin/mosaico");
    await page.getByRole("button", { name: "+ Nuevo", exact: true }).click();
    await page
      .getByLabel("Foto del mosaico (hasta 5 MB)", { exact: true })
      .setInputFiles({
        name: "nueva.png",
        mimeType: "image/png",
        buffer: photo,
      });
    await page
      .getByLabel("Enlace del diseño o colección", { exact: true })
      .fill(`https://alfombras.catamarca.io/disenos/${designId}`);
    await page.getByLabel("Publicar en el sitio", { exact: true }).check();
    await page
      .getByRole("button", { name: "Guardar y publicar", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "Contenido guardado" }),
    ).toBeVisible();
    const created = await pb
      .collection("mosaic_tiles")
      .getFirstListItem(`target="/disenos/${designId}"`);
    ids.push(created.id);
    const multipart = {
      image: { name: "diez.png", mimeType: "image/png", buffer: photo },
      target: "/destino-mosaico",
      published: "true",
    };
    const tenth = await page.request.post("/api/admin/mosaic_tiles", {
      headers: { origin },
      multipart,
    });
    expect(tenth.status()).toBe(400);
    expect((await tenth.json()).message).toContain("9 imágenes");
    const invalid = await page.request.patch(
      `/api/admin/mosaic_tiles/${created.id}`,
      {
        headers: { origin },
        multipart: { target: "https://otro.example/tienda" },
      },
    );
    expect(invalid.status()).toBe(400);
    const foreign = await page.request.patch("/api/admin/mosaic", {
      headers: { origin: "https://otro.example" },
      data: { title: "Intruso", enabled: false },
    });
    expect(foreign.status()).toBe(403);
    await page
      .getByLabel("Mostrar mosaico en el Home", { exact: true })
      .check();
    await page
      .getByRole("button", { name: "Guardar mosaico", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "Mosaico guardado" }),
    ).toBeVisible();
    await page.goto("/");
    const section = page.locator("#piezas-destacadas");
    await expect(section.getByRole("link")).toHaveCount(9);
    await expect(section.locator("a span,a p,a h3")).toHaveCount(0);
    await expect(section.locator('a[href^="/tienda"]')).toHaveCount(0);
    expect(
      await section
        .getByRole("link")
        .first()
        .evaluate(
          (el) =>
            getComputedStyle(el.parentElement!).gridTemplateColumns.split(" ")
              .length,
        ),
    ).toBe(3);
    await section
      .getByRole("link", { name: "Ver Diseño destino mosaico", exact: true })
      .click();
    await expect(page).toHaveURL(`${origin}/disenos/${designId}`);
    await expect(
      page.getByRole("heading", {
        name: "Diseño destino mosaico",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Detalle del diseño independiente", { exact: true }),
    ).toBeVisible();
    await page.goto("/");
    await section
      .getByRole("link", { name: "Ver Colección destino mosaico", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(`${origin}/destino-mosaico`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(section.getByRole("link")).toHaveCount(9);
    await section.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/mosaico-independiente-movil.png",
      fullPage: true,
    });
    await pb
      .collection("collections")
      .update(collectionId, { published: false });
    await page.reload();
    await expect(section).toHaveCount(0);
  } finally {
    for (const id of ids) await pb.collection("mosaic_tiles").delete(id);
    if (designId) await pb.collection("designs").delete(designId);
    if (collectionId) await pb.collection("collections").delete(collectionId);
    for (const tile of previous)
      await pb
        .collection("mosaic_tiles")
        .update(tile.id, { published: tile.published });
    await pb
      .collection("home_mosaic")
      .update(config.id, { title: config.title, enabled: config.enabled });
  }
});
