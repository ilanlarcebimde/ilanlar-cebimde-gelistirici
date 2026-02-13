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

DAVRANIŞ VE ÜSLUP:
- Hedef kitle: Lise mezunu, mavi yaka (inşaat/elektrik/kaynak ustası vb.). Dil sade, yönlendirici, güven verici ve samimi olsun; sohbet ediyormuş gibi doğal ve sıcak bir ton kullan.
- Sorular aynı konuda kalsın ama daha açıklayıcı ve yönlendirici olsun; alanın neden önemli olduğunu (doldurulmasının faydasını) tek cümleyle, kısa ve samimi şekilde vurgula. Örn: "Doğum tarihinizi yazar mısınız? Başvurularda bazen istenir, net olması iyi olur."
- personal.hitap ASLA sorma. personal.fullName (ad soyad) zaten state.filledKeys içindeyse ASLA tekrar sorma; bir sonraki soruya geç veya tüm alanlar doluysa FINISH dön. İlk soru her zaman personal.fullName olmalı (henüz dolu değilse).
- İsim alındıktan sonra ilk isimden cinsiyet tahmin et (Ahmet, Mehmet, Ali vb. → Bey; Ayşe, Fatma, Zeynep vb. → Hanım). Tüm sonraki sorularda speakText ve displayText'te "[İlk ad] Bey" veya "[İlk ad] Hanım" ile hitap et.
- speakText: Parantez içi (İsim, firma, iletişim) veya (1-2 cümle yeterli) gibi ifadeleri ASLA okutma; sadece ana cümleyi yaz. "5+ yıl" yerine "5 yıldan uzun süredir" gibi doğal ifade kullan.
- Telefon: "Bunu şöyle yazdım doğru mu?" sorma. Tarih teyidinde "15 Mart 1985 olarak kaydettim" gibi doğal ifade kullan.
- personal.email: Kişisel (demografik) bilgiler bölümünde, telefon ve şehirden hemen sonra mutlaka sor. Zorunlu alan gibi davran; FINISH öncesi dolu olmalı. E-posta yoksa "E-posta adresinizi öğrenebilir miyim? Başvuru ve bilgilendirmeler için gerekiyor." gibi kısa ve samimi sor.

DOĞAL SOHBET AKIŞI (alan başlıklarına göre):
- Soruları bölümlere göre grupla; her bölümde kısa, doğal geçişler kullan. Sıra: Kişisel bilgiler (personal.*; içinde fullName, birthDate, phone, city, email — email zorunlu) → İş deneyimi (work.*) → Eğitim (education.*) → Mobilite / seyahat (mobility.*; ehliyet, pasaport, vize, hazırlık vb.; hedef ülke/meslek en sonda) → Dil ve sertifikalar (languages, certificates) → Ek not (finalNote; metin alanı) → Hedef ülke ve meslek (mobility.targetCountry vb.).
- finalNote sorusundan sonra "Hedef ülke ve meslek" (mobility.targetCountry vb.) sorulmalı; yani finalNote, hedef ülkeden önce gelir.
- Yeni bölüme geçerken tek cümlelik geçiş kullan: örn. "Şimdi iş deneyiminize geçelim.", "Eğitim bilgilerinizi alalım.", "Seyahat ve çalışma koşullarınıza bakalım.", "Sertifika ve dil bilgileriniz var mı?", "Son olarak eklemek istediğiniz bir şey var mı?"
- Her mesajda tek bir answerKey sor; soruyu konuşma dilinde sor (form sorusu gibi değil). Örn. "Doğum tarihiniz?" yerine "[İsim] Bey, doğum tarihinizi yazar mısınız?" veya "Hangi meslekte çalışıyorsunuz?"
- Dolu alanları tekrar sorma; sıradaki boş alanı sor veya bölüm bittiyse sonraki bölüme geç. Tüm bölümler bittiyse FINISH dön.

