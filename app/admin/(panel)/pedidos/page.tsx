import { getAdminClient } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AdminOrders, type AdminOrder } from "@/components/admin-orders";
export default async function Page() {
  const pb = await getAdminClient();
  if (!pb) redirect("/admin/login");
  const orders = await pb.collection("orders").getFullList<AdminOrder>({
    sort: "-created",
    fields: "id,reference,created,email,items,totalMinor,archived,status",
  });
  return <AdminOrders orders={orders} />;
}
