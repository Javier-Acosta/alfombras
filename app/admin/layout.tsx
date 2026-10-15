import "../institution.css";
import "../institution-extra.css";
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="institution">{children}</div>;
}
