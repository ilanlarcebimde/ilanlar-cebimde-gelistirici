import Link from "next/link";

export default async function AdminPostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">İçerik düzenle</h1>
      <p className="mt-2 text-slate-600">Düzenleme formu burada eklenecek (id: {id})</p>
      <Link href="/admin/posts" className="mt-4 inline-block text-sky-600 hover:underline">
        ← İçerik listesine dön
      </Link>
    </div>
  );
}
