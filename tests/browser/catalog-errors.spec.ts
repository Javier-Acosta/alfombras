import { test, expect } from "@playwright/test";
import PocketBase from "pocketbase";
import { readFileSync } from "node:fs";
process.loadEnvFile(".test-runtime/.env.test");
const f = JSON.parse(readFileSync(".test-runtime/fixtures.json", "utf8"));
const pb = new PocketBase("http://127.0.0.1:8097");
pb.autoCancellation(false);
test.beforeAll(async () => {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL!,
      process.env.POCKETBASE_SUPERUSER_PASSWORD!,
    );
});
test("distingue catálogo vacío de error de carga y conserva imágenes rechazadas", async ({
  page,
  request,
}) => {
  const collection = await pb.collections.getOne("products");
  const products = await pb.collection("products").getFullList();
  try {
    for (const p of products)
      await pb.collection("products").update(p.id, { published: false });
    await page.goto("/tienda");
    await expect(
      page.getByText("Todavía no hay productos publicados."),
    ).toBeVisible();
    await pb.collections.update(collection.id, { listRule: null });
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "No pudimos cargar el catálogo" }),
    ).toBeVisible();
  } finally {
    await pb.collections.update(collection.id, {
      listRule: collection.listRule,
    });
    for (const p of products)
      await pb.collection("products").update(p.id, { published: p.published });
  }
  const login = await request.post("/api/auth/login", {
    headers: { Origin: "http://localhost:3217" },
    data: {
      email: process.env.STAFF_EMAIL,
      password: process.env.STAFF_PASSWORD,
    },
  });
  expect(login.ok()).toBe(true);
  const product = await pb.collection("products").getOne(f.product);
  const invalid = await request.patch(`/api/admin/products/${f.product}`, {
    headers: { Origin: "http://localhost:3217" },
    multipart: {
      image: {
        name: "falsa.png",
        mimeType: "image/png",
        buffer: Buffer.from("no es una imagen"),
      },
    },
  });
  expect(invalid.status()).toBe(400);
  expect((await pb.collection("products").getOne(f.product)).image).toBe(
    product.image,
  );
  const tooLarge = await request.patch(`/api/admin/products/${f.product}`, {
    headers: { Origin: "http://localhost:3217" },
    multipart: {
      image: {
        name: "grande.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(5242881),
      },
    },
  });
  expect(tooLarge.status()).toBe(400);
  expect((await pb.collection("products").getOne(f.product)).image).toBe(
    product.image,
  );
  const preview = await request.post("/api/admin/preview", {
    headers: { Origin: "http://localhost:3217" },
    data: {
      content:
        '<p onclick="alert(1)">Texto</p><script>alert(1)</script><a href="javascript:alert(1)">enlace</a>',
    },
  });
  expect(preview.ok()).toBe(true);
  const data = await preview.json();
  expect(data.html).toContain("<p>Texto</p>");
  expect(data.html).not.toMatch(/script|onclick/);
  const s = await pb.collection("site_settings").getOne("alfombrasconfig");
  try {
    const changed = await request.patch("/api/admin/settings", {
      headers: { Origin: "http://localhost:3217" },
      multipart: {
        address: "Dirección sintética de prueba",
        hours: "Horario de prueba",
      },
    });
    expect(changed.ok()).toBe(true);
    await page.goto("/#ubicacion");
    await expect(page.getByText("Dirección sintética de prueba")).toBeVisible();
  } finally {
    await pb
      .collection("site_settings")
      .update("alfombrasconfig", { address: s.address, hours: s.hours });
  }
  const publicPb = new PocketBase("http://127.0.0.1:8097");
  await expect(
    publicPb
      .collection("staff")
      .create({
        email: "intruso@example.test",
        password: "password1234567890",
        passwordConfirm: "password1234567890",
      }),
  ).rejects.toMatchObject({ status: 403 });
});
