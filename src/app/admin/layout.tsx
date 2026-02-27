import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/ssr";

const NAV = [
  { href: "/admin/posts", label: "İçerikler" },
  { href: "/admin/posts/new", label: "Yeni içerik" },
  { href: "/admin/seo", label: "SEO sayfaları" },
  { href: "/admin/tags", label: "Etiketler" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?next=" + encodeURIComponent("/admin"));

  const { data: adminRow } = await supabase
    .from("app_admin")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) redirect("/giris?next=" + encodeURIComponent("/admin"));

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="font-semibold text-slate-900">
            Merkez Admin
          </Link>
          <nav className="flex gap-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
