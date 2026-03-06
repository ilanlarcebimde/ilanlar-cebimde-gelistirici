"use client";

/**
 * Zengin metin içeriği (HTML); XSS için tehlikeli içerik gelmeyeceği varsayılır (admin editör çıktısı).
 */
export function RichContent({ html }: { html: string | null }) {
  if (!html?.trim()) return null;
  return (
    <div
      className="merkezi-rich-content prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline prose-p:mb-3 prose-p:leading-relaxed prose-ul:list-disc prose-ul:pl-6 prose-ul:my-2 prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-2 prose-li:my-0.5 prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
