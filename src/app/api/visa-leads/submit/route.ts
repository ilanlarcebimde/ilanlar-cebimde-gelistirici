import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { calculateLeadScore } from "@/lib/visa-leads/score";
import { visaLeadSchema } from "@/components/visa-wizard/schema";

const BUCKET = "visa-lead-files";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);

const FILE_KEYS = [
  "passportOrId",
  "cv",
  "diploma",
  "refusalLetter",
  "invitationOrOffer",
  "extras",
] as const;

type FileKey = (typeof FILE_KEYS)[number];

function safeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function extractFiles(formData: FormData) {
  const files: Array<{ key: FileKey; file: File }> = [];
  for (const key of FILE_KEYS) {
    const values = formData.getAll(key);
    for (const value of values) {
      if (value instanceof File && value.size > 0) {
        files.push({ key, file: value });
      }
    }
  }
  return files;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const rawPayload = formData.get("payload");
    if (typeof rawPayload !== "string") {
      return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const parsed = visaLeadSchema.safeParse(JSON.parse(rawPayload));
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_FIELDS", issues: parsed.error.issues }, { status: 400 });
    }

    const files = extractFiles(formData);
    if (files.length < 1) {
      return NextResponse.json({ error: "AT_LEAST_ONE_FILE_REQUIRED" }, { status: 400 });
    }

    for (const item of files) {
      if (item.file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: `FILE_TOO_LARGE:${item.file.name}` }, { status: 400 });
      }
      if (!ALLOWED_MIME.has(item.file.type)) {
        return NextResponse.json({ error: `FILE_TYPE_NOT_ALLOWED:${item.file.name}` }, { status: 400 });
      }
    }

    const values = parsed.data;
    const { score, status } = calculateLeadScore(values, files.length);

    const supabase = getSupabaseAdmin();

    const { data: leadRow, error: leadError } = await supabase
      .from("visa_leads")
      .insert({
        full_name: values.fullName,
        phone: values.phone,
        whatsapp: values.whatsapp ?? null,
        email: values.email,
        age: values.age ?? null,
        city: values.city,
        nationality: values.nationality,
        visa_type: values.visaType,
        target_country: values.targetCountry,
        application_goal: values.applicationGoal,
        application_timeline: values.applicationTimeline,
        profession: values.profession ?? null,
        experience_years: values.experienceYears ?? null,
        abroad_experience: values.abroadExperience ?? null,
        language_level: values.languageLevel ?? null,
        has_cv: values.hasCv ?? null,
        has_job_offer: values.hasJobOffer ?? null,
        travel_duration: values.travelDuration ?? null,
        has_invitation: values.hasInvitation ?? null,
        has_accommodation_plan: values.hasAccommodationPlan ?? null,
        family_relation: values.familyRelation ?? null,
        spouse_country: values.spouseCountry ?? null,
        official_marriage: values.officialMarriage ?? null,
        spouse_residency_status: values.spouseResidencyStatus ?? null,
        school_acceptance: values.schoolAcceptance ?? null,
        school_program: values.schoolProgram ?? null,
        education_budget: values.educationBudget ?? null,
        unsure_reason: values.unsureReason ?? null,
        passport_status: values.passportStatus,
        passport_validity: values.passportValidity ?? null,
        previous_refusal: values.previousRefusal ?? null,
        budget_ready: values.budgetReady ?? null,
        can_follow_process: values.canFollowProcess ?? null,
        preferred_contact_channel: values.preferredContactChannel,
        support_need: values.supportNeed,
        consultant_note_for_call: values.consultantNoteForCall ?? null,
        consent_data_share: values.consentDataShare,
        consent_contact: values.consentContact,
        consent_accuracy: values.consentAccuracy,
        lead_score: score,
        lead_status: status,
      })
      .select("id, lead_score, lead_status")
      .single();

    if (leadError || !leadRow) {
      console.error("[visa-leads/submit] lead insert error", leadError);
      return NextResponse.json({ error: "LEAD_INSERT_FAILED" }, { status: 500 });
    }

    const fileRows: Array<{
      lead_id: string;
      file_type: string;
      file_name: string;
      file_path: string;
      mime_type: string;
      file_size: number;
    }> = [];

    for (const item of files) {
      const ext = (item.file.name.split(".").pop() || "bin").toLowerCase();
      const safeName = safeFileName(item.file.name);
      const path = `${leadRow.id}/${Date.now()}-${safeName || `file.${ext}`}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, item.file, {
        cacheControl: "3600",
        upsert: false,
        contentType: item.file.type,
      });

      if (uploadError) {
        console.error("[visa-leads/submit] upload error", uploadError);
        continue;
      }

      fileRows.push({
        lead_id: leadRow.id,
        file_type: item.key,
        file_name: item.file.name,
        file_path: path,
        mime_type: item.file.type,
        file_size: item.file.size,
      });
    }

    if (fileRows.length > 0) {
      const { error: fileInsertError } = await supabase.from("visa_lead_files").insert(fileRows);
      if (fileInsertError) {
        console.error("[visa-leads/submit] file rows insert error", fileInsertError);
      }
    }

    return NextResponse.json({
      leadId: leadRow.id,
      leadScore: leadRow.lead_score,
      leadStatus: leadRow.lead_status,
    });
  } catch (error) {
    console.error("[visa-leads/submit] unexpected", error);
    return NextResponse.json({ error: "UNEXPECTED_ERROR" }, { status: 500 });
  }
}
