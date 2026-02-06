import { NextResponse } from "next/server";
import { normalizeBySemantic } from "@/lib/assistant/normalizers";

export const runtime = "nodejs";

type AssistantNextAction = "ASK" | "CLARIFY" | "SAVE_AND_NEXT" | "FINISH";

type AssistantReply = {
  speakText: string;
  displayText: string;
  answerKey: string;
  inputType: "text" | "textarea" | "number" | "date" | "select";
  examples: string[];
  /** Açık uçlu sorularda false; çoktan seçmeli/stratejik sorularda true — öneri chip'leri sadece true iken gösterilir. */
  showSuggestions?: boolean;
  /** Opsiyonel sorularda true — "Bu Adımı Atla" butonu gösterilir. */
  showSkipButton?: boolean;
  /** İpucu butonunda gösterilecek örnek cevaplar (açık uçlu sorularda; parantez içi okunmaz). */
  hintExamples?: string[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  review?: {
    needsNormalization?: boolean;
    normalizedHint?: string;
    normalizedValue?: string;
    confidence?: number;
  };
  nextAction: AssistantNextAction;
  save?: { key: string; value: unknown };
  progress?: { step: number; total: number };
  debug?: { reason?: string };
};

type FieldRuleShape = {
  key: string;
  label?: string;
  inputType: "text" | "textarea" | "number" | "date" | "select";
  examples?: string[];
  validation?: { required?: boolean; minLength?: number; maxLength?: number; pattern?: string };
  semantic?: { kind?: string; normalizeHint?: string };
};

type AssistantState = {
  sessionId: string;
  locale: "tr-TR";
  cv: Record<string, unknown>;
  filledKeys: string[];
  lastQuestion?: string;
  lastAnswer?: string;
  history: Array<{ role: "user" | "assistant"; text: string }>;
  target?: { role?: string; country?: string };
  allowedKeys: string[];
  keyHints?: Record<string, string>;
  fieldRules: Record<string, FieldRuleShape>;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function asArrayOfStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string").slice(0, 12);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function validateReply(
  raw: Record<string, unknown>,
  allowedKeys: string[],
  fieldRules: Record<string, FieldRuleShape>
): AssistantReply {
  if (!Array.isArray(allowedKeys) || allowedKeys.length === 0) {
    throw new Error("INVALID_STATE:allowedKeys_missing");
  }
  if (!fieldRules || typeof fieldRules !== "object") {
    throw new Error("INVALID_STATE:fieldRules_missing");
  }

  const speakText = isNonEmptyString(raw?.speakText) ? raw.speakText : "";
  const displayText = isNonEmptyString(raw?.displayText) ? raw.displayText : speakText;
  const answerKey = isNonEmptyString(raw?.answerKey) ? raw.answerKey : "";
  const inputType =
    raw?.inputType === "text" ||
    raw?.inputType === "textarea" ||
    raw?.inputType === "number" ||
    raw?.inputType === "date" ||
    raw?.inputType === "select"
      ? raw.inputType
      : "text";

  const examples = asArrayOfStrings(raw?.examples);
  const showSuggestions = raw?.showSuggestions === true;
  const showSkipButton = raw?.showSkipButton === true;
  const hintExamples = asArrayOfStrings(raw?.hintExamples).slice(0, 6);

  const nextAction: AssistantNextAction =
    raw?.nextAction === "ASK" ||
    raw?.nextAction === "CLARIFY" ||
    raw?.nextAction === "SAVE_AND_NEXT" ||
    raw?.nextAction === "FINISH"
      ? raw.nextAction
      : "ASK";

  const reply: AssistantReply = {
    speakText,
    displayText,
    answerKey,
    inputType,
    examples,
    showSuggestions: showSuggestions || undefined,
    showSkipButton: showSkipButton || undefined,
    hintExamples: hintExamples.length ? hintExamples : undefined,
    nextAction,
    validation: raw?.validation && typeof raw.validation === "object" ? (raw.validation as AssistantReply["validation"]) : undefined,
    review: raw?.review && typeof raw.review === "object" ? (raw.review as AssistantReply["review"]) : undefined,
    save: raw?.save && typeof raw.save === "object" ? (raw.save as AssistantReply["save"]) : undefined,
    progress:
      raw?.progress &&
      typeof raw.progress === "object" &&
      raw.progress !== null &&
      Number.isFinite((raw.progress as { step?: number }).step) &&
      Number.isFinite((raw.progress as { total?: number }).total)
        ? {
            step: clamp(Number((raw.progress as { step: number }).step), 0, 999),
            total: clamp(Number((raw.progress as { total: number }).total), 1, 999),
          }
        : undefined,
    debug: raw?.debug && typeof raw.debug === "object" ? (raw.debug as AssistantReply["debug"]) : undefined,
  };

  if (!isNonEmptyString(reply.speakText)) {
    throw new Error("INVALID_REPLY:speakText_missing");
  }
  if (!isNonEmptyString(reply.answerKey) && reply.nextAction !== "FINISH") {
    throw new Error("INVALID_REPLY:answerKey_missing");
  }
  if (reply.nextAction !== "FINISH") {
    if (!allowedKeys.includes(reply.answerKey)) {
      throw new Error("INVALID_REPLY:answerKey_not_allowed");
    }
  }
  if (reply.nextAction === "SAVE_AND_NEXT") {
    if (!reply.save || !isNonEmptyString(reply.save.key)) {
      throw new Error("INVALID_REPLY:save_missing");
    }
    if (!allowedKeys.includes(reply.save.key)) {
      throw new Error("INVALID_REPLY:saveKey_not_allowed");
    }
  }

  if (reply.nextAction !== "FINISH") {
    const rule = fieldRules[reply.answerKey];
    if (rule?.inputType && reply.inputType !== rule.inputType) {
      throw new Error("INVALID_REPLY:inputType_mismatch");
    }
  }

  return reply;
}

function buildSystemInstruction() {
  return `
Sen bir "CV Görüşme Asistanı" motorusun. Dil Türkçe (tr-TR).
Amaç: Kullanıcıdan CV verilerini adım adım toplamak.

ÇOK KRİTİK KURAL (KEY ve KURAL UYUMU):
- state.allowedKeys: İzinli saveKey listesi.
- state.fieldRules: Her saveKey için inputType/validation/semantic kuralları.
- answerKey ve save.key SADECE state.allowedKeys içinden seçilir.
- inputType SADECE seçtiğin key'in state.fieldRules[key].inputType değeri olmalı.
- Eğer kullanıcı cevabı yanlış tipe gidiyorsa:
  - nextAction="CLARIFY" ile düzeltici soru sor
  - veya review.normalizedValue üretip normalize et.

ÇIKTI:
- SADECE geçerli JSON döndür (JSON dışında tek karakter bile yok).

JSON ŞEMASI:
{
  "speakText": "...",
  "displayText": "...",
  "answerKey": "allowedKeys içinden",
  "inputType": "state.fieldRules[answerKey].inputType",
  "examples": ["..."],
  "showSuggestions": true veya false,
  "showSkipButton": true veya false,
  "hintExamples": ["örnek1", "örnek2"],
  "validation": { ... },
  "review": { ... },
  "nextAction": "ASK|CLARIFY|SAVE_AND_NEXT|FINISH",
  "save": { "key": "...", "value": "..." },
  "progress": { "step": 1, "total": 18 },
  "debug": { "reason": "..." }
}

DAVRANIŞ:
- Hedef kitle: Lise mezunu, mavi yaka (inşaat/elektrik/kaynak ustası vb.). Dil sade, yönlendirici, güven verici olsun.
- speakText: Parantez içi (İsim, firma, iletişim) gibi teknik detayları ASLA okutma; sadece ana cümleyi yaz. displayText'te parantez kalabilir.
- Telefon: "Bunu şöyle yazdım doğru mu?" sorma. Kaydettim deyip bir sonraki soruya geç.
- Tarih: Teyit ederken "15 Mart 1985 olarak kaydettim" gibi doğal ifade kullan; sayısal kod okuma.
- Açık uçlu sorular (iş tanımı, kendini özetleme, referans, ek not): examples boş bırak, showSuggestions: false, hintExamples ile 1-2 örnek cümle ver (ipucu kartında gösterilir).
- Çoktan seçmeli / kısa cevaplı sorular (ehliyet, vardiya, hedef ülke, en erken başlama, eğitim seviyesi): examples doldur ve showSuggestions: true.
- Opsiyonel sorularda (referans, ek not, fotoğraf, maaş notu vb.): showSkipButton: true. "Hayır" veya atla geçilebilsin.
- İsim: Önce ad soyad al; sonra cinsiyete göre "Memnun oldum Ahmet Bey" / "Hanım" diye hitap et. Hitap seçimi ayrı input olarak sorma.
- state.fieldRules[key].semantic.normalizeHint varsa buna uy. Dolu alanları tekrar sorma. Tümü tamamlanınca FINISH.
`.trim();
}

function buildUserPrompt(state: AssistantState) {
  return JSON.stringify(
    {
      state,
      guidance: {
        allowedKeys: state.allowedKeys,
        keyHints: state.keyHints ?? {},
        rule: "answerKey ve save.key sadece allowedKeys içinden seçilecek.",
      },
      now: new Date().toISOString(),
    },
    null,
    2
  );
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("JSON_PARSE_FAILED");
  }
}

