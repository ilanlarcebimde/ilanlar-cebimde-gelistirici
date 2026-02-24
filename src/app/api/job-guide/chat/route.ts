import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForUser, getSupabaseAdmin } from "@/lib/supabase/server";
import {
  getNextStep,
  getStepDisplay,
  getProgressFromConfig,
  getStepById,
  expandServicesSelected,
  type FlowStep,
  type FlowInput,
  QUICK_GUIDE_TEMPLATES,
} from "@/data/jobGuideConfig";
import { buildDeterministicGuide, getBootstrapMessage } from "@/lib/job-guide/deterministicGuide";
import {
  buildChecklist,
  getMissingTop,
  answersFromJson,
} from "@/lib/checklistRules";
import { fetchUrlToPlainText, getVisaContextForCountry } from "@/lib/jobGuideGrounding";
import { getCountrySources } from "@/lib/external/sources";
import { fetchExternalWithCache } from "@/lib/external/fetchWithCache";
import { callGeminiJson, extractJsonStrict, redactForbiddenPhrases, applyGuardrails } from "@/lib/ai/gemini";
import { buildGeminiSystemPrompt, buildGeminiUserPrompt, type LiveContextItem } from "@/lib/job-guide/prompts";
import { generateFinalReport } from "@/lib/job-guide/generateReport";

export const runtime = "nodejs";
export const maxDuration = 60;

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const supabase = getSupabaseForUser(token);
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { user, supabase } : null;
}

function inferCountry(channelSlug: string | null, locationText: string): string {
  const slug = (channelSlug ?? "").toLowerCase();
  const loc = locationText.toLowerCase();
  const bySlug: Record<string, string> = {
    katar: "Katar", belcika: "Belçika", irlanda: "İrlanda", almanya: "Almanya",
    hollanda: "Hollanda", avusturya: "Avusturya", polonya: "Polonya",
    isvec: "İsveç", norvec: "Norveç", finlandiya: "Finlandiya", danimarka: "Danimarka",
  };
  if (slug && bySlug[slug]) return bySlug[slug];
  if (/\b(katar|qatar)\b/.test(loc)) return "Katar";
  if (/\b(belçika|belgium|belcika)\b/.test(loc)) return "Belçika";
  if (/\b(irlanda|ireland)\b/.test(loc)) return "İrlanda";
  if (/\b(almanya|germany|deutschland)\b/.test(loc)) return "Almanya";
  if (/\b(hollanda|netherlands)\b/.test(loc)) return "Hollanda";
  if (/\b(avusturya|austria)\b/.test(loc)) return "Avusturya";
  if (/\b(polonya|poland)\b/.test(loc)) return "Polonya";
  return channelSlug ? channelSlug : loc || "unknown";
}

type SourceKind = "eures" | "glassdoor" | "default";
function getSourceKind(sourceName: string | null): SourceKind {
  const s = (sourceName ?? "").toLowerCase();
  if (s.includes("eures")) return "eures";
  if (s.includes("glassdoor")) return "glassdoor";
  return "default";
}

/** Config'teki adım için metin + choices veya input. */
function getQuestionTextAndChoices(step: FlowStep): { text: string; choices?: string[]; input?: FlowInput } {
  return getStepDisplay(step);
}

/** Hızlı Rehber — deterministik, kaynağa göre; ilk mesajda sadece bilgi, soru yok. */
function getQuickGuideText(source: SourceKind): string {
  if (source === "glassdoor") return QUICK_GUIDE_TEMPLATES.GLASSDOOR.fullText;
  if (source === "eures") return QUICK_GUIDE_TEMPLATES.EURES.fullText;
  return QUICK_GUIDE_TEMPLATES.GLASSDOOR.fullText; // default
}

/** Cevap sonrası onay cümlesi — asistan varsayım yapmaz, cevaba göre tek cümle. */
function getConfirmationMessage(askId: string, value: unknown): string | null {
  const v = String(value ?? "").toLowerCase().trim();
  const valTrim = String(value ?? "").trim();
  if (askId === "passport") {
    if (v === "var") return "Tamam, pasaportun var. Şimdi geçerlilik süresini yapılacaklar listesinde kontrol edeceğiz.";
    if (v === "basvurdum") return "Tamam, başvurmuşsun. Takip numarası / süre bilgisi yapılacaklar listesinde not edilecek.";
    if (v === "yok") return "Tamam, pasaport yok. Bu ilan için kritik bir engel olabilir; yapılacaklar listesinde önceliklendireceğiz.";
  }
  if (askId === "source_apply_opened") {
    if (v === "var") return "Tamam, sayfayı açtın. Sırada başvuru alanını bulmak var.";
    if (v === "yok") return "Tamam. İlana Git butonuna tıklayıp sayfayı açmayı dene; açmazsa birlikte bakacağız.";
  }
  if (askId === "source_apply_found") {
    if (v === "var") return "Güzel, başvuru alanını gördün. Bir sonraki adımda başvuruyu başlatacağız.";
    if (v === "yok") return "Tamam. Sayfada \"Apply\" veya \"How to apply\" bölümünü aşağı kaydırarak ara.";
  }
  if (askId === "cv") {
    if (v === "var") return "PDF hazır, iyi. Başvuruda ekleyeceğiz.";
    if (v === "var_not_pdf") return "Tamam. Mümkünse PDF’e çevirip yüklemek başvuruda daha iyi görünür.";
    if (v === "yok") return "Tamam. Önce CV’yi hazırlamak gerekiyor; yapılacaklar listesinde kısa rehber var.";
  }
  if (askId === "language") return "Tamam, dil seviyesini kaydettim. Raporda buna göre öneri vereceğiz.";
  if (askId === "has_trade_certificate") return "Tamam, mesleki belge durumunu not ettim.";
  if (askId === "barrier") {
    if (v === "yok") return "Tamam, şu an tıkayan bir şey yok.";
    if (v === "var") return "Tamam. Ne olduğunu yazdığında yapılacaklar listesinde değerlendireceğiz.";
  }
  if (askId === "passport_status" || askId === "has_passport") {
    if (valTrim === "Evet" || String(value).trim() === "Var") return "Tamam, pasaportunuz var. Geçerlilik süresini yapılacaklar listesinde not edeceğiz.";
    if (v === "başvurdum" || valTrim === "Başvurdum") return "Tamam, başvurmuşsunuz. Takip / süre bilgisi yapılacaklar listesinde yer alacak.";
    if (valTrim === "Hayır" || String(value).trim() === "Yok") return "Tamam. Pasaport yoksa aşağıda kısa rehber var.";
    if (valTrim === "Emin değilim") return "Tamam, not ettim. Yapılacaklar listesinde pasaport adımı yer alacak.";
  }
  if (askId === "opened_source_page") {
    if (valTrim === "Açtım") return "Tamam, sayfayı açtın. Sırada başvuru alanını bulmak var.";
    if (String(value).trim() === "Açamadım") return "Tamam. İlana Git butonuna tıklayıp sayfayı açmayı dene; açmazsa birlikte bakacağız.";
  }
  if (askId === "found_apply_section" || askId === "saw_signin_to_apply" || askId === "how_to_apply_method") {
    if (String(value).trim() === "Gördüm") return "Güzel, başvuru alanını gördün.";
    if (String(value).trim() === "Göremedim") return "Tamam. Ekrandaki başlıkları yazacağın soruyla devam edelim.";
  }
  if (askId === "service_pick") return "Tamam, seçtiğin konulara göre rehberi hazırlıyorum.";
  if (askId === "visible_headings_text" || askId === "screen_headings" || askId === "apply_section_location") return "Tamam, not ettim. Buna göre yönlendireceğiz.";
  if (askId === "cv_status") {
    const val = String(value).trim();
    if (val === "PDF hazır") return "PDF hazır, iyi. Başvuruda ekleyeceğiz.";
    if (val === "Hazır ama PDF değil") return "Tamam. Mümkünse PDF'e çevirip yüklemek başvuruda daha iyi görünür.";
    if (val === "Hazır değil") return "Tamam. CV hazır değilse başvuru zayıf kalır; önce CV'yi netleştirelim.";
  }
  if (askId === "language_level") return "Tamam, dil seviyeni not ettim.";
  if (askId === "apply_method") return "Tamam, başvuru yöntemi netleşti.";
  if (askId === "qualification_proof_bundle") return "Tamam, elindeki kanıtları not ettim.";
  if (askId === "qualification_plan_text") return "Tamam, belgesiz alternatif planını not ettim.";
  if (askId === "passport_eta") return "Tamam, pasaport süre bilgisini not ettim.";
  if (askId === "has_job_offer") return "Tamam, iş teklifi durumunu not ettim.";
  if (askId === "weekly_time_budget") return "Tamam, zaman bütçene göre 1 haftalık planı oluşturacağım.";
  if (askId === "cv_offer_if_missing") {
    if (String(value).trim() === "Evet yönlendir") return "Tamam, CV Paketi sayfasına yönlendireceğim.";
    if (String(value).trim() === "Şimdilik hayır") return "Tamam. İstersen CV'yi kendin hazırlayarak devam edebiliriz.";
  }
  if (askId === "blocking_issue") {
    if (String(value).trim() === "Yok") return "Tamam, şu an tıkayan bir şey yok.";
    if (String(value).trim() === "Var (yazacağım)") return "Tamam. Aşağıya tıkayan sorunu yaz.";
  }
  if (askId === "blocking_issue_text") return "Tamam, sorunu not ettim.";
  return null;
}

