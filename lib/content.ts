import "server-only";
import type { RecordModel } from "pocketbase";
import { createPocketBase } from "./pocketbase";
import { contentSort } from "./admin-fields";
export { fileUrl } from "./pocketbase";
export type Content = RecordModel & {
  title: string;
  name: string;
  content: string;
  description: string;
  image: string;
  summary: string;
  published_on: string;
  url: string;
  key: string;
};
export type Product = Content & {
  priceMinor: number;
  currency: string;
  sold: boolean;
  measurements: string;
  materials: string;
  collection: string;
  published: boolean;
  imageUrl?: string;
};
export async function published<T = Content>(name: string, filter = "") {
  const pb = createPocketBase();
  return pb
    .collection(name)
    .getFullList<T>({
      filter: `published = true${filter ? ` && (${filter})` : ""}`,
      sort: contentSort(name),
      requestKey: null,
    });
}
export async function publicOne(name: string, id: string) {
  if (!/^[a-z0-9]{15}$/.test(id)) return null;
  try {
    const r = await createPocketBase().collection(name).getOne<Content>(id);
    return r.published ? r : null;
  } catch (e) {
    if (e && typeof e === "object" && "status" in e && e.status === 404)
      return null;
    throw e;
  }
}
export async function publicHome() {
  const data = await Promise.all(
    ["news", "collections", "banners", "reels", "institutional_pages"].map(
      async (name) => {
        try {
          return { name, items: await published(name), error: false };
        } catch {
          return { name, items: [] as Content[], error: true };
        }
      },
    ),
  );
  return Object.fromEntries(data.map((d) => [d.name, d]));
}
