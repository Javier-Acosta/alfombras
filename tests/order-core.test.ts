import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMosaic } from "../lib/mosaic-values.ts";
import { normalizeMosaicLink } from "../lib/mosaic-link.ts";
test("el enlace del mosaico admite direcciones locales y completas del sitio", () => {
  const origins = ["http://localhost:3000", "https://alfombras.catamarca.io"];
  assert.equal(normalizeMosaicLink(" /alfombras ", origins), "/alfombras");
  assert.equal(
    normalizeMosaicLink(
      "https://alfombras.catamarca.io/lados-de-cama/",
      origins,
    ),
    "/lados-de-cama",
  );
  assert.equal(
    normalizeMosaicLink(
      "http://localhost:3000/disenos/abcdefghijklmno",
      origins,
    ),
    "/disenos/abcdefghijklmno",
  );
  for (const value of [
    "https://otro.example/alfombras",
    "//otro.example/alfombras",
    "javascript:alert(1)",
    "alfombras",
    "/\\otro.example",
    "https://usuario@alfombras.catamarca.io/alfombras",
  ])
    assert.throws(() => normalizeMosaicLink(value, origins));
});

test("mosaico valida título y activación sin vincular productos", () => {
  assert.deepEqual(
    parseMosaic({ title: "  Piezas destacadas  ", enabled: true }),
    { title: "Piezas destacadas", enabled: true },
  );
  for (const input of [
    { title: "", enabled: true },
    { title: "Piezas", enabled: "true" },
    { title: "Piezas", enabled: true, products: [] },
    { title: "x".repeat(81), enabled: true },
  ])
    assert.throws(() => parseMosaic(input));
});
import { salesDateRange, saleInRange } from "../lib/sales-report.ts";

test("el rango de ventas incluye ambos días completos en horario de Argentina", () => {
  const range = salesDateRange("2026-10-15", "2026-10-15");
  assert.equal(range.start, "2026-10-15T03:00:00.000Z");
  assert.equal(range.end, "2026-10-16T02:59:59.999Z");
  assert.equal(saleInRange("2026-10-15 02:59:59.999Z", range), false);
  assert.equal(saleInRange("2026-10-15 03:00:00.000Z", range), true);
  assert.equal(saleInRange("2026-10-16 02:59:59.999Z", range), true);
  assert.equal(saleInRange("2026-10-16 03:00:00.000Z", range), false);
  assert.equal(saleInRange("2026-10-01 00:00:00.000Z", salesDateRange()), true);
  assert.equal(salesDateRange("", "2026-10-15").start, undefined);
  assert.equal(salesDateRange("2026-10-15", "").end, undefined);
  for (const [from, to] of [
    ["2026-02-30", ""],
    ["invalid", ""],
    ["2026-10-16", "2026-10-15"],
  ])
    assert.throws(() => salesDateRange(from, to));
});
import { whatsappUrl } from "../lib/whatsapp.ts";

test("WhatsApp incluye enlace y foto de cada alfombra con importes originales", () => {
  const line = {
    id: "abcdefghijklmno",
    name: "Alfombra de llama",
    quantity: 1,
    unitPriceMinor: 300000000,
    subtotalMinor: 300000000,
  };
  const url = whatsappUrl("5493834304620", {
    reference: "FAC-PRUEBA",
    email: "prueba@example.test",
    totalMinor: 300000000,
    items: [
      {
        ...line,
        productUrl: "https://ejemplo.test/tienda?alfombra=abcdefghijklmno",
        imageUrl: "https://imagenes.test/alfombra.jpg",
      },
      { ...line, name: "Sin foto", imageUrl: "javascript:alert(1)" },
    ],
  });
  const message = new URL(url!).searchParams.get("text")!;
  assert.ok(
    message.includes(
      "Ver alfombra: https://ejemplo.test/tienda?alfombra=abcdefghijklmno",
    ),
  );
  assert.ok(message.includes("Foto: https://imagenes.test/alfombra.jpg"));
  assert.ok(message.includes("3.000.000,00"));
  assert.ok(message.includes("Sin foto"));
  assert.ok(!message.includes("javascript:"));
  assert.ok(!message.includes("undefined"));
  assert.equal(
    whatsappUrl("", {
      reference: "test",
      email: "test@example.test",
      items: [],
      totalMinor: 1,
    }),
    null,
  );
});
import { parseCart, priceOrder } from "../lib/order-core.ts";
import { sanitizeRichText } from "../lib/rich-text.ts";
const id = "abcdefghijklmno";
test("rechaza cantidades inválidas, duplicados y carrito vacío", () => {
  for (const value of [
    [],
    [{ id, quantity: 0 }],
    [{ id, quantity: 1.5 }],
    [{ id, quantity: 100 }],
    [
      { id, quantity: 1 },
      { id, quantity: 1 },
    ],
    { id, quantity: 1 },
  ])
    assert.throws(() => parseCart(value));
});
test("usa precio de catálogo y conserva snapshot", () => {
  const p = {
    id,
    name: "Alfombra",
    priceMinor: 10050,
    published: true,
    sold: false,
  };
  const snapshot = priceOrder(parseCart([{ id, quantity: 2, priceMinor: 1 }]), [
    p,
  ]);
  assert.equal(snapshot.totalMinor, 20100);
  p.priceMinor = 30000;
  assert.equal(snapshot.items[0].unitPriceMinor, 10050);
});
test("rechaza vendido, despublicado o inexistente sin pedido parcial", () => {
  const p = {
    id,
    name: "Alfombra",
    priceMinor: 10050,
    published: true,
    sold: false,
  };
  assert.throws(() =>
    priceOrder([{ id, quantity: 1 }], [{ ...p, sold: true }]),
  );
  assert.throws(() =>
    priceOrder([{ id, quantity: 1 }], [{ ...p, published: false }]),
  );
  assert.throws(() => priceOrder([{ id, quantity: 1 }], []));
});
test("sanitiza HTML ejecutable y esquemas peligrosos", () => {
  const html = sanitizeRichText(
    '<p onclick="alert(1)">Hola</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">A</a><svg/onload=alert(1)>',
  );
  assert.ok(html.includes("<p>Hola</p>"));
  assert.ok(!/onclick|onerror|script|javascript|svg|onload/.test(html));
});
