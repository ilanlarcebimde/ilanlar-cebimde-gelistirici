/**
 * Ödeme sayfası her istekte güncel içerik dönsün; CDN/tarayıcı önbelleği kullanılmasın.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function OdemeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
