/** Yönetici test kuponu — yalnızca sunucuda `ADMINSUPER2026_ALLOWED_EMAILS` ile tanımlı hesaplar kullanabilir. */
export const ADMINSUPER2026_CODE = "ADMINSUPER2026";

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
  const allowed = parseAdminsuper2026AllowedEmails();
  if (allowed.size === 0) return false;
  const e = (email ?? "").trim().toLowerCase();
  return e.length > 0 && allowed.has(e);
}
