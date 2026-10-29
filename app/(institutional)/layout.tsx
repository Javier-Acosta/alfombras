import { SiteFrame } from "@/components/site-frame";
export const dynamic = "force-dynamic";
export default async function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteFrame>
      <main id="contenido">{children}</main>
    </SiteFrame>
  );
}
