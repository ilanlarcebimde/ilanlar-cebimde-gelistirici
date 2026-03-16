import Link from "next/link";
import { VisaNewsPostForm } from "../VisaNewsPostForm";

export default function AdminNewInternationalNewsPage() {
  return (
    <div className="space-y-4">
      <Link href="/admin/posts/new" className="text-sm text-sky-600 hover:underline">
        ← Yeni icerik secimine don
      </Link>
      <VisaNewsPostForm />
    </div>
  );
}
