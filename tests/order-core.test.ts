import { test } from "node:test";
import assert from "node:assert/strict";
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
