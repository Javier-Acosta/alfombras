import styles from "./shop.module.css";
import { SiteFrame } from "@/components/site-frame";
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SiteFrame>
      <div className={styles.shop}>{children}</div>
    </SiteFrame>
  );
}
