import { published, fileUrl, type Content } from "@/lib/content";
import { createPocketBase } from "@/lib/pocketbase";
import { collectionPath } from "@/lib/collection-path";
import {
  MOSAIC_ID,
  MOSAIC_LIMIT,
  type MosaicConfig,
  type MosaicItem,
} from "@/lib/mosaic-values";
import { MosaicGrid } from "./mosaic-grid";
import styles from "./mosaic.module.css";
export async function HomeMosaic() {
  let config: MosaicConfig;
  let items: MosaicItem[];
  try {
    config = await createPocketBase()
      .collection("home_mosaic")
      .getOne<MosaicConfig>(MOSAIC_ID);
    if (!config.enabled) return null;
    const [tiles, collections, designs] = await Promise.all([
      published<Content & { target: string }>("mosaic_tiles"),
      published("collections"),
      published("designs"),
    ]);
    const destinations = new Map([
      ...collections.map((c) => [collectionPath(c), c.name] as const),
      ...designs.map((d) => [`/disenos/${d.id}`, d.name] as const),
    ]);
    items = tiles
      .filter((t) => t.image && destinations.has(t.target))
      .slice(0, MOSAIC_LIMIT)
      .map((t) => ({
        id: t.id,
        target: t.target,
        label: destinations.get(t.target)!,
        imageUrl: fileUrl(t.collectionId, t.id, t.image)!,
      }));
  } catch {
    return null;
  }
  if (!items.length) return null;
  return (
    <section
      className={styles.section}
      aria-labelledby="home-mosaic-title"
      id="piezas-destacadas"
    >
      <div className={styles.heading}>
        <p className={styles.eyebrow}>SELECCIÓN DE LA FÁBRICA</p>
        <h2 id="home-mosaic-title">{config.title}</h2>
      </div>
      <MosaicGrid items={items} />
    </section>
  );
}
