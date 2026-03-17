import type { VisaLeadFormValues } from "@/components/visa-wizard/schema";

export function calculateLeadScore(values: VisaLeadFormValues, uploadedFileCount: number) {
  let score = 0;

  score += 10; // form completed
  if (values.targetCountry) score += 10;
  if (values.applicationTimeline && values.applicationTimeline !== "info_only") score += 10;
  if ((values.passportStatus ?? "").toLowerCase().includes("var")) score += 15;
  if (values.budgetReady) score += 15;
  if (values.canFollowProcess) score += 10;
  if (uploadedFileCount > 0) score += 15;
  if (values.whatsapp) score += 5;

  if (values.visaType === "work") {
    if (values.hasCv) score += 10;
    if (values.hasJobOffer) score += 10;
  }

  if (values.visaType === "family" && values.officialMarriage) score += 15;
  if (values.visaType === "student" && values.schoolAcceptance) score += 15;
  if (values.visaType === "tourist" && values.hasInvitation) score += 10;
  if (values.previousRefusal) score -= 5;

  const bounded = Math.max(0, Math.min(score, 100));
  return { score: bounded, status: getLeadStatusByScore(bounded) };
}

export function getLeadStatusByScore(score: number): "hot" | "warm" | "low" | "weak" {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  if (score >= 40) return "low";
  return "weak";
}
