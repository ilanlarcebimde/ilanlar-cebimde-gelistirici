import type { ReactNode } from "react";

type DuyuruContentProps = {
  structuredSummary: string | null;
  userImpact: string | null;
  applicationImpact: string | null;
  summary: string | null;
  htmlContent: string | null;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <div className="text-[15px] leading-7 text-slate-700">{children}</div>
    </section>
  );
}

export function DuyuruContent({
  structuredSummary,
  userImpact,
  applicationImpact,
  summary,
  htmlContent,
}: DuyuruContentProps) {
  return (
    <article className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <Section title="Bu duyuru ne anlatıyor?">
        <p>{structuredSummary?.trim() || summary?.trim() || "Duyurunun kapsamı resmi kaynak metinleri temel alınarak özetlenmiştir."}</p>
      </Section>

      <Section title="Çalışan açısından riskler">
        {userImpact?.trim() ? (
          <p>{userImpact.trim()}</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            <li>Belgesiz veya eksik başvuru, süreçte gecikme ve ret riski doğurabilir.</li>
            <li>Resmi tarihler ve geçerlilik koşulları kaçırıldığında hak kaybı oluşabilir.</li>
            <li>Eksik bilgiyle yapılan iş değişikliği kararları hukuki sorunlara yol açabilir.</li>
          </ul>
        )}
      </Section>

      <Section title="Yasal çalışmanın sağladığı avantajlar">
        <ul className="list-disc space-y-1 pl-5">
          <li>Başvuru sürecinin izlenebilir ve güvenli ilerlemesini sağlar.</li>
          <li>Çalışma izni, sosyal haklar ve resmi prosedürlerde koruma sunar.</li>
          <li>Uzun vadeli oturum ve iş geçişlerinde daha güçlü hukuki zemin oluşturur.</li>
        </ul>
      </Section>

      <Section title="İşveren açısından etkiler">
        {applicationImpact?.trim() ? (
          <p>{applicationImpact.trim()}</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            <li>Uyumsuz işe alım adımları kurum için yaptırım riskini artırabilir.</li>
            <li>Doğru prosedür takibi operasyonel süreklilik ve denetim güveni sağlar.</li>
            <li>Güncel duyurulara uyum, işe alım planlarının daha öngörülebilir olmasını sağlar.</li>
          </ul>
        )}
      </Section>

      <Section title="Kimler için önemli?">
        <ul className="list-disc space-y-1 pl-5">
          <li>Yurtdışında çalışmayı planlayan adaylar</li>
          <li>İşe alım ve insan kaynakları ekipleri</li>
          <li>Danışmanlık ve başvuru süreçlerini yöneten profesyoneller</li>
        </ul>
      </Section>

      {htmlContent?.trim() ? (
        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Detaylı Duyuru Metni</h2>
          <div
            className="prose prose-slate max-w-none prose-headings:mt-7 prose-headings:mb-3 prose-p:my-4 prose-p:leading-8 prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-li:leading-7"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </section>
      ) : null}
    </article>
  );
}
