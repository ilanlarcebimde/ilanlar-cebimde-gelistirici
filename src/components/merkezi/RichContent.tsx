"use client";

/**
 * Zengin metin içeriği (HTML); XSS için tehlikeli içerik gelmeyeceği varsayılır (admin editör çıktısı).
 */
export function RichContent({ html }: { html: string | null }) {
  if (!html?.trim()) return null;
  return (
    <div
      className="merkezi-rich-content prose prose-slate max-w-none text-[15px] leading-7 prose-headings:font-semibold prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline prose-p:text-slate-700 prose-p:leading-7 prose-p:first:mt-0 prose-p:last:mb-0 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 prose-li:leading-7 prose-blockquote:my-4 prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
