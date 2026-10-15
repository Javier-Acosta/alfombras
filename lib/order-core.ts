export type CartLine = { id: string; quantity: number };
export type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
};
export type PricedProduct = {
  id: string;
  name: string;
  priceMinor: number;
  published: boolean;
  sold: boolean;
};
export function parseCart(input: unknown): CartLine[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 30)
    throw new Error("El carrito debe tener entre 1 y 30 alfombras diferentes.");
  const ids = new Set<string>();
  return input.map((line) => {
    if (
      !line ||
      typeof line !== "object" ||
      typeof line.id !== "string" ||
      !/^[a-z0-9]{15}$/.test(line.id) ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 99 ||
      ids.has(line.id)
    )
      throw new Error(
        "Revisá los productos y cantidades del carrito (1 a 99 unidades).",
      );
    ids.add(line.id);
    return { id: line.id, quantity: line.quantity };
  });
}
export function priceOrder(lines: CartLine[], products: PricedProduct[]) {
  const items: OrderLine[] = lines.map((line) => {
    const p = products.find((p) => p.id === line.id);
    if (!p || !p.published || p.sold)
      throw new Error(
        `La alfombra ${p?.name || line.id} ya no está disponible. Revisá el carrito.`,
      );
    if (!Number.isSafeInteger(p.priceMinor) || p.priceMinor <= 0)
      throw new Error("Uno de los productos tiene un precio inválido.");
    return {
      id: p.id,
      name: p.name,
      quantity: line.quantity,
      unitPriceMinor: p.priceMinor,
      subtotalMinor: p.priceMinor * line.quantity,
    };
  });
  const totalMinor = items.reduce((sum, line) => sum + line.subtotalMinor, 0);
  if (!Number.isSafeInteger(totalMinor) || totalMinor > 10000000000000)
    throw new Error("El pedido supera el importe permitido.");
  return { items, totalMinor };
}
