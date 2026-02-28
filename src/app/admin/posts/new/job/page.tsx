import Link from "next/link";
import { NewPostForm } from "../NewPostForm";

export default function AdminNewJobPostPage() {
  return (
    <div className="space-y-4">
      <Link href="/admin/posts/new" className="text-sm text-sky-600 hover:underline">
        ← Yeni içerik seçimine dön
      </Link>
      <NewPostForm />
    </div>
  );
}
