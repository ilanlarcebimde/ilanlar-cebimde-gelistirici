"use client";

/**
 * Zengin metin içeriği (HTML); XSS için tehlikeli içerik gelmeyeceği varsayılır (admin editör çıktısı).
 */
export function RichContent({ html }: { html: string | null }) {
  if (!html?.trim()) return null;
  return (
    <div
      className="merkezi-rich-content prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