/** Serbest metin cevabı answers patch'ine çevirir. last_ask_id ile tek doğru alana yazılır (tekrar döngüsü önlenir). */
function normalizeUserMessageToAnswers(text: string, lastAskId?: string): Record<string, unknown> {
  const t = text.toLowerCase().trim();
  const patch: Record<string, unknown> = {};
  if (!lastAskId) {
    if (/\b(pasaportum\s*yok|pasaport\s*yok)\b/.test(t)) patch.passport = "yok";
    else if (/\b(pasaportum\s*var|pasaport\s*var)\b/.test(t)) patch.passport = "var";
    else if (/\b(başvurdum|basvurdum)\b/.test(t)) patch.passport = "basvurdum";
    if (/\b(pdf\s*hazır|hazır\s*pdf)\b/.test(t)) patch.cv = "var";
    else if (/\b(hazır\s*ama\s*pdf\s*değil|pdf\s*değil)\b/.test(t)) patch.cv = "var_not_pdf";
    else if (/\b(cv\s*yok|hazır değil)\b/.test(t)) { patch.cv = "yok"; patch.cv_uploaded = "yok"; }
    else if (/\b(cv\s*var|cv hazır|hazır|cv yükledim)\b/.test(t)) patch.cv = "var";
    if (/\b(ilan\s*sayfasına\s*geldim|ilana\s*gittim|sayfayı\s*açtım|açtım)\b/.test(t)) patch.source_apply_opened = "var";
    if (/\b(açamadım)\b/.test(t)) patch.source_apply_opened = "yok";
    if (/\b(apply\s*bölümünü\s*gördüm|gördüm|apply\s*gördüm|sign in to apply)\b/.test(t)) patch.source_apply_found = "var";
    if (/\b(görmedim)\b/.test(t)) patch.source_apply_found = "yok";
    if (/\b(engel\s*yok|engelim yok|tıkayan\s*bir\s*şey\s*yok)\b/.test(t)) patch.barrier = "yok";
    if (/\b(engel|engelim|tıkayan|var\s*\(ne\s*olduğunu)\b/.test(t)) patch.barrier = "var";
    if (/\b(a1\s*[-–]?\s*a2|a1-a2)\b/.test(t)) patch.language = "a1";
    if (/\bb1\b/.test(t) && !patch.language) patch.language = "b1";
    if (/\bb2\+|b2\s*artı\b/.test(t)) patch.language = "b2";
    if (/\b(emin değilim)\b/.test(t) && /dil|ingilizce/.test(t)) patch.language = "emin";
  } else {
    const step = getStepById(lastAskId);
    if (step) {
      if (step.input?.type === "textarea" || step.input?.type === "text") {
        const trimmed = text.trim();
        const minLen = step.doneRule.type === "minLength" ? step.doneRule.value : 1;
        if (trimmed.length >= minLen) (patch as Record<string, unknown>)[step.answerKey] = trimmed;
        return patch;
      }
      if (step.input?.type === "multiselect") {
        const parts = text
          .split(/[,;\n|]+/g)
          .map((s) => s.trim())
          .filter(Boolean);
        const selected = (step.choices ?? []).filter((c) => {
          const cNorm = c.toLowerCase().replace(/\s+/g, " ");
          return parts.some((p) => {
            const pNorm = p.toLowerCase().replace(/\s+/g, " ");
            return pNorm === cNorm || pNorm.includes(cNorm) || cNorm.includes(pNorm);
          });
        });
        if (selected.length > 0) (patch as Record<string, unknown>)[step.answerKey] = selected;
        return patch;
      }
      const choice = step.choices?.find((c) => {
        const cLower = c.toLowerCase().replace(/\s+/g, " ");
        const tLower = t.toLowerCase().replace(/\s+/g, " ");
        return cLower === tLower || tLower.includes(cLower) || cLower.includes(tLower);
      });
      if (choice) {
        (patch as Record<string, unknown>)[step.answerKey] = choice;
        return patch;
      }
      if (step.answerKey === "opened_source_page") {
        if (/açtım|evet|açabildim/.test(t)) (patch as Record<string, unknown>).opened_source_page = "Açtım";
        else if (/açamadım|hayır/.test(t)) (patch as Record<string, unknown>).opened_source_page = "Açamadım";
      } else if (step.answerKey === "found_apply_section" || step.answerKey === "saw_signin_to_apply") {
        if (/gördüm|evet/.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Gördüm";
        else if (/göremedim|görmedim|hayır/.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Göremedim";
        else if (/emin değilim/.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Emin değilim";
      } else if (step.answerKey === "passport_status" || step.answerKey === "has_passport") {
        if (/^evet$/i.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Evet";
        else if (/^hayır$/i.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Hayır";
        else if (/emin değilim/.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Emin değilim";
        else if (/^var$/i.test(t)) (patch as Record<string, unknown>).passport_status = "Var";
        else if (/başvurdum|basvurdum/.test(t)) (patch as Record<string, unknown>).passport_status = "Başvurdum";
        else if (/^yok$/i.test(t)) { (patch as Record<string, unknown>).passport_status = "Yok"; if (step.answerKey === "has_passport") (patch as Record<string, unknown>).has_passport = "Hayır"; }
      } else if (step.answerKey === "cv_status" || step.answerKey === "cv_ready") {
        if (/^evet$/i.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Evet";
        else if (/^hayır$/i.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Hayır";
        else if (/emin değilim/.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Emin değilim";
        else if (/pdf\s*hazır|hazır\s*pdf/.test(t)) (patch as Record<string, unknown>).cv_status = "PDF hazır";
        else if (/hazır\s*ama\s*pdf\s*değil/.test(t)) (patch as Record<string, unknown>).cv_status = "Hazır ama PDF değil";
        else if (/hazır\s*değil/.test(t)) (patch as Record<string, unknown>).cv_status = "Hazır değil";
      } else if (["needs_eu_login", "is_eu_eea_citizen", "has_glassdoor_account", "redirects_to_company_site"].includes(step.answerKey)) {
        if (/^evet$/i.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Evet";
        else if (/^hayır$/i.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Hayır";
        else if (/emin değilim/.test(t)) (patch as Record<string, unknown>)[step.answerKey] = "Emin değilim";
      } else if (step.answerKey === "apply_method") {
        if (/form\s*\/?\s*portal|portal/i.test(t)) (patch as Record<string, unknown>).apply_method = "Form/Portal";
        else if (/e-?posta|mail/i.test(t)) (patch as Record<string, unknown>).apply_method = "E-posta";
        else if (/şirket\s*sitesi|sitesine/i.test(t)) (patch as Record<string, unknown>).apply_method = "Şirket sitesi";
        else if (/emin değilim/.test(t)) (patch as Record<string, unknown>).apply_method = "Emin değilim";
      } else if (step.answerKey === "proof_docs") {
        const docOpts = ["Ustalık belgesi / MYK", "Kalfalık belgesi", "SGK hizmet dökümü / iş geçmişi", "SGK hizmet dökümü", "Sertifika (kurs/ehliyet vb.)", "Sertifika", "Referans mektubu", "Portföy (fotoğraf/video)", "Portföy (foto/video)", "Hiçbiri"];
        const selected = t.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
        const valid = selected.filter((s) => docOpts.some((o) => o === s || o.includes(s) || s.includes(o)));
        if (valid.length > 0) (patch as Record<string, unknown>).proof_docs = valid.length === 1 ? valid : valid;
        else if (docOpts.some((o) => t === o || t.includes(o))) (patch as Record<string, unknown>).proof_docs = [t.trim()];
      } else if (step.answerKey === "apply_section_location") {
        const trimmed = text.trim();
        if (/sağ\s*tarafta|sag\s*tarafta/i.test(t)) (patch as Record<string, unknown>).apply_section_location = "Sağ tarafta";
        else if (/alt\s*bölümde|alt\s*bolumde/i.test(t)) (patch as Record<string, unknown>).apply_section_location = "Alt bölümde";
        else if (/yok\s*\(göremiyorum\)|göremiyorum|^yok$/i.test(t)) (patch as Record<string, unknown>).apply_section_location = "Yok";
        else if (["Sağ tarafta", "Alt bölümde", "Yok", "Yok (göremiyorum)"].includes(trimmed)) (patch as Record<string, unknown>).apply_section_location = trimmed === "Yok (göremiyorum)" ? "Yok" : trimmed;
      } else if (step.answerKey === "screen_headings") {
        const trimmed = text.trim();
        if (/sağ\s*tarafta|sag\s*tarafta/i.test(t)) (patch as Record<string, unknown>).screen_headings = "Sağ tarafta";
        else if (/alt\s*bölümde|alt\s*bolumde/i.test(t)) (patch as Record<string, unknown>).screen_headings = "Alt bölümde";
        else if (/yok|göremiyorum/i.test(t)) (patch as Record<string, unknown>).screen_headings = "Yok";
        else if (["Sağ tarafta", "Alt bölümde", "Yok"].includes(trimmed)) (patch as Record<string, unknown>).screen_headings = trimmed;
      } else if (step.answerKey === "language_level") {
        if (/a0\b/i.test(t)) (patch as Record<string, unknown>).language_level = "A0";
        else if (/a1\s*[-–]?\s*a2/.test(t)) (patch as Record<string, unknown>).language_level = "A1–A2";
        else if (/\bb1\b/.test(t)) (patch as Record<string, unknown>).language_level = "B1";
        else if (/\bb2\b/.test(t)) (patch as Record<string, unknown>).language_level = "B2";
        else if (/c1\+|c1\s*artı/.test(t)) (patch as Record<string, unknown>).language_level = "C1+";
        else if (/emin değilim/.test(t)) (patch as Record<string, unknown>).language_level = "Emin değilim";
      } else if (step.answerKey === "blocking_issue") {
        if (/^yok$/i.test(t)) (patch as Record<string, unknown>).blocking_issue = "Yok";
        else if (/var\s*\(yazacağım\)|yazacağım/.test(t)) (patch as Record<string, unknown>).blocking_issue = "Var (yazacağım)";
      }
      if (Object.keys(patch).length > 0) return patch;
    }
    if (t === "açtım" || t === "evet" || t === "var" || t === "gördüm") {
      if (lastAskId === "source_apply_opened") patch.source_apply_opened = "var";
      else if (lastAskId === "source_apply_found") patch.source_apply_found = "var";
      else if (lastAskId === "passport") patch.passport = "var";
      else if (lastAskId === "cv") patch.cv = "var";
      else if (lastAskId === "has_trade_certificate") patch.has_trade_certificate = "var";
      else if (lastAskId === "barrier") patch.barrier = "var";
    } else if (t === "açamadım" || t === "hayır" || t === "yok" || t === "görmedim") {
      if (lastAskId === "source_apply_opened") patch.source_apply_opened = "yok";
      else if (lastAskId === "source_apply_found") patch.source_apply_found = "yok";
      else if (lastAskId === "passport") patch.passport = "yok";
      else if (lastAskId === "cv") { patch.cv = "yok"; patch.cv_uploaded = "yok"; }
      else if (lastAskId === "has_trade_certificate") patch.has_trade_certificate = "yok";
      else if (lastAskId === "barrier") patch.barrier = "yok";
    } else if (t === "başvurdum" || t === "basvurdum") {
      if (lastAskId === "passport") patch.passport = "basvurdum";
    } else if (t === "pdf hazır" || (t.includes("pdf") && t.includes("hazır"))) {
      if (lastAskId === "cv") patch.cv = "var";
    } else if (t === "hazır ama pdf değil" || (t.includes("hazır") && t.includes("pdf") && t.includes("değil"))) {
      if (lastAskId === "cv") patch.cv = "var_not_pdf";
    } else if (t === "hazır değil") {
      if (lastAskId === "cv") { patch.cv = "yok"; patch.cv_uploaded = "yok"; }
    } else if (lastAskId === "language") {
      if (/\ba1\s*[-–]?\s*a2|a1-a2\b/.test(t)) patch.language = "a1";
      else if (/\bb1\b/.test(t)) patch.language = "b1";
      else if (/\bb2\+|b2\s*artı\b/.test(t)) patch.language = "b2";
      else if (t === "emin değilim") patch.language = "emin";
      else if (t.length <= 15) patch.language = t.replace(/\s+/g, "").slice(0, 10) || "emin";
    } else if (lastAskId === "has_trade_certificate" && (t === "emin değilim" || t === "var" || t === "yok")) {
      patch.has_trade_certificate = t === "emin değilim" ? "yok" : t;
    } else if (lastAskId === "barrier" && (t === "var (ne olduğunu yazacağım)" || t.includes("var") || t.length > 5)) {
      patch.barrier = "var";
    }
  }
  if (/\b(cv\s*yükledim|yükledim)\b/.test(t)) patch.cv_uploaded = "var";
  return patch;
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    throw new Error("JSON_PARSE_FAILED");
  }
}

async function callGemini(system: string, user: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
  const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim().replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${system}\n\n---\n\nKullanıcı girdisi:\n${user}` }] }],
        generationConfig: { temperature: 0.3, topP: 0.9, maxOutputTokens: 4096 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`GEMINI_HTTP_${res.status}:${t.slice(0, 200)}`);
    }
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("") || "";
    if (!text.trim()) throw new Error("GEMINI_EMPTY_RESPONSE");
    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

type NextQuestionOut = { id?: string; text: string; choices?: string[] };
const DEFAULT_QUESTION: NextQuestionOut = { text: "Pasaportun var mı?", choices: ["Var", "Başvurdum", "Yok"] };

/** Gemini bazen "question"/"options"/"id" döndürür; hepsini kabul et */
function normalizeNextQuestion(parsed: Record<string, unknown>): NextQuestionOut {
  const q = parsed.next_question ?? parsed.next_questions;
  if (!q || typeof q !== "object") return DEFAULT_QUESTION;
  const obj = Array.isArray(q) ? q[0] : q;
  if (!obj || typeof obj !== "object") return DEFAULT_QUESTION;
  const o = obj as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() || undefined : undefined;
  const text = (typeof o.text === "string" ? o.text : typeof o.question === "string" ? o.question : "").trim();
  const choices = Array.isArray(o.choices) ? o.choices : Array.isArray(o.options) ? o.options : [];
  const choicesStr = choices.map((c) => (typeof c === "string" ? c : (c as { label?: string })?.label ?? String(c)));
  if (!text) return DEFAULT_QUESTION;
  return { id, text, choices: choicesStr.length > 0 ? choicesStr : DEFAULT_QUESTION.choices };
}

/** Gemini farklı anahtarlarla mesaj dönebilir; hepsini dene, yoksa ham metni kullan */
function extractAssistantMessage(parsed: Record<string, unknown>, rawText: string): string {
  const keys = ["assistant_message", "message", "message_md", "response", "reply", "content", "text", "output", "answer"];
  for (const k of keys) {
    const v = parsed[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  const assistant = parsed.assistant;
  if (assistant && typeof assistant === "object" && assistant !== null) {
    const a = assistant as Record<string, unknown>;
    for (const k of ["message", "message_md", "text", "content"]) {
      const v = a[k];
      if (typeof v === "string" && v.trim().length > 0) return v.trim();
    }
  }
  if (typeof rawText === "string" && rawText.trim().length > 0) {
    const cleaned = rawText
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "")
      .trim();
    if (!cleaned.startsWith("{") || !cleaned.includes('"assistant_message"')) {
      const firstLine = cleaned.split("\n")[0]?.trim() ?? "";
      if (firstLine.length > 10 && firstLine.length < 2000) return firstLine;
      if (cleaned.length > 10 && cleaned.length < 4000) return cleaned.slice(0, 2000);
    }
  }
  return "";
}

type ReportFromGemini = {
  summary?: { one_liner?: string; top_actions?: string[] };
  how_to_apply?: { steps?: string[]; where_to_apply?: string; notes?: string[] };
  documents?: { required?: string[]; optional?: string[]; warnings?: string[] };
  work_permit_and_visa?: Record<string, unknown>;
  salary_and_life_calc?: Record<string, unknown>;
  risk_assessment?: { level?: string; items?: Array<{ title?: string; level?: string; why?: string; what_to_do?: string }> };
  fit_analysis?: { score?: number; strengths?: string[]; gaps?: string[] };
  plan_30_days?: { week1?: string[]; week2?: string[]; week3?: string[]; week4?: string[] };
};

export async function POST(req: NextRequest) {
  const hasAuth = !!req.headers.get("authorization");
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) {
      console.log("[job-guide/chat] hit", { hasAuth, status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      jobGuideId?: string;
      jobPostId?: string;
      user_message?: string;
      message_text?: string;
      mode?: "bootstrap" | "chat";
      last_ask_id?: string;
      answers_json?: Record<string, unknown>;
      chat_history?: Array<{ role: string; text: string }>;
      client_context?: { locale?: string };
      wants_live_visa?: boolean;
      wants_live_salary?: boolean;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const {
      jobGuideId,
      jobPostId,
      user_message,
      message_text,
      mode,
      last_ask_id,
      answers_json = {},
      chat_history = [],
      wants_live_visa,
      wants_live_salary,
    } = body;
    if (!jobGuideId || !jobPostId) {
      return NextResponse.json({ error: "jobGuideId and jobPostId required" }, { status: 400 });
    }

    // bootstrap = ilk asistan mesajı; chat = kullanıcı cevabı sonrası
    const isBootstrap = mode === "bootstrap" || user_message === "__start__" || (typeof user_message === "string" && !user_message.trim());
    const rawUserText = (typeof message_text === "string" ? message_text : typeof user_message === "string" ? user_message : "").trim();
    console.log("[job-guide/chat] body", { hasMessage: !!rawUserText, jobGuideId, jobPostId, mode: body.mode, isBootstrap });
    const normalizedPatch = rawUserText && !isBootstrap ? normalizeUserMessageToAnswers(rawUserText, last_ask_id) : {};
    let mergedAnswers = { ...answers_json, ...normalizedPatch } as Record<string, unknown>;
    if (last_ask_id === "service_pick") {
      mergedAnswers = { ...mergedAnswers, ...expandServicesSelected(mergedAnswers) };
    }

    const { data: guide } = await auth.supabase
      .from("job_guides")
      .select("id, user_id, report_json")
      .eq("id", jobGuideId)
      .eq("user_id", auth.user.id)
      .single();
    if (!guide) return NextResponse.json({ error: "Guide not found" }, { status: 404 });

    const admin = getSupabaseAdmin();
    const { data: jobPostRow } = await admin
      .from("job_posts")
      .select("id, title, position_text, location_text, source_name, source_url, snippet, published_at, channels(slug)")
      .eq("id", jobPostId)
      .maybeSingle();
    if (!jobPostRow) return NextResponse.json({ error: "Job post not found" }, { status: 404 });

    const jobPost = jobPostRow as Record<string, unknown> & { location_text?: string | null };
    const ch = (jobPost as { channels?: { slug?: string } | Array<{ slug?: string }> | null }).channels;
    const channelSlug = ch == null ? null : Array.isArray(ch) ? ch[0]?.slug ?? null : (ch as { slug?: string })?.slug ?? null;
    const country = inferCountry(channelSlug, jobPost.location_text ?? "");
    const sourceName = String(jobPost.source_name ?? "").toUpperCase();

    const jobContent = [
      `İlan başlığı: ${jobPost.title ?? ""}`,
      `Sektör/Pozisyon: ${jobPost.position_text ?? ""}`,
      `Konum: ${jobPost.location_text ?? ""}`,
      `Ülke: ${country}`,
      `İlan kaynağı: ${jobPost.source_name ?? "belirtilmedi"}`,
      `Özet: ${jobPost.snippet ?? ""}`,
    ].join("\n");

    const jobForChecklist = {
      id: jobPostId,
      title: typeof jobPost.title === "string" ? jobPost.title : null,
      location_text: typeof jobPost.location_text === "string" ? jobPost.location_text : null,
      source_name: typeof jobPost.source_name === "string" ? jobPost.source_name : null,
      source_url: typeof jobPost.source_url === "string" ? jobPost.source_url : null,
      snippet: typeof jobPost.snippet === "string" ? jobPost.snippet : null,
    };
    const answersForChecklist = answersFromJson(mergedAnswers as Record<string, unknown>);
    const modules = buildChecklist(jobForChecklist, answersForChecklist);
    const sourceKey = getSourceKind(jobPost.source_name as string | null);
    const progressFromConfig = getProgressFromConfig(mergedAnswers as Record<string, unknown>, sourceKey);
    const missingTop3 = getMissingTop(modules, 3);
    const checklistSnapshot = { total: progressFromConfig.total, done: progressFromConfig.done, percent: progressFromConfig.pct, missing_top3: missingTop3 };

    const quickGuideText = getQuickGuideText(sourceKey);
    if (isBootstrap) {
      // İlk mesaj: 1 kez selam + kaynak + başvuru adımları. greeting_shown ile sonraki turlarda selam tekrarlanmaz.
      const bootstrapMessage = getBootstrapMessage(sourceKey);
      const bootstrapAnswers = { ...mergedAnswers, greeting_shown: true } as Record<string, unknown>;
      const assistant = {
        message_md: bootstrapMessage,
        quick_replies: [] as string[],
        ask: undefined as { id: string; question: string; type: "choice" | "textarea"; choices?: string[]; input?: unknown } | undefined,
      };
      const state_patch = {
        answers_patch: { greeting_shown: true } as Record<string, unknown>,
        checklist_patch: [],
        progress: { total: progressFromConfig.total, done: progressFromConfig.done, percent: progressFromConfig.pct },
      };
      return NextResponse.json({
        assistant_message: bootstrapMessage,
        next_question: null,
        quick_guide_text: quickGuideText,
        report_json: guide?.report_json ?? {},
        report_md: null,
        checklist_snapshot: checklistSnapshot,
        answers_json: bootstrapAnswers,
        assistant,
        state_patch,
        next: { should_finalize: false, reason: "" },
      });
    }

    // "Devam" ile ilk soru: mesaj boş veya __continue__ ise ilk soru (service_pick) döndürülür. greeting_shown= true patchlenir.
    const isContinueStart = (!rawUserText || rawUserText.trim() === "" || rawUserText.trim().toLowerCase() === "__continue__") && Object.keys(mergedAnswers as object).length === 0;
    if (isContinueStart) {
      const nextStep = getNextStep(mergedAnswers as Record<string, unknown>, sourceKey);
      if (nextStep) {
        const firstQuestion = getQuestionTextAndChoices(nextStep);
        const askId = nextStep.id;
        const nextQuestionPayload = { id: askId, text: firstQuestion.text, choices: firstQuestion.choices, input: firstQuestion.input };
        const continueMessage = getBootstrapMessage(sourceKey);
        const continueAnswers = { ...mergedAnswers, greeting_shown: true } as Record<string, unknown>;
        return NextResponse.json({
          assistant_message: continueMessage,
          next_question: nextQuestionPayload,
          quick_guide_text: quickGuideText,
          report_json: guide?.report_json ?? {},
          report_md: null,
          checklist_snapshot: checklistSnapshot,
          answers_json: continueAnswers,
          assistant: {
            message_md: continueMessage,
            quick_replies: firstQuestion.choices ?? [],
            ask: {
              id: askId,
              question: firstQuestion.text,
              type: (firstQuestion.input ? "textarea" : "choice") as "choice" | "textarea",
              choices: firstQuestion.choices,
              input: firstQuestion.input,
            },
          },
          state_patch: {
            answers_patch: { greeting_shown: true } as Record<string, unknown>,
            checklist_patch: [],
            progress: { total: progressFromConfig.total, done: progressFromConfig.done, percent: progressFromConfig.pct },
          },
          next: { should_finalize: false, reason: "" },
        });
      }
    }

    // Chat: tek otorite = config. getNextStep(answers, source, lastAskId) no-repeat ile bir sonraki soruyu döner.
    const nextStep = getNextStep(mergedAnswers as Record<string, unknown>, sourceKey, last_ask_id ?? undefined);
    if (nextStep === null) {
      let reportJsonFinal = guide?.report_json ?? {};
      let reportMdFinal: string | null = null;
      let scoreFinal: number | undefined;
      let riskLevelFinal: string | undefined;
      try {
        const generated = await generateFinalReport(
          jobContent,
          mergedAnswers as Record<string, unknown>,
          checklistSnapshot as Record<string, unknown>
        );
        reportJsonFinal = generated.reportJson;
        reportMdFinal = generated.reportMd;
        scoreFinal = generated.score ?? undefined;
        riskLevelFinal = generated.riskLevel ?? undefined;
        await auth.supabase
          .from("job_guides")
          .update({
            answers_json: mergedAnswers,
            report_json: reportJsonFinal,
            report_md: reportMdFinal,
            updated_at: new Date().toISOString(),
            status: "in_progress",
            ...(scoreFinal != null ? { score: scoreFinal } : {}),
            ...(riskLevelFinal ? { risk_level: riskLevelFinal } : {}),
          })
          .eq("id", jobGuideId)
          .eq("user_id", auth.user.id);
      } catch (e) {
        console.error("[job-guide/chat] final report generation failed", e);
      }
      const doneMessage = "Tüm kritik bilgiler tamamlandı. Şu an netleşen yapılacaklar aşağıda.";
      const state_patch = {
        answers_patch: {} as Record<string, unknown>,
        checklist_patch: [] as Array<{ module_id: string; item_id: string; done: boolean }>,
        progress: { total: progressFromConfig.total, done: progressFromConfig.done, percent: progressFromConfig.pct },
      };
      return NextResponse.json({
        assistant_message: doneMessage,
        next_question: null,
        quick_guide_text: quickGuideText,
        report_json: reportJsonFinal,
        report_md: reportMdFinal,
        checklist_snapshot: checklistSnapshot,
        answers_json: mergedAnswers,
        assistant: { message_md: doneMessage, quick_replies: [], ask: undefined },
        state_patch,
        next: { should_finalize: true, reason: "all_steps_done" },
        score: scoreFinal,
        risk_level: riskLevelFinal,
      });
    }
    const currentStepId = nextStep.id;

    // SERVICES_GATE: Deterministik rehber (EURES/Glassdoor şablonu + seçili hizmetler). LLM opsiyonel.
    const useDeterministicGuide = true;
    let assistantMessage = useDeterministicGuide
      ? buildDeterministicGuide(jobPost as { source_name?: string | null; location_text?: string | null }, mergedAnswers, nextStep, sourceKey)
      : "";

    // RAG / Grounding: ilan sayfası + resmî vize (Supabase whitelist öncelikli, yoksa in-memory fallback)
    const sourceUrl = typeof jobPost.source_url === "string" ? jobPost.source_url : "";
    const jobPageResult = sourceUrl
      ? await fetchUrlToPlainText(sourceUrl)
      : { text: "", error: "no_url" as const };
    const jobPageExcerpt = jobPageResult.text ? jobPageResult.text.slice(0, 15000) : "";

    const liveItems: LiveContextItem[] = [];
    const wantsVisa = wants_live_visa === true || /visa_need_clarity|passport_status|has_passport|citizenship_eu|visa/i.test(currentStepId);
    if (wantsVisa && country) {
      const countrySources = await getCountrySources(country, "visa", 2);
      for (const s of countrySources) {
        const fetched = await fetchExternalWithCache({
          kind: "visa",
          url: s.url,
          ttlSeconds: 60 * 60 * 24,
          purpose: "visa",
          country,
          sourceName: s.title,
          maxContentChars: 7000,
        });
        if (fetched.ok) {
          liveItems.push({
            kind: "visa",
            source: s.title,
            url: s.url,
            content_text: fetched.content_text,
            fetched_at: fetched.fetched_at,
          });
        } else {
          liveItems.push({ kind: "visa", blocked: true, reason: fetched.reason });
        }
      }
    }
    if (wants_live_salary === true && country) {
      const salarySources = await getCountrySources(country, "salary", 1);
      for (const s of salarySources) {
        const fetched = await fetchExternalWithCache({
          kind: "salary",
          url: s.url,
          ttlSeconds: 60 * 60 * 24 * 7,
          purpose: "salary",
          country,
          sourceName: s.title,
          maxContentChars: 4000,
        });
        if (fetched.ok) {
          liveItems.push({
            kind: "salary",
            source: s.title,
            url: s.url,
            content_text: fetched.content_text,
            fetched_at: fetched.fetched_at,
          });
        } else {
          liveItems.push({ kind: "salary", blocked: true, reason: fetched.reason });
        }
      }
    }

    let visaContextBlock = "";
    let visaContextError: string | null = null;
    let visaSourceForReport: { source: string; dateFetched: string } | null = null;
    const visaFromLive = liveItems.find((x) => x.kind === "visa" && !x.blocked && x.content_text);
    if (visaFromLive && visaFromLive.content_text) {
      visaContextBlock = `\n\n---\nResmî vize/çalışma izni özeti (ülke: ${country}):\n${visaFromLive.content_text.slice(0, 7000)}\nKaynak: ${visaFromLive.source ?? visaFromLive.url}\nTarih: ${visaFromLive.fetched_at ?? ""}`;
      visaSourceForReport = { source: visaFromLive.source ?? visaFromLive.url ?? "", dateFetched: visaFromLive.fetched_at ?? "" };
    } else if (wantsVisa && country) {
      const fallbackVisa = await getVisaContextForCountry(country);
      if ("source" in fallbackVisa && fallbackVisa.text) {
        visaContextBlock = `\n\n---\nResmî vize/çalışma izni özeti (ülke: ${country}):\n${fallbackVisa.text.slice(0, 7000)}\nKaynak: ${fallbackVisa.source}\nTarih: ${fallbackVisa.dateFetched}`;
        visaSourceForReport = { source: fallbackVisa.source, dateFetched: fallbackVisa.dateFetched };
      } else {
        visaContextError = "error" in fallbackVisa ? fallbackVisa.error : "no_whitelist";
      }
    }
    const groundingContext = [
      jobPageExcerpt ? `\n\n---\nİlan sayfası metni (kaynak URL'den):\n${jobPageExcerpt}` : "",
      visaContextBlock,
      visaContextError
        ? `\n\n---\nNot: Resmî vize verisi bu oturumda alınamadı (${visaContextError}). Genel rehber ver; cevabında vize/çalışma izni için "resmi veri alınamadı" notu ekle.`
        : "",
    ].join("");

    // Onay cümlesi: az önce cevaplanan soru için (config step.answerKey ile değer alınır)
    const lastStep = last_ask_id ? getStepById(last_ask_id) : undefined;
    const lastAnswerValue = lastStep
      ? mergedAnswers[lastStep.answerKey]
      : (mergedAnswers[last_ask_id as string] ?? mergedAnswers.passport);
    const confirmationMsg = last_ask_id && normalizedPatch && Object.keys(normalizedPatch).length > 0
      ? getConfirmationMessage(last_ask_id, lastAnswerValue)
      : null;

    type ParsedShape = {
      assistant_message?: string;
      micro_tips?: string[];
      report_patch?: {
        notes?: string[];
        visa_work?: { steps?: string[]; source?: string; dateFetched?: string; note?: string };
        source_guide?: { source?: string; steps?: string[]; notes?: string[] };
        documents?: { must?: string[]; nice?: string[]; proof?: string[] };
        salary?: { official_sources_used?: string[]; summary?: string; ranges?: string[]; assumptions?: string[] };
        one_week_plan?: { days?: Record<string, string[]> };
      };
      report?: ReportFromGemini;
      flags?: { should_offer_cv_package?: boolean; needs_official_source?: boolean; final_ready?: boolean };
    };
    let parsed: ParsedShape;

    if (!useDeterministicGuide) {
      const system = buildGeminiSystemPrompt();
      const userPrompt = buildGeminiUserPrompt({
        jobPost: jobPost as Record<string, unknown>,
        answersJson: mergedAnswers as Record<string, unknown>,
        messageText: rawUserText,
        currentStepId,
        jobContent,
        groundingContext,
        live: liveItems,
        cvUpsellUrl: "https://www.ilanlarcebimde.com/yurtdisi-cv-paketi",
        cvDiscountCode: "CV79",
      });
      console.log("[job-guide/chat] calling Gemini", { liveCount: liveItems.length });
      let rawText: string;
      try {
        rawText = await callGeminiJson({
          system,
          user: userPrompt,
          timeoutMs: 25000,
          maxOutputTokens: 1600,
        });
        console.log("[job-guide/chat] gemini ok", { len: rawText?.length ?? 0 });
      } catch (geminiErr) {
        console.error("[job-guide/chat] gemini fail", geminiErr);
        throw geminiErr;
      }
      try {
        parsed = extractJsonStrict<ParsedShape>(rawText);
      } catch (parseErr) {
        console.error("[job-guide/chat] parse fail", parseErr);
        const errSnippet = typeof rawText === "string" ? rawText.slice(0, 400) : "";
        try {
          await auth.supabase.from("job_guide_events").insert({
            job_guide_id: jobGuideId,
            type: "error",
            content: JSON.stringify({ error: "JSON_PARSE_FAILED", snippet: errSnippet }),
          });
        } catch {
          /* ignore */
        }
        const fallbackMessage = "Şu an AI yanıtını işleyemedim. Yine de devam edelim.";
        const stepForFallback = getStepById(currentStepId);
        const serverNext = stepForFallback ? getQuestionTextAndChoices(stepForFallback) : { text: "Adımlar tamamlandı.", choices: [] as string[] };
        const fallbackQuestion = { id: currentStepId, text: serverNext.text, choices: serverNext.choices, input: serverNext.input };
        const fallbackAssistant = {
          message_md: fallbackMessage,
          quick_replies: serverNext.choices ?? [],
          ask: { id: currentStepId, question: fallbackQuestion.text, type: (serverNext.input ? "textarea" : "choice") as "choice" | "textarea", choices: fallbackQuestion.choices, input: serverNext.input },
        };
        return NextResponse.json({
          assistant_message: fallbackMessage,
          next_question: fallbackQuestion,
          report_json: {},
          report_md: null,
          checklist_snapshot: checklistSnapshot,
          answers_json: mergedAnswers,
          assistant: fallbackAssistant,
          state_patch: { answers_patch: {}, checklist_patch: [], progress: { total: progressFromConfig.total, done: progressFromConfig.done, percent: progressFromConfig.pct } },
          next: { should_finalize: false, reason: "" },
        });
      }
      assistantMessage = extractAssistantMessage(parsed as Record<string, unknown>, rawText);
      if (!assistantMessage.trim()) {
        assistantMessage = "Kısa bir yanıt geldi; devam edelim.";
      }
    } else {
      parsed = {};
    }
    const { cleaned: redactedMessage, hadForbidden } = redactForbiddenPhrases(assistantMessage);
    if (hadForbidden) assistantMessage = redactedMessage;
    // CV hazır değil cevabında "şu noktalara dikkat edin" deyip liste vermeyen yanıtları tamamla
    const cvNotReady = (last_ask_id === "cv_status" || last_ask_id === "cv_ready") && (mergedAnswers.cv_status === "Hazır değil" || mergedAnswers.cv_ready === "Hayır");
    const hasNumberedList = /\n[1-9]\.\s|\n[1-9]\.\)|^[1-9]\.\s/m.test(assistantMessage);
    const endsWithDikkatEdin = /dikkat\s+edin\s*:?\s*$/i.test(assistantMessage.trim());
    if (cvNotReady && (endsWithDikkatEdin || !hasNumberedList)) {
      const defaultCvGuide = [
        "1. Özgeçmişinizi tek sayfa, net ve okunaklı tutun (hedef ülke dilinde veya İngilizce).",
        "2. İlan metnindeki anahtar kelimeleri ve becerileri CV'nize ekleyin.",
        "3. Deneyiminizi tarih ve iş tanımıyla yazın; mümkünse referans bilgisi ekleyin.",
        "4. Son halini PDF olarak kaydedin; başvuru formunda bu dosyayı yükleyeceksiniz.",
      ].join("\n");
      assistantMessage = assistantMessage.trim();
      if (endsWithDikkatEdin) assistantMessage = assistantMessage.replace(/\s*dikkat\s+edin\s*:?\s*$/i, "").trim();
      assistantMessage = (assistantMessage ? assistantMessage + "\n\n" : "") + defaultCvGuide;
    }

    // CV Paketi CTA: sadece 1 kez — cv_ready "Hayır" ve promo_cv_shown yoksa
    const cvMissing = mergedAnswers.cv_ready === "Hayır" || mergedAnswers.cv_status === "Hazır değil" || mergedAnswers.cv_status === "Yok";
    const promoAlreadyShown = mergedAnswers.promo_cv_shown === true;
    const shouldInjectCvCta =
      cvMissing && !promoAlreadyShown && (last_ask_id === "cv_ready" || last_ask_id === "cv_status" || last_ask_id === "cv_offer_if_missing");
    if (shouldInjectCvCta) {
      const link = "https://www.ilanlarcebimde.com/yurtdisi-cv-paketi";
      const cta = `CV hazır değilse buradan 24 saat içinde hazırlatabilirsin.\n${link}\nİndirim kodu: CV79`;
      assistantMessage = assistantMessage.trim() ? assistantMessage.trim() + "\n\n" + cta : cta;
      (mergedAnswers as Record<string, unknown>).promo_cv_shown = true;
    }
    // Vize/çalışma izni CTA: AB hedef + AB/AEA vatandaşı değil + hizmet seçildi → tek seferlik
    const wantsVisaHelp = mergedAnswers.service_work_permit_visa === "Evet";
    const notEUCitizen = mergedAnswers.is_eu_eea_citizen === "Hayır" || !mergedAnswers.is_eu_eea_citizen;
    const promoVisaAlreadyShown = mergedAnswers.promo_visa_shown === true;
    const isEuCountry = country && /almanya|belçika|hollanda|avusturya|irlanda|polonya|fransa|italya|isveç|finlandiya|danimarka|norveç|avrupa|eu\b|eea/i.test(country);
    const shouldInjectVisaCta = wantsVisaHelp && notEUCitizen && isEuCountry && !promoVisaAlreadyShown
      && (last_ask_id === "has_passport" || last_ask_id === "is_eu_eea_citizen");
    if (shouldInjectVisaCta) {
      const visaNote = visaContextError
        ? "Resmi kaynak verisi bu oturumda alınamadı. Çalışma izni/vize için ilandaki \"How to apply\" koşullarına ve hedef ülke resmi sitesine bakın."
        : "Çalışma izni ve vize sürecini seçtin; yukarıdaki rehberde resmi kaynak varsa ona göre ilerleyeceğiz.";
      assistantMessage = assistantMessage.trim() ? assistantMessage.trim() + "\n\n" + visaNote : visaNote;
      (mergedAnswers as Record<string, unknown>).promo_visa_shown = true;
    }
    // Maaş/yaşam gideri CTA: hizmet seçildi ama canlı veri yok → tek seferlik
    const wantsSalaryHelp = mergedAnswers.service_salary_life_calc === "Evet";
    const promoSalaryAlreadyShown = mergedAnswers.promo_salary_shown === true;
    const hasLiveSalary = liveItems.some((x) => x.kind === "salary" && !x.blocked);
    const shouldInjectSalaryCta = wantsSalaryHelp && !hasLiveSalary && !promoSalaryAlreadyShown
      && (last_ask_id === "service_pick" || last_ask_id === "cv_ready" || last_ask_id === "language_level");
    if (shouldInjectSalaryCta) {
      const salaryNote = "Net maaş ve yaşam gideri için resmi kaynak verisi bu oturumda alınamadı. Yaklaşık hesap yapmıyoruz; ilan metninde maaş varsa ona bakın.";
      assistantMessage = assistantMessage.trim() ? assistantMessage.trim() + "\n\n📌 " + salaryNote : "📌 " + salaryNote;
      (mergedAnswers as Record<string, unknown>).promo_salary_shown = true;
    }
    if (confirmationMsg) {
      assistantMessage = confirmationMsg + "\n\n" + assistantMessage;
    }
    // Ülke-özel mini rehber: Pasaport "Hayır" cevabında anında kısa yol (araştırın yok)
    const passportNo = (last_ask_id === "passport_status" || last_ask_id === "has_passport") &&
      (mergedAnswers.has_passport === "Hayır" || mergedAnswers.passport_status === "Yok");
    if (passportNo) {
      const miniGuide = [
        "🛂 **Pasaport:** Türkiye'de Nüfus Müdürlüğü'nden randevu alıp başvurunuzu yapın; kimlik ve fotoğraf gerekli.",
        `🌍 **Vize/Çalışma izni:** ${country ? `${country} için ` : ""}AB/AEA vatandaşı değilseniz genelde işveren sponsorluğu veya çalışma izni gerekir. İlandaki "How to apply" koşullarına bakacağız.`,
        "⏱️ **Süre:** Pasaport başvurusu birkaç hafta sürebilir; en erken bu adımı tamamlayın.",
      ].join("\n\n");
      assistantMessage = assistantMessage.trim() ? assistantMessage.trim() + "\n\n---\n\n" + miniGuide : miniGuide;
    }
    const finalAnswers = mergedAnswers as Record<string, unknown>;
    const reportFromGemini = (parsed.report && typeof parsed.report === "object") ? parsed.report : {};
    const reportJson = mapGeminiReportToOur(reportFromGemini);
    if (parsed.report_patch && typeof parsed.report_patch === "object") {
      if (Array.isArray(parsed.report_patch.notes)) {
        (reportJson as { notes?: string[] }).notes = [...((reportJson as { notes?: string[] }).notes ?? []), ...parsed.report_patch.notes];
      }
      const rp = parsed.report_patch;
      if (rp.source_guide && typeof rp.source_guide === "object") {
        (reportJson as Record<string, unknown>).source_guide = rp.source_guide;
      }
      if (rp.documents && typeof rp.documents === "object") {
        (reportJson as Record<string, unknown>).documents = rp.documents;
      }
      if (rp.salary && typeof rp.salary === "object") {
        (reportJson as Record<string, unknown>).salary = rp.salary;
      }
      if (rp.one_week_plan?.days && typeof rp.one_week_plan.days === "object") {
        (reportJson as Record<string, unknown>).one_week_plan = rp.one_week_plan;
      }
      const vw = rp.visa_work as { steps?: string[]; source?: string; dateFetched?: string; note?: string; warning?: string } | undefined;
      if (vw && typeof vw === "object") {
        const steps = Array.isArray(vw.steps) ? vw.steps : [];
        const source = typeof vw.source === "string" ? vw.source : "";
        const dateFetched = typeof vw.dateFetched === "string" ? vw.dateFetched : "";
        const note = typeof vw.note === "string" ? vw.note : typeof vw.warning === "string" ? vw.warning : "";
        (reportJson as Record<string, unknown>).visa_work = { steps, source, dateFetched, ...(note ? { note } : {}) };
      }
    }
    if (visaContextError && !(reportJson as Record<string, unknown>).visa_work) {
      (reportJson as Record<string, unknown>).visa_work = {
        steps: [],
        source: "",
        dateFetched: "",
        note: "Resmî veri alınamadı",
      };
    } else if (!visaContextError && visaSourceForReport && (reportJson as Record<string, unknown>).visa_work) {
      const vw = (reportJson as Record<string, unknown>).visa_work as { steps?: string[]; source?: string; dateFetched?: string; note?: string };
      if (!vw.source && visaSourceForReport.source) vw.source = visaSourceForReport.source;
      if (!vw.dateFetched && visaSourceForReport.dateFetched) vw.dateFetched = visaSourceForReport.dateFetched;
    }
    // Rapor metninde vize bölümünü visa_work'ten türet (steps, source, dateFetched, note)
    const visaWork = (reportJson as Record<string, unknown>).visa_work as
      | { steps?: string[]; source?: string; dateFetched?: string; note?: string }
      | undefined;
    if (visaWork) {
      const parts: string[] = [];
      if (Array.isArray(visaWork.steps) && visaWork.steps.length > 0) {
        parts.push(visaWork.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"));
      }
      if (visaWork.source) parts.push(`Kaynak: ${visaWork.source}`);
      if (visaWork.dateFetched) parts.push(`Veri tarihi: ${visaWork.dateFetched}`);
      if (visaWork.note) parts.push(`Not: ${visaWork.note}`);
      (reportJson as Record<string, unknown>).vize_izin = parts.length > 0 ? parts.join("\n") : (reportJson as Record<string, unknown>).vize_izin;
    }
    const reportMd = buildReportMd(reportJson, reportFromGemini);

    // Guardrails: varsayım yok, "rapor aşağıda" yok (rapor yoksa), "kontrol edin/araştırın" yok
    assistantMessage = applyGuardrails(assistantMessage, {
      answers: mergedAnswers as Record<string, unknown>,
      reportMdEmpty: !reportMd || reportMd.length < 100,
    });

    const score = typeof reportFromGemini.fit_analysis?.score === "number"
      ? Math.max(0, Math.min(100, reportFromGemini.fit_analysis.score))
      : undefined;
    const riskLevel = (reportFromGemini.risk_assessment?.level === "low" || reportFromGemini.risk_assessment?.level === "medium" || reportFromGemini.risk_assessment?.level === "high")
      ? reportFromGemini.risk_assessment.level
      : undefined;

    await auth.supabase
      .from("job_guides")
      .update({
        answers_json: finalAnswers,
        report_json: reportJson,
        report_md: reportMd,
        updated_at: new Date().toISOString(),
        status: "in_progress",
        ...(score != null ? { score } : {}),
        ...(riskLevel ? { risk_level: riskLevel } : {}),
      })
      .eq("id", jobGuideId)
      .eq("user_id", auth.user.id);

    if (rawUserText) {
      await auth.supabase.from("job_guide_events").insert({
        job_guide_id: jobGuideId,
        type: "user_message",
        content: rawUserText,
      });
    }
    const serverNextQuestion = getQuestionTextAndChoices(nextStep);
    const nextQuestionPayload = { id: nextStep.id, text: serverNextQuestion.text, choices: serverNextQuestion.choices, input: serverNextQuestion.input };
    await auth.supabase.from("job_guide_events").insert({
      job_guide_id: jobGuideId,
      type: "assistant_message",
      content: JSON.stringify({ message: assistantMessage, next_question: nextQuestionPayload }),
    });

    const assistant = {
      message_md: assistantMessage,
      quick_replies: serverNextQuestion.choices ?? [],
      ask: {
        id: nextStep.id,
        question: serverNextQuestion.text,
        type: (serverNextQuestion.input ? "textarea" : "choice") as "choice" | "textarea",
        choices: serverNextQuestion.choices,
        input: serverNextQuestion.input,
      },
    };
    const state_patch = {
      answers_patch: (() => {
        const patch: Record<string, unknown> = {};
        if (shouldInjectCvCta) patch.promo_cv_shown = true;
        if (shouldInjectVisaCta) patch.promo_visa_shown = true;
        if (shouldInjectSalaryCta) patch.promo_salary_shown = true;
        return patch;
      })(),
      checklist_patch: [] as Array<{ module_id: string; item_id: string; done: boolean }>,
      progress: { total: progressFromConfig.total, done: progressFromConfig.done, percent: progressFromConfig.pct },
    };
    const next = { should_finalize: false, reason: "" };
    const flags = {
      grounded: true,
      live_sources_used: liveItems.length > 0,
      needs_official_source: !!visaContextError,
      should_offer_cv_package: parsed.flags?.should_offer_cv_package ?? shouldInjectCvCta,
      final_ready: parsed.flags?.final_ready ?? false,
    };

    return NextResponse.json({
      assistant_message: assistantMessage,
      next_question: nextQuestionPayload,
      quick_guide_text: quickGuideText,
      confirmation_message: confirmationMsg ?? undefined,
      report_json: reportJson,
      report_md: reportMd,
      checklist_snapshot: checklistSnapshot,
      score: score ?? undefined,
      risk_level: riskLevel ?? undefined,
      answers_json: finalAnswers,
      assistant,
      state_patch,
      next,
      flags,
    });
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : "unknown_error");
    console.error("[job-guide/chat] error", msg, e);
    if (msg.includes("GEMINI_API_KEY_MISSING")) return NextResponse.json({ error: "gemini_not_configured" }, { status: 503 });
    return NextResponse.json({ error: "internal_error", detail: msg.slice(0, 200) }, { status: 500 });
  }
}

function mapGeminiReportToOur(r: ReportFromGemini): Record<string, unknown> {
  const summary = r.summary?.one_liner ?? "";
  const topActions = r.summary?.top_actions ?? [];
  const howTo = r.how_to_apply;
  const rehber = Array.isArray(howTo?.steps) ? howTo.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") : "";
  const docs = r.documents;
  const belgeler = [
    Array.isArray(docs?.required) ? "Gerekli: " + docs.required.join(", ") : "",
    Array.isArray(docs?.optional) ? "Opsiyonel: " + docs.optional.join(", ") : "",
    Array.isArray(docs?.warnings) ? "Uyarılar: " + docs.warnings.join("; ") : "",
  ].filter(Boolean).join("\n");
  const visa = r.work_permit_and_visa;
  const vizeText = visa && typeof visa === "object" ? JSON.stringify(visa) : "";
  const sal = r.salary_and_life_calc as Record<string, unknown> | undefined;
  const maasText = sal ? [sal.net_salary_estimate, sal.rent_estimate, sal.food_estimate, sal.remaining_estimate].filter(Boolean).join(" · ") : "";
  const risk = r.risk_assessment;
  const riskText = Array.isArray(risk?.items) ? risk.items.map((i) => `${i.title ?? ""}: ${i.what_to_do ?? ""}`).join("\n") : (risk?.level ?? "");
  const fit = r.fit_analysis;
  const sanaOzel = [...(fit?.strengths ?? []), ...(fit?.gaps ?? [])].join("\n");
  const plan = r.plan_30_days;
  const planText = [
    plan?.week1?.length ? "Hafta 1: " + plan.week1.join("; ") : "",
    plan?.week2?.length ? "Hafta 2: " + plan.week2.join("; ") : "",
    plan?.week3?.length ? "Hafta 3: " + plan.week3.join("; ") : "",
    plan?.week4?.length ? "Hafta 4: " + plan.week4.join("; ") : "",
  ].filter(Boolean).join("\n");
  return {
    summary,
    top_actions: topActions,
    rehber,
    belgeler,
    vize_izin: vizeText,
    maas_yasam: maasText,
    risk: riskText,
    sana_ozel: sanaOzel,
    plan_30_gun: planText,
    score: typeof fit?.score === "number" ? fit.score : undefined,
  };
}

function buildReportMd(reportJson: Record<string, unknown>, r: ReportFromGemini): string {
  const parts = [
    "# Bu İlan İçin Nasıl Başvururum\n",
    reportJson.score != null ? `## Uygunluk Skoru: ${reportJson.score}/100\n` : "",
    `## Özet\n${String(reportJson.summary ?? "")}\n`,
    Array.isArray(reportJson.top_actions) && reportJson.top_actions.length ? `## Öncelikli 3 Aksiyon\n${reportJson.top_actions.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")}\n` : "",
    reportJson.rehber ? "## Bu İşe Nasıl Başvurulur?\n" + reportJson.rehber + "\n" : "",
    reportJson.belgeler ? "\n## Gerekli Belgeler\n" + reportJson.belgeler + "\n" : "",
    reportJson.vize_izin ? "\n## Çalışma İzni ve Vize\n" + reportJson.vize_izin + "\n" : "",
    reportJson.maas_yasam ? "\n## Maaş ve Yaşam\n" + reportJson.maas_yasam + "\n" : "",
    reportJson.risk ? "\n## Risk Değerlendirmesi\n" + reportJson.risk + "\n" : "",
    reportJson.sana_ozel ? "\n## Sana Özel Analiz\n" + reportJson.sana_ozel + "\n" : "",
    reportJson.plan_30_gun ? "\n## 30 Günlük Plan\n" + reportJson.plan_30_gun + "\n" : "",
    reportJson.one_week_plan && typeof reportJson.one_week_plan === "object" && (reportJson.one_week_plan as { days?: Record<string, string[]> }).days
      ? "\n## 1 Haftalık Plan\n" + Object.entries((reportJson.one_week_plan as { days: Record<string, string[]> }).days)
          .map(([day, items]) => `### ${day}\n${Array.isArray(items) ? items.map((i) => `- ${i}`).join("\n") : ""}`)
          .join("\n\n") + "\n"
      : "",
  ];
  return parts.join("");
}
