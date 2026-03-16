import { cleanupDuplicateFirstHeading, splitPlainTextToParagraphs } from "./helpers";

type DuyuruBodyContentProps = {
  htmlContent: string | null;
  pageTitle: string;
};

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function DuyuruBodyContent({ htmlContent, pageTitle }: DuyuruBodyContentProps) {
  const content = htmlContent?.trim() ?? "";
  if (!content) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm text-slate-600">İçerik henüz eklenmemiş.</p>
      </section>
    );
  }

  if (!looksLikeHtml(content)) {
    const paragraphs = splitPlainTextToParagraphs(content);
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="duyuru-body-content text-[15px] leading-8 text-slate-700">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, idx) => (
              <p key={`${idx}-${paragraph.slice(0, 16)}`}>
                {paragraph.split("\n").map((line, lineIdx, arr) => (
                  <span key={`${idx}-${lineIdx}`}>
                    {line}
                    {lineIdx < arr.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
            ))
          ) : (
            <p>{content}</p>
          )}
        </div>
      </section>
    );
  }

  const cleanedHtml = cleanupDuplicateFirstHeading(content, pageTitle);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div
        className="duyuru-body-content max-w-none text-[15px] leading-8 text-slate-700"
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    </section>
  );
}