async function callGeminiStrictJson(system: string, user: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");

  // Varsayılan: gemini-2.0-flash (v1beta'da mevcut; 1.5-flash bazı hesaplarda 404 veriyor)
  const model = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim().replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Vercel loglarında teşhis için (API key URL'de loglanmaz)
  console.log("--- GEMINI DEBUG ---");
  console.log("İşlenen Model Adı:", model);
  console.log("URL (key gizli):", `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=***`);
  console.log("API Key Var mı?:", !!apiKey);
  console.log("--- GEMINI DEBUG BİTİŞ ---");

  // v1 API systemInstruction desteklemiyor; sistem talimatını ilk kullanıcı mesajının başına ekliyoruz
  const userPromptWithSystem = `${system}\n\n---\n\nKullanıcı girdisi:\n${user}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userPromptWithSystem }] }],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`GEMINI_HTTP_${res.status}:${t.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("") || "";

  if (!isNonEmptyString(text)) throw new Error("GEMINI_EMPTY_RESPONSE");
  return text;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { state?: AssistantState };
    const state = body?.state;

    if (!state || typeof state !== "object") {
      return NextResponse.json({ error: "state_required" }, { status: 400 });
    }
    if (!isNonEmptyString(state.sessionId)) {
      return NextResponse.json({ error: "sessionId_required" }, { status: 400 });
    }
    if (!Array.isArray(state.allowedKeys) || state.allowedKeys.length === 0) {
      return NextResponse.json({ error: "allowedKeys_required" }, { status: 400 });
    }
    if (!state.fieldRules || typeof state.fieldRules !== "object") {
      return NextResponse.json({ error: "fieldRules_required" }, { status: 400 });
    }

    const system = buildSystemInstruction();
    const user = buildUserPrompt(state);

    const rawText = await callGeminiStrictJson(system, user);
    const rawJson = extractJson(rawText);
    const reply = validateReply(rawJson, state.allowedKeys, state.fieldRules);

    if (reply.nextAction === "SAVE_AND_NEXT" && reply.save?.key) {
      const key = reply.save.key;
      const rule = state.fieldRules?.[key];
      const kind = rule?.semantic?.kind as string | undefined;

      const nr = normalizeBySemantic(kind, reply.save.value);
      reply.save.value = nr.value;

      const normalizedStr =
        typeof nr.value === "string" ? nr.value : String(nr.value ?? "");

      if (nr.changed) {
        reply.review = {
          ...(reply.review || {}),
          needsNormalization: true,
          normalizedValue: normalizedStr,
          normalizedHint:
            rule?.semantic?.normalizeHint ||
            reply.review?.normalizedHint ||
            "Biçimi düzelttim.",
          confidence: reply.review?.confidence ?? 0.85,
        };
      }

      if (nr.warning) {
        reply.debug = { ...(reply.debug || {}), reason: nr.warning };
      }
    }

    return NextResponse.json({ reply }, { status: 200 });
  } catch (e: unknown) {
    const msg = String(e instanceof Error ? e.message : "unknown_error");

    if (msg.includes("GEMINI_API_KEY_MISSING")) {
      return NextResponse.json({ error: "gemini_not_configured" }, { status: 503 });
    }
    if (msg.includes("INVALID_STATE")) {
      return NextResponse.json({ error: "invalid_state", detail: msg.slice(0, 180) }, { status: 400 });
    }
    if (msg.includes("JSON_PARSE_FAILED") || msg.includes("INVALID_REPLY")) {
      return NextResponse.json(
        { error: "assistant_bad_output", detail: msg.slice(0, 180) },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: "internal_error", detail: msg.slice(0, 180) }, { status: 500 });
  }
}
