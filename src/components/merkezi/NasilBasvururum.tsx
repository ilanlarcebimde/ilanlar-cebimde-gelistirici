"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const CONTENT = {
  title: "Nasıl Başvururum?",
  steps: [
    {
      title: "Adım 1 – Premium'u Aktif Et ve Sayfayı Yenile",
      body: "Premium üyeliğinizi satın aldıktan sonra sayfayı yenileyin. Yenilediğinizde alttaki \"Firma iletişim\" ve \"İş Başvuru Mektubu Oluştur\" bölümleri aktif olacaktır.",
    },
    {
      title: "Adım 2 – Başvuru Mektubunu Oluştur",
      body: "\"İş Başvuru Mektubu Oluştur\" butonuna tıklayın. Açılan panelde:\n• Deneyiminizi\n• Vize / pasaport durumunuzu\n• Maaş beklentinizi\n• Konaklama beklentinizi\n• (Varsa) sertifika / ehliyet gibi önemli bilgileri\ngirerek devam edin. Sistem metninizi profesyonel İngilizce mektuba dönüştürür.",
    },
    {
      title: "Adım 3 – Mektubu Gönder ve Yanıt Bekle",
      body: "Oluşturulan mektubu kopyalayın ve Firma iletişim alanındaki bilgiye gönderin:\n• Telefon numarası varsa → WhatsApp ile gönderin\n• E-posta varsa → Gmail / Outlook gibi e-posta uygulamalarıyla gönderin\nGönderdikten sonra firmadan dönüş bekleyin.",
    },
  ],
  support: {
    title: "Destek",
    lines: [
      "WhatsApp: +90 501 142 10 52",
      "E-posta: destek@ilanlarcebimde.com",
      "E-posta: destek@yurtdisieleman.net",
    ],
  },
  note: "İlanlar Cebimde, Yurtdışı Eleman iştirakidir.",
};

export function NasilBasvururum() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 text-left md:w-auto md:min-w-[200px]"
        aria-expanded={open}
        aria-controls="nasil-basvururum-panel"
        id="nasil-basvururum-btn"
      >
        <span className="font-semibold text-slate-900">{CONTENT.title}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
        </button>
      </div>
      <div
        id="nasil-basvururum-panel"
        role="region"
        aria-labelledby="nasil-basvururum-btn"
        className="overflow-hidden transition-[max-height,opacity] duration-[250ms] ease-out"
        style={{
          maxHeight: open ? "800px" : "0",
          opacity: open ? 1 : 0,
        }}
      >
        <div>
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {CONTENT.steps.map((step, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold text-slate-800">{step.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                  {step.body}
                </p>
              </div>
            ))}
            <div>
              <h4 className="text-sm font-semibold text-slate-800">{CONTENT.support.title}</h4>
              <ul className="mt-1 list-none space-y-0.5 text-sm text-slate-600">
                {CONTENT.support.lines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-slate-500">{CONTENT.note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
