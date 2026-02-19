import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * İlana Git tıklaması: post_id ile kayıt bulunur, source_url'e 302 redirect.
 * İleride burada tıklama kaydı (analytics) tutulabilir.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params;
  if (!post_id) {
    return NextResponse.redirect(new URL("/yurtdisi-is-ilanlari", _req.url), 302);
  }

  const supabase = getSupabaseAdmin();
  const { data: post } = await supabase
    .from("job_posts")
    .select("source_url")
    .eq("id", post_id)
    .single();

  const url = post?.source_url?.trim();
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    return NextResponse.redirect(url, 302);
  }

  return NextResponse.redirect(new URL("/yurtdisi-is-ilanlari", _req.url), 302);
}
