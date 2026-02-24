import type { GuideReadingJson } from "@/types/job-guide-reading";

/**
 * Örnek rehber JSON — modal demo ve API şeması referansı.
 * API (örn. Gemini) aynı shape'te dönecek.
 */
export function getMockGuideJson(meta: {
  title: string;
  location?: string;
  country?: string;
  source_name?: string;
  source_url?: string;
}): GuideReadingJson {
  return {
    meta: {
      title: meta.title,
      location: meta.location ?? undefined,
      country: meta.country ?? undefined,
      source_name: meta.source_name ?? undefined,
      source_url: meta.source_url ?? undefined,
    },
    modules: {
      apply_guide: {
        summary:
          "EURES ilanında 'How to apply' bölümündeki linke tıklayın; yönlendirilen sitede kayıt olun, CV yükleyin, ilan detaylarını inceleyin ve Apply ile başvurun. E-posta ile başvuru belirtilmişse ayrıca o adrese CV gönderin.",
        steps: [
          "EURES ilanındaki 'How to apply' linkine tıklayın.",
          "Yönlendirilen sitede 'Login or Register' ile kayıt olun.",
          "Profilinize İngilizce CV (PDF) yükleyin.",
          "İlan detaylarını ve son başvuru tarihini kontrol edin.",
          "Sayfadaki 'Apply' butonu veya e-posta ile başvurun.",
        ],
        details_md:
          "EURES portalı sizi genelde işverenin kariyer sayfasına veya ulusal iş kurumuna yönlendirir. Kayıt sonrası CV'nizi yükleyip ilan sayfasından başvurunuzu tamamlayın. Metinde 'send your CV to ...@...' gibi bir e-posta varsa, garanti için o adrese de CV gönderin.",
      },
      documents: {
        required: ["CV (İngilizce, PDF)", "Kimlik / Pasaport"],
        optional: [
          "Ustalık / MYK belgeleri (İngilizce, noter onaylı)",
          "SGK hizmet dökümü",
          "Adli sicil kaydı (İngilizce)",
        ],
        notes: [
          "Zorunlu belgeler ilan metninden çıkarıldı. Opsiyonel liste sektör/pozisyon/ülkeye göre olası belgelerdir; ilanda yazmıyorsa resmi kaynaklardan teyit edin.",
        ],
      },
      work_permit_visa: {
        summary:
          "Önce pasaport (tercihen 2–10 yıl geçerli), sonra işverenin çalışma izni başvurusu; ardından vize (VFS Global randevusu, evrak teslimi). Varışta oturum/kayıt işlemi gerekebilir.",
        steps: [
          "Türkiye'den pasaport: randevu.nvi.gov.tr veya ALO 199.",
          "İşveren sizin adınıza çalışma izni alır; size referans/onay belgesi gönderir.",
          "VFS Global üzerinden vize randevusu alın; evrak dosyası ile başvurun.",
          "Varışta ilgili ülke oturum/polis kaydı (ör. IRP, belediye) yaptırın.",
        ],
        official_sources: ["VFS Global", "Konsolosluk / Büyükelçilik"],
        note_if_no_official:
          "Resmi kaynaklar ilan/ülkeye göre değişir; konsolosluk ve ilgili devlet vize sayfalarını kontrol edin.",
      },
      salary_life_calc: {
        summary:
          "Brüt maaş vergi ve kesintilerle nete düşer; konaklama, yemek, ulaşım ve faturalar aylık gideri oluşturur. Şirket konaklama/ulaşım sağlıyorsa cebinize kalan artar.",
        assumptions: [
          "Haftalık 39–40 saat, fazla mesai varsa ek ücret.",
          "Vergi oranları ülkeye göre değişir (bekar/evli farkı).",
          "Konaklama şirket tarafından sağlanıyorsa kira 0 kabul edilebilir.",
        ],
        ranges: [
          { label: "Net maaş (örnek)", range: "2.500 € – 3.200 €" },
          { label: "Aylık yaşam gideri (tek kişi)", range: "1.100 € – 1.700 €" },
        ],
        note_if_unknown:
          "Rakamlar örnek/ortalama; ilan ve ülke güncel bilgilerle teyit edilmelidir.",
      },
      risk_assessment: {
        level: "Orta",
        items: [
          {
            title: "Dil şartı",
            why: "İlan İngilizce iletişim istiyor.",
            what_to_do: "CV ve başvuru metnini İngilizce hazırlayın; gerekirse dil sertifikası ekleyin.",
          },
          {
            title: "Çalışma izni",
            why: "Türk vatandaşları için çalışma izni ve vize gerekebilir.",
            what_to_do: "İşverenin izin sürecini netleştirin; evrak listesini erkenden hazırlayın.",
          },
        ],
      },
      fit_analysis: {
        score0_100: 72,
        strengths: [
          "İlanla uyumlu mesleki deneyim.",
          "Temel belgeler (CV, kimlik) mevcut.",
        ],
        gaps: [
          "İngilizce seviyesi ilanda belirtilenle eşleşmeli.",
          "Ülkeye özel sertifika/onay gerekebilir.",
        ],
        next_actions: [
          "CV'yi ilan anahtar kelimelerine göre güncelleyin.",
          "Eksik belgeleri (pasaport, adli sicil vb.) sıraya koyun.",
        ],
      },
      one_week_plan: {
        days: {
          "Gün 1": [
            "İlanı ve 'How to apply' linkini inceleyin.",
            "Hedef sitede hesap açın, CV yükleyin.",
          ],
          "Gün 2": [
            "Profil bilgilerini tamamlayın.",
            "Başvuru formunu doldurun veya e-posta ile CV gönderin.",
          ],
          "Gün 3–4": [
            "Eksik belgeleri listeleyin (pasaport, adli sicil vb.).",
            "Randevu/başvuru tarihlerini not alın.",
          ],
          "Gün 5–7": [
            "Başvuru onayı / referans numarası takibi.",
            "Vize/çalışma izni adımlarını planlayın.",
          ],
        },
      },
    },
  };
}
