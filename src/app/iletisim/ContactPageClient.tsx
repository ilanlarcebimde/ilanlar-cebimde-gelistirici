"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/layout/Footer";
import { Copy, Info } from "lucide-react";

const WHATSAPP_POPOVER_TEXT =
  "WhatsApp müşteri hizmetleri hattı Yurtdışı Eleman çatısı altında yönetilmektedir.";
const WHATSAPP_NUMBER = "+90 501 142 10 52";
const WHATSAPP_LINK = "https://wa.me/905011421052";

const SUBJECT_OPTIONS = [
  { value: "", label: "Konu seçin" },
  { value: "destek", label: "Destek" },
  { value: "dilek-oneri", label: "Dilek / Öneri" },
  { value: "sikayet", label: "Şikayet" },
  { value: "diger", label: "Diğer" },
] as const;

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClick: () => void) {
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClick();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onClick]);
}

export function ContactPageClient() {
  const router = useRouter();
  const [whatsappPopoverOpen, setWhatsappPopoverOpen] = useState(false);
  const whatsappPopoverRef = useRef<HTMLDivElement>(null);
  const [formSent, setFormSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    kvkk: false,
  });

  useClickOutside(whatsappPopoverRef, () => setWhatsappPopoverOpen(false));
  useEffect(() => {
    if (!whatsappPopoverOpen) return;
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && setWhatsappPopoverOpen(false);
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [whatsappPopoverOpen]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => setFormSent(false), 5000);
  };

  return (
    <>
      <Header onLoginClick={() => router.push("/")} />
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
          {/* Hero */}
          <section className="mb-12">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              İletişim
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Dilek, öneri, şikayet ve destek talepleriniz için aşağıdaki kanallardan bize
              ulaşabilirsiniz.
            </p>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Sol: İletişim kartı */}
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Dilek / Öneri / Şikayet ve Destek
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Aşağıdaki e-posta ve WhatsApp hattı üzerinden bize ulaşabilirsiniz. Talepleriniz
                  değerlendirilerek en kısa sürede size dönüş yapılmaya çalışılır.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      E-posta
                    </p>
                    <div className="mt-1.5 space-y-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="min-w-0 flex-1 text-sm font-medium text-slate-800 [overflow-wrap:anywhere]"
                          title="destek@ilanlarcebimde.com"
                        >
                          destek@ilanlarcebimde.com
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("destek@ilanlarcebimde.com")}
                          className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label="E-postayı kopyala"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="min-w-0 flex-1 text-sm font-medium text-slate-800 [overflow-wrap:anywhere]"
                          title="destek@yurtdisieleman.net"
                        >
                          destek@yurtdisieleman.net
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("destek@yurtdisieleman.net")}
                          className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label="E-postayı kopyala"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      WhatsApp
                    </p>
                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
                      <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 text-sm font-medium text-slate-800 [overflow-wrap:anywhere] hover:text-slate-600"
                      >
                        {WHATSAPP_NUMBER}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(WHATSAPP_NUMBER)}
                        className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="WhatsApp numarasını kopyala"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <div className="relative shrink-0" ref={whatsappPopoverRef}>
                        <button
                          type="button"
                          onClick={() => setWhatsappPopoverOpen((o) => !o)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label="WhatsApp hakkında bilgi"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        {whatsappPopoverOpen && (
                          <div
                            className="absolute left-1/2 top-full z-50 mt-1 w-[min(280px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-lg"
                            role="tooltip"
                          >
                            {WHATSAPP_POPOVER_TEXT}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Yanıt Süremiz */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Yanıt Süremiz</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Mesajlarınıza en kısa sürede dönüş yapmaya çalışıyoruz. Talepler genellikle aynı
                  iş günü içinde yanıtlanır; yoğunluk dönemlerinde süre birkaç iş gününe uzayabilir.
                </p>
              </section>

              {/* Destek Kapsamı */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Destek Kapsamı</h2>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-slate-600">
                  <li>CV paketi ve başvuru süreci soruları</li>
                  <li>Teknik sorunlar (giriş, ödeme, panel, form / sesli asistan)</li>
                  <li>İlan yönlendirme ve eşleştirme ile ilgili sorular</li>
                </ul>
              </section>

              {/* Yönlendirme Notu */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Yönlendirme Notu</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Resmî ve doğru başvuru kanallarına yönlendirme yaklaşımımız gereği, konunuz
                  kapsamında size en uygun resmî kanal bilgisini paylaşmaya özen gösteriyoruz.
                </p>
              </section>
            </div>

            {/* Sağ: Form kartı */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-lg font-semibold text-slate-900">Mesaj Gönderin</h2>
              <p className="mt-1 text-sm text-slate-600">
                Formu doldurarak talebinizi iletebilirsiniz. Acil durumlarda WhatsApp hattımızı
                kullanabilirsiniz.
              </p>

              {formSent && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Mesajınız alınmıştır. En kısa sürede dönüş yapacağız.
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700">
                    Ad Soyad <span className="text-slate-400">(opsiyonel)</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    placeholder="Adınız soyadınız"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700">
                    E-posta <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    placeholder="ornek@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-700">
                    Konu
                  </label>
                  <select
                    id="contact-subject"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    {SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700">
                    Mesaj <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    placeholder="Mesajınızı yazın..."
                  />
                </div>
                <div className="flex items-start gap-2">
                  <input
                    id="contact-kvkk"
                    type="checkbox"
                    checked={form.kvkk}
                    onChange={(e) => setForm((f) => ({ ...f, kvkk: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-400"
                  />
                  <label htmlFor="contact-kvkk" className="text-sm text-slate-600">
                    Kişisel verilerimin iletişim talebimin karşılanması amacıyla işlenmesini kabul
                    ediyorum. <span className="text-slate-400">(Opsiyonel)</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Mesaj Gönder
                </button>
                <p className="text-center text-xs text-slate-500">
                  Acil durumlarda WhatsApp hattımızı kullanabilirsiniz.
                </p>
              </form>
            </section>
          </div>

          <div className="mt-10">
            <Link href="/" className="text-sm text-slate-600 underline hover:text-slate-900">
              ← Ana sayfaya dön
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
