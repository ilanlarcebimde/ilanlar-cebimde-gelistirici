import Link from "next/link";
import { BlogPostForm } from "../BlogPostForm";

export default function AdminNewBlogPostPage() {
  return (
    <div className="space-y-4">
      <Link href="/admin/posts/new" className="text-sm text-sky-600 hover:underline">
        ← Yeni içerik seçimine dön
      </Link>
      <BlogPostForm />
    </div>
  );
}
