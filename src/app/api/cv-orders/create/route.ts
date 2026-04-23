import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cvOrderCreateBodySchema } from "@/components/cv/cvWizardSchema";

interface CreateBody {
  data?: {
    targetCountry?: string;
    jobAreaId?: string;
    jobTitle?: string;
    roleDescription?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    age?: string;
    city?: string;
    passportStatus?: string;
    experienceYears?: string;
    lastCompany?: string;
    lastPosition?: string;
    workTasks?: string;
    equipments?: string;
    workAreas?: string;
    drivingLicense?: string;
    certificates?: string;
    masterCertificate?: string;
    myk?: string;
    referenceInfo?: string;
    languages?: string;
    notes?: string;
    canWorkCountries?: string;
    shiftPreference?: string;
    canAcceptAccommodation?: string;
    canStartNow?: string;
    salaryExpectation?: string;
    workMode?: string;
    photoUrl?: string | null;
  };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as CreateBody;
  const parsed = cvOrderCreateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD", issues: parsed.error.issues }, { status: 400 });
  }

  const d = parsed.data.data;
  const email = (d.email ?? "").trim();
  const fullName = (d.fullName ?? "").trim();

  if (!email) {
    return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("cv_orders")
    .insert({
      email,
      full_name: fullName || null,
      phone: (d.phone ?? "").trim() || null,
      age: (d.age ?? "").trim() || null,
      city: (d.city ?? "").trim() || null,
      target_country: (d.targetCountry ?? "").trim() || null,
      job_category: (d.jobAreaId ?? "").trim() || null,
      job_title: (d.jobTitle ?? "").trim() || null,
      role_description: (d.roleDescription ?? "").trim() || null,
      position_summary: (d.positionSummary ?? "").trim() || null,
      education_level: (d.educationLevel ?? "").trim() || null,
      experience_years: (d.experienceYears ?? "").trim() || null,
      last_company: (d.lastCompany ?? "").trim() || null,
      last_position: (d.lastPosition ?? "").trim() || null,
      work_tasks: (d.workTasks ?? "").trim() || null,
      equipments: (d.equipments ?? "").trim() || null,
      work_areas: (d.workAreas ?? "").trim() || null,
      driving_license: (d.drivingLicense ?? "").trim() || null,
      certificates: (d.certificates ?? "").trim() || null,
      master_certificate: (d.masterCertificate ?? "").trim() || null,
      myk: (d.myk ?? "").trim() || null,
      reference_info: (d.referenceInfo ?? "").trim() || null,
      languages: (d.languages ?? "").trim() || null,
      notes: (d.notes ?? "").trim() || null,
      can_work_countries: (d.canWorkCountries ?? "").trim() || null,
      shift_preference: (d.shiftPreference ?? "").trim() || null,
      can_accept_accommodation: (d.canAcceptAccommodation ?? "").trim() || null,
      can_start_now: (d.canStartNow ?? "").trim() || null,
      availability_date: (d.availabilityDate ?? "").trim() || null,
      salary_expectation: (d.salaryExpectation ?? "").trim() || null,
      work_mode: (d.workMode ?? "").trim() || null,
      work_type: (d.workType ?? "").trim() || null,
      accommodation_acceptance: (d.accommodationAcceptance ?? "").trim() || null,
      experience_entries: d.experienceEntries ?? [],
      education_entries: d.educationEntries ?? [],
      certificate_entries: d.certificateEntries ?? [],
      language_entries: d.languageEntries ?? [],
      reference_entries: d.referenceEntries ?? [],
      photo_url: (d.photoUrl ?? "").trim() || null,
      price: 279,
      payment_status: "pending",
      order_status: "draft",
    })
    .select("id, email, full_name")
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[cv-orders/create] insert error", error);
    return NextResponse.json({ error: "INSERT_FAILED" }, { status: 500 });
  }

  return NextResponse.json({
    cv_order_id: data.id,
    email: data.email,
    fullName: data.full_name ?? "",
  });
}

