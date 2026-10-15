import { notFound } from "next/navigation";
import { isCollection } from "@/lib/admin-fields";
import { AdminCollection } from "@/components/admin-collection";
export default async function Page({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  if (!isCollection(collection)) notFound();
  return <AdminCollection collection={collection} />;
}
