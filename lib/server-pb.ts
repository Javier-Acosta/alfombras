import "server-only";
import { createPocketBase } from "./pocketbase";

export async function privilegedClient() {
  const email = process.env.POCKETBASE_SUPERUSER_EMAIL;
  const password = process.env.POCKETBASE_SUPERUSER_PASSWORD;
  if (!email || !password)
    throw new Error("El servicio de pedidos no está configurado.");
  const pb = createPocketBase();
  await pb.collection("_superusers").authWithPassword(email, password);
  return pb;
}
