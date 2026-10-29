import { getAdminClient } from "@/lib/admin";
import { isCollection, contentSort, definitions } from "@/lib/admin-fields";
import { editableForm, settingsForm } from "@/lib/admin-content";
import { SETTINGS_ID } from "@/lib/settings-values";
import { sameOrigin } from "@/lib/security";
import { collectionSlug } from "@/lib/collection-path";
import { validCollectionSlug } from "@/lib/collection-path";
import { collectionPath } from "@/lib/collection-path";
import { normalizeMosaicLink } from "@/lib/mosaic-link";
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
        if (field.name === "slug") {
          data.set(
            "slug",
            `${collectionSlug(String(current.name))}-${crypto.randomUUID().slice(0, 8)}`,
          );
          continue;
        }
        const v = current[field.name];
        if (v === undefined || v === null || v === "") continue;
        if (field.type === "gallery") {
          for (const filename of Array.isArray(v) ? v : []) {
            const res = await fetch(pb.files.getURL(current, filename));
            if (!res.ok) throw new Error("No se pudo copiar la galería.");
            const blob = await res.blob();
            data.append(
              "gallery+",
              new File([blob], filename, { type: blob.type }),
            );
          }
        } else if (field.type === "file") {
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
      if (name === "mosaic_tiles") {
        const current = id ? await pb.collection(name).getOne(id) : null;
        let target = normalizeMosaicLink(
          String(data.get("target") || current?.target || ""),
          [
            new URL(request.url).origin,
            process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin,
            "https://alfombras.catamarca.io",
          ],
        );
        if (/^\/colecciones\/[a-z0-9]{15}$/.test(target)) {
          const collection = await pb
            .collection("collections")
            .getOne(target.split("/")[2]);
          if (!collection.published || !collection.slug)
            throw new Error(
              "La colección del enlace debe estar publicada y tener una dirección configurada.",
            );
          target = collectionPath(collection);
        }
        if (/^\/disenos\/[a-z0-9]{15}$/.test(target)) {
          const design = await pb
            .collection("designs")
            .getOne(target.split("/")[2]);
          const parent = await pb
            .collection("collections")
            .getOne(design.collection);
          if (!design.published || !parent.published)
            throw new Error(
              "Publicá el diseño y su colección antes de enlazarlos.",
            );
        } else if (
          target.startsWith("/") &&
          validCollectionSlug(target.slice(1))
        ) {
          await pb.collection("collections").getFirstListItem(
            pb.filter("slug = {:slug} && published = true", {
              slug: target.slice(1),
            }),
          );
        } else
          throw new Error(
            "Pegá el enlace de una colección o un diseño publicado de este sitio.",
          );
        data.set("target", target);
        if (data.get("published") === "true") {
          const others = await pb.collection(name).getList(1, 1, {
            filter: pb.filter("published = true && id != {:id}", {
              id: id || "",
            }),
          });
          if (others.totalItems >= 9)
            throw new Error(
              "El mosaico admite 9 imágenes publicadas. Despublicá una antes de agregar otra.",
            );
        }
      }
      if (name === "collections" && !id && !data.get("slug"))
        data.set(
          "slug",
          collectionSlug(String(data.get("name") || "Colección")),
        );
      if (
        (name === "products" || name === "designs") &&
        (data.has("gallery+") || data.has("gallery-"))
      ) {
        const current = id ? await pb.collection(name).getOne(id) : null;
        const saved: string[] = Array.isArray(current?.gallery)
          ? current.gallery
          : [];
        const removed = data.getAll("gallery-");
        if (removed.some((filename) => !saved.includes(String(filename))))
          throw new Error(
            "La foto que querés quitar ya no está en la galería. Volvé a cargar el diseño.",
          );
        if (
          saved.filter((filename) => !removed.includes(filename)).length +
            data.getAll("gallery+").length >
          10
        )
          throw new Error("La galería admite hasta 10 imágenes adicionales.");
      }
      if ((name === "products" || name === "designs") && data.get("collection"))
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
