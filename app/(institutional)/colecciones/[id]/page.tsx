import { notFound, redirect } from "next/navigation";
import { publicOne } from "@/lib/content";
import { collectionPath } from "@/lib/collection-path";
import { CollectionPage } from "@/components/collection-page";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const c = await publicOne("collections", (await params).id);
  if (!c) notFound();
  if (c.slug) redirect(collectionPath(c));
  return <CollectionPage collection={c} />;
}