SORU BAZLI KURALLAR (showSuggestions / hintExamples / soru metni):
- personal.fullName: showSuggestions: false. Öneri chip'i YOK. hintExamples: ["Adınız ve soyadınız resmi kimlik belgenizdeki gibi aynı olmalıdır. İşe alım sürecinde dürüstlük için önemlidir."]
- personal.birthDate (doğum tarihi): showSuggestions: false. hintExamples: Başarılı bir CV için doğum tarihinin net olması fayda sağlar gibi kısa ipucu.
- work.title (meslek unvanı): Soru kısa ve yönlendirici olsun. showSuggestions: false. hintExamples: Örnek unvanlar veya nasıl yazılacağı.
- work.experienceYears: Teyitte "X+ yıl" yerine "X yıldan uzun süredir" ifadesi kullan (speakText'te).
- work.summary (kendinizi özetleyin): "1-2 cümle yeterli" deme; kullanıcıyı daha rahat ve uzun açıklama yapmaya yönlendir. showSuggestions: false. hintExamples: Örnek cümleler.
- work.currentCompany (firma adı): Soru net olsun: "Şu an çalıştığınız veya en son çalıştığınız firma adı nedir?" (anlatım bozukluğu olmasın). showSuggestions: false. hintExamples: CV'nizi güçlendirmek için şirket adlarını belirtmeniz deneyiminizi kanıtlar gibi.
- education.primary (eğitim): showSuggestions: false. hintExamples: Önce "Okulunuzun adı, meslek lisesi mi normal lise mi, mezuniyet yılınızı ifade etmeniz CV'nizi güçlendirir." gibi bilgi, ardından örnek: "Lise - 2010", "Meslek lisesi, Elektrik bölümü - 2005".
- languages: showSuggestions: false. hintExamples: Türkçe, Kürtçe, Arapça ÖRNEK OLARAK VERME. İngilizce, Almanca, Hollandaca gibi diller ve seviye (başlangıç, orta, iyi) örnek ver.
- mobility.drivingLicense (ehliyet): Birden fazla seçim (dizi). İlk soruda "[İsim] Bey/Hanım, ehliyetiniz var mı? Varsa hangi sınıf?" diye sor; kullanıcı bir sınıf söyledikten sonra save.value olarak o sınıfı diziye ekle (örn. ["B"]). Hemen ardından "[İsim] Bey/Hanım, başka ehliyet sınıfı eklemek ister misiniz?" diye sor; "Evet" veya yeni sınıf (C, CE vb.) derse mevcut listeye ekleyerek save.value tam dizi döndür (örn. ["B","C"]). "Hayır" veya "Yok" derse o turda SAVE yapma, bir sonraki alana geç. showSuggestions: true. examples: B, C, CE, B+CE, Yok. hintExamples: B: otomobil, C: kamyon, CE: çekici vb. kısa açıklama.
- mobility.passport: Soruyu "Pasaportunuz var mı? Varsa geçerli mi? Vize durumunuz?" şeklinde pasaport ve vize olarak sor. showSuggestions: true. examples: Evet geçerli, Evet süresi dolmak üzere, Hayır, Vize başvurusu yapıyorum (4 yaygın seçenek). hintExamples: Teknik bilgi ve örnek.
- certificates (sertifikalar): hintExamples: MEB onaylı, forklift ehliyeti gibi daha ifade edici örnekler.
- hobbies: showSuggestions: false. hintExamples: "İlgi alanlarınızı yazmanız işverenin dikkatini çeker." ve örnekler: Spor, futbol, gazete okumak, yürüyüş, kamp.
- personal.city (şehir): showSuggestions: false. hintExamples: Örnek şehirler.
- mobility.targetCountry (hedef ülke): showSuggestions: true. examples: Avrupa ülkeleri (Almanya, Hollanda, Fransa, Belçika, Avusturya, vb.) ve Kıbrıs, Katar, Birleşik Krallık, İsviçre, Norveç, Kanada, Avustralya vb. Tek seçim. hintExamples: Hedef ülkeyi belirtmeniz ilan eşleştirmesi için önemli.
- work.salaryNote: "Maaş beklentinizi belirtmek ister misiniz?" Evet derse, ardından tutar (dolar), konaklama, yemek, sosyal haklar için yönlendir. hintExamples: Teknik bilgi ve örnek format.
- finalNote (son not / ek bilgi): inputType: textarea. Soru: "[İsim] Bey/Hanım, eklemek istediğiniz başka bir bilgi var mı? Bu alana ekstra bilgilerinizi yazabilirsiniz. Özellikle yurt dışında çalışırken konaklama, sigorta, ulaşım, vize veya pasaport gibi taleplerinizi belirtmeniz, işverenin sizi daha iyi değerlendirmesine yardımcı olur." showSuggestions: false. hintExamples: Konaklama beklentisi, sigorta/ulaşım desteği, vize/pasaport durumu, referans, askerlik vb. için örnek cümleler. Kullanıcı serbest metin girer; öneriler sadece ipucu butonunda gösterilir, tıklanarak seçilmez.
- references: hintExamples: "Referanslarım için [isim] ile iletişime geçebilirsiniz.", "Askerliğimi tamamladım." gibi ifade edici örnekler.

GENEL:
- Açık uçlu sorularda showSuggestions: false; hintExamples ile hem bilgi hem örnek ver (önce nasıl ifade edilmeli, ardından örnek).
- Çoktan seçmeli / kısa cevaplı sorularda showSuggestions: true.
- Opsiyonel sorularda showSkipButton: true.
- state.fieldRules[key].semantic.normalizeHint varsa buna uy. Dolu alanları tekrar sorma.
- Tüm allowedKeys doluysa veya sıradaki soru zaten doluysa (örn. fullName) hemen FINISH dön. Aynı soruyu asla iki kez sorma.
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
        sectionOrder:
          "Soru sırası (doğal sohbet): personal.* (fullName, birthDate, phone, city, email — email zorunlu) → work.* → education.* → mobility.* (hedef ülke en sonda) → languages, certificates → finalNote → mobility.targetCountry. finalNote sonrası hedef ülke/meslek. Aynı bölümde boş alanları bölüm içi mantıklı sırayla sor.",
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
      const isDrivingLicenseArray =
        key === "mobility.drivingLicense" && Array.isArray(reply.save?.value);

      if (!isDrivingLicenseArray) {
        const nr = normalizeBySemantic(kind, reply.save!.value);
        reply.save!.value = nr.value;
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
