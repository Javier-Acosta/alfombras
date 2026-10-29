import Link from "next/link";
import type { MosaicItem } from "@/lib/mosaic-values";
import styles from "./mosaic.module.css";
export function MosaicGrid({ items }: { items: MosaicItem[] }) {
  return (
    <div className={styles.grid}>
      {items.slice(0, 9).map((item) => (
        <Link
          key={item.id}
          className={styles.tile}
          href={item.target}
          aria-label={`Ver ${item.label}`}
        >
          <img src={item.imageUrl} alt="" loading="lazy" />
        </Link>
      ))}
    </div>
  );
}
