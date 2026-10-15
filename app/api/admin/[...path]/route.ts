import { getAdminClient } from "@/lib/admin";
import { isCollection, contentSort, definitions } from "@/lib/admin-fields";
import { editableForm, settingsForm } from "@/lib/admin-content";
import { SETTINGS_ID } from "@/lib/settings-values";
import { sameOrigin } from "@/lib/security";
type Ctx = { params: Promise<{ path: string[] }> };
async function handle(request: Request, ctx: Ctx) {
  if (request.method !== "GET" && !sameOrigin(request))
    return Response.json({ message: "Origen no permitido." }, { status: 403 });
  const pb = await getAdminClient();
  if (!pb) return Response.json({ message: "No autorizado." }, { status: 401 });
  const parts = (await ctx.params).path;
  const [name, id, operation] = parts;
  if (
    parts.length > 3 ||
    (!isCollection(name) && !["settings", "orders"].includes(name))
  )
    return Response.json({ message: "No encontrado." }, { status: 404 });
  if (id && !/^[a-z0-9]{15}$/.test(id))
    return Response.json(
      { message: "Identificador inválido." },
      { status: 400 },
    );
  try {
    if (name === "settings") {
      if (parts.length !== 1) return new Response(null, { status: 404 });
      if (request.method === "GET")
        return Response.json(
          await pb.collection("site_settings").getOne(SETTINGS_ID),
          { headers: { "Cache-Control": "private, no-store" } },
        );
      if (request.method !== "PATCH")
        return new Response(null, { status: 405 });
      return Response.json(
        await pb
          .collection("site_settings")
          .update(SETTINGS_ID, await settingsForm(await request.formData())),
      );
    }
    if (name === "orders") {
      if (request.method !== "GET" || parts.length > 2)
        return new Response(null, { status: 405 });
      const records = id
        ? await pb.collection(name).getOne(id)
        : await pb.collection(name).getFullList({ sort: "-created" });
      return Response.json(records, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    if (request.method === "GET" && !operation)
      return Response.json(
        id
          ? await pb.collection(name).getOne(id)
          : await pb.collection(name).getFullList({ sort: contentSort(name) }),
        { headers: { "Cache-Control": "private, no-store" } },
      );
    if (request.method === "DELETE" && id && !operation) {
      await pb.collection(name).delete(id);
      return Response.json({ ok: true });
    }
    if (request.method === "POST" && id && operation === "duplicate") {
      if (name === "institutional_pages")
        throw new Error(
          "Las páginas institucionales tienen una única versión por sección.",
        );
      const current = await pb.collection(name).getOne(id);
      const data = new FormData();
      for (const field of definitions[name]) {
        const v = current[field.name];
        if (v === undefined || v === null || v === "") continue;
        if (field.type === "file") {
          const url = pb.files.getURL(current, v);
          const res = await fetch(url);
          if (!res.ok) throw new Error("No se pudo copiar la imagen.");
          const blob = await res.blob();
          const file = new File([blob], v, { type: blob.type });
          data.set(field.name, file);
        } else data.set(field.name, String(v));
      }
      data.set("published", "false");
      data.set("priority", String(current.priority || 0));
      return Response.json(
        await pb.collection(name).create(await editableForm(name, data)),
      );
    }
    if (operation) return new Response(null, { status: 404 });
    if (
      (request.method === "POST" && !id) ||
      (request.method === "PATCH" && id)
    ) {
      const data = await editableForm(name, await request.formData());
      if (name === "products" && data.get("collection"))
        await pb
          .collection("collections")
          .getOne(String(data.get("collection")));
      return Response.json(
        id
          ? await pb.collection(name).update(id, data)
          : await pb.collection(name).create(data),
      );
    }
    return new Response(null, { status: 405 });
  } catch (e) {
    return Response.json(
      {
        message:
          e instanceof Error && !("status" in e)
            ? e.message
            : "No se pudo guardar o cargar el contenido. Revisá campos requeridos, imagen y conexión.",
      },
      { status: 400 },
    );
  }
}
export const GET = handle,
  POST = handle,
  PATCH = handle,
  DELETE = handle;
