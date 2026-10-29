import { getAdminClient } from "@/lib/admin";
import { collectionPath } from "@/lib/collection-path";
import { sameOrigin } from "@/lib/security";
import { MOSAIC_ID, parseMosaic, type MosaicConfig } from "@/lib/mosaic-values";
export async function GET() {
  const pb = await getAdminClient();
  if (!pb) return Response.json({ message: "No autorizado." }, { status: 401 });
  try {
    const [config, collections, designs] = await Promise.all([
      pb.collection("home_mosaic").getOne<MosaicConfig>(MOSAIC_ID),
      pb
        .collection("collections")
        .getFullList({ filter: "published=true", sort: "name" }),
      pb
        .collection("designs")
        .getFullList({
          filter: "published=true && collection.published=true",
          sort: "name",
        }),
    ]);
    return Response.json(
      {
        config: { title: config.title, enabled: config.enabled },
        destinations: [
          ...collections.map((c) => ({
            value: collectionPath(c),
            label: `Colección: ${c.name}`,
          })),
          ...designs.map((d) => ({
            value: `/disenos/${d.id}`,
            label: `Diseño: ${d.name}`,
          })),
        ],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { message: "No pudimos cargar el mosaico." },
      { status: 503 },
    );
  }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ message: "Origen no permitido." }, { status: 403 });
  const pb = await getAdminClient();
  if (!pb) return Response.json({ message: "No autorizado." }, { status: 401 });
  try {
    const config = parseMosaic(await request.json());
    await pb.collection("home_mosaic").update(MOSAIC_ID, config);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      {
        message:
          "No pudimos guardar el mosaico. Revisá el título y la conexión.",
      },
      { status: 400 },
    );
  }
}
