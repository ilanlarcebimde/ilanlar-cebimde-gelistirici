/** Yönetici test kuponu — gömülü test hesabı + isteğe bağlı `ADMINSUPER2026_ALLOWED_EMAILS`. */
export const ADMINSUPER2026_CODE = "ADMINSUPER2026";

/** Aynı hizmet anahtarı için iki test tamamlama arası bekleme (ms). */
export const ADMINSUPER2026_COOLDOWN_MS = 60 * 60 * 1000;

const BUILTIN_TEST_EMAILS = new Set(["ilanlarcebimde@gmail.com"]);

export function parseAdminsuper2026AllowedEmails(): Set<string> {
  const raw = process.env.ADMINSUPER2026_ALLOWED_EMAILS?.trim() ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminsuper2026EmailAllowed(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (e.length > 0 && BUILTIN_TEST_EMAILS.has(e)) return true;
  const allowed = parseAdminsuper2026AllowedEmails();
  if (allowed.size === 0) return false;
  return allowed.has(e);
}

/** letter_panel | weekly | cv_package | full */
export function getAdminsuperServiceKey(args: {
  letterPanel: boolean;
  pending: { plan?: string } | null | undefined;
}): string {
  if (args.letterPanel) return "letter_panel";
  const plan = args.pending?.plan;
  if (plan === "weekly") return "weekly";
  if (plan === "cv_package") return "cv_package";
  return "full";
}
