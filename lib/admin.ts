import "server-only";
import { cookies } from "next/headers";
import { createPocketBase } from "./pocketbase";
export const SESSION_COOKIE = "alfombras_staff";
export async function getAdminClient() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const pb = createPocketBase();
  pb.authStore.save(token);
  try {
    await pb.collection("staff").authRefresh();
    return pb;
  } catch {
    return null;
  }
}
