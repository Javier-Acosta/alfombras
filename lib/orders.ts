import "server-only";
import { createHash } from "node:crypto";
import { privilegedClient } from "./server-pb";
import type { OrderLine } from "./order-core";
import { createPocketBase, fileUrl } from "./pocketbase";
import type { WhatsAppLine } from "./whatsapp";
export { whatsappUrl } from "./whatsapp";
export const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export async function privateOrder(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const pb = await privilegedClient();
  const r = await pb.collection("orders").getList(1, 1, {
    filter: pb.filter("tokenHash = {:hash}", { hash: hash(token) }),
  });
  return r.items[0] || null;
}
export async function orderMediaLinks(
  items: OrderLine[],
): Promise<WhatsAppLine[]> {
  const pb = createPocketBase();
  return Promise.all(
    items.map(async (line) => {
      let productUrl: string | undefined;
      try {
        const url = new URL(
          "/tienda",
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        );
        url.searchParams.set("alfombra", line.id);
        productUrl = url.href;
      } catch {
        /* El resumen sigue disponible si falta una URL válida. */
      }
      try {
        // Consulta pública: no incorporar imágenes de productos despublicados.
        const product = await pb
          .collection("products")
          .getOne(line.id, { fields: "id,collectionId,image,published" });
        return {
          ...line,
          productUrl,
          imageUrl: product.published
            ? fileUrl(product.collectionId, product.id, product.image)
            : undefined,
        };
      } catch {
        return { ...line, productUrl };
      }
    }),
  );
}
