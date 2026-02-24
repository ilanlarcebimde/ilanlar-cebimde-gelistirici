import { NextRequest } from "next/server";
import { getSupabaseForUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseForUser(token);
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { user, supabase } : null;
}

/** POST: jobId + stepId + answers alır; "Hayır" cevabı için rehber metnini stream eder. */
export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return new Response("Unauthorized", { status: 401 });

  let body: { jobId?: string; stepId?: string; answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { jobId, stepId, answers } = body;
  if (!jobId || !stepId) {
    return new Response("jobId and stepId required", { status: 400 });
  }

  // İleride: jobId ile DB'den ilan çek (title, location, source_name, snippet...)
  // stepId + answers + job meta ile prompt hazırla, Gemini + (isteğe) grounding
  // Şimdilik demo: "Hayır" cevabına göre kısa rehber metni stream et
  const encoder = new TextEncoder();

  const stepMessages: Record<string, string> = {
    want_translation:
      "Türkçe çeviri için: Tarayıcıda sağ tık → \"Sayfayı çevir\" veya Google Çeviri eklentisi kullanabilirsiniz. İlan metnini kopyalayıp çeviri sitelerine yapıştırarak anlamını çıkarabilirsiniz.",
    want_passport_visa:
      "Pasaport yoksa: randevu.nvi.gov.tr veya ALO 199 ile pasaport randevusu alın. Vize için işverenin çalışma izni/referansı gerekir; sonrasında VFS Global veya konsolosluk üzerinden başvuru yapılır.",
    want_salary_life:
      "Maaş ve yaşam gideri ilan ve ülkeye göre değişir. Genelde brüt maaş vergi kesintisiyle nete düşer; konaklama ve ulaşım şirket tarafından sağlanıyorsa aylık gideriniz düşer.",
    services:
      "Hizmet listesi: Adım adım başvuru rehberi, gerekli belgeler, çalışma izni/vize süreci, maaş/yaşam hesabı, risk değerlendirmesi, uygunluk analizi, haftalık plan. İstediğiniz modülleri panelden seçebilirsiniz.",
    channel:
      "Başvuru kanalı: EURES (ulusal portallara yönlendirir), Glassdoor / diğer portallar (Easy Apply), veya doğrudan işveren (e-posta / kariyer sayfası). İlanın \"How to apply\" bölümüne bakın.",
    cv_ready:
      "CV hazır değilse: Türkçe ve İngilizce CV ile iş başvuru mektubunu tek pakette hazırlatmak için Yurtdışı CV Paketi sayfamızı kullanabilirsiniz. CV79 kuponu ile indirim uygulanır.",
  };

  const text =
    stepMessages[stepId] ??
    `"Hayır" cevabına göre bu adım için:\n- İlanda doğrudan yazmıyorsa tipik belgeler: CV (PDF), pasaport, deneyim/sertifika\n- Başvuru: Apply / Easy Apply / Company site linklerini kullanın.\n`;

  const stream = new ReadableStream({
    async start(controller) {
      for (const ch of text) {
        controller.enqueue(encoder.encode(ch));
        await new Promise((r) => setTimeout(r, 6));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
