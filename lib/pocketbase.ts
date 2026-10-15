import PocketBase from "pocketbase";

export function createPocketBase() {
  const pb = new PocketBase(
    process.env.POCKETBASE_URL ||
      process.env.NEXT_PUBLIC_POCKETBASE_URL ||
      "http://127.0.0.1:8090",
  );
  pb.autoCancellation(false);
  return pb;
}

export function fileUrl(collection: string, id: string, name?: string) {
  if (!name) return undefined;
  const base =
    process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
  return `${base}/api/files/${encodeURIComponent(collection)}/${encodeURIComponent(id)}/${encodeURIComponent(name)}`;
}
