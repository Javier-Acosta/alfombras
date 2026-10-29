import Link from "next/link";
import { notFound } from "next/navigation";
import { publicOne, fileUrl } from "@/lib/content";
import { collectionPath } from "@/lib/collection-path";
import { ProductGallery } from "@/components/product-gallery";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const design = await publicOne("designs", (await params).id);
  if (!design) notFound();
  const collection = await publicOne("collections", design.collection);
  if (!collection) notFound();
  const files: string[] = [
    design.image,
    ...(Array.isArray(design.gallery) ? design.gallery : []),
  ];
  return (
    <article className="news-detail">
      <Link className="news-back" href={collectionPath(collection)}>
        ← Volver a {collection.name}
      </Link>
      <h1>{design.name}</h1>
      <ProductGallery
        name={design.name}
        images={files
          .map((f) => fileUrl(design.collectionId, design.id, f))
          .filter((url): url is string => Boolean(url))}
      />
      <p className="news-body">{design.description}</p>
    </article>
  );
}
