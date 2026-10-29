import { notFound } from "next/navigation";
import { published } from "@/lib/content";
import { validCollectionSlug } from "@/lib/collection-path";
import { CollectionPage } from "@/components/collection-page";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!validCollectionSlug(slug)) notFound();
  const collections = await published("collections", `slug = "${slug}"`);
  if (collections.length !== 1) notFound();
  return <CollectionPage collection={collections[0]} />;
}
