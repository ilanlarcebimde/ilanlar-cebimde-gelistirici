/** URL’deki `auth_error` (OAuth iptal vb.) için kısa Türkçe metin. */
export function authErrorParamToMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "access_denied" || code === "google_iptal") {
    return "Google ile giriş iptal edildi veya izin verilmedi. İsterseniz tekrar deneyebilirsiniz.";
  }
  if (code === "oauth_failed") {
    return "Giriş tamamlanamadı. Lütfen tekrar deneyin veya e-posta ile giriş yapın.";
  }
  return "Giriş tamamlanamadı. Lütfen tekrar deneyin veya e-posta ile giriş yapın.";
}

/** Supabase auth hata mesajını kısa Türkçe uyarıya çevirir. */
export function toTurkishAuthError(message: string): string {
  const m = message?.toLowerCase() ?? "";
  if (m.includes("invalid login") || m.includes("invalid_credentials")) return "E-posta veya şifre hatalı.";
  if (m.includes("email not confirmed")) return "E-posta adresinizi doğrulayın.";
  if (m.includes("user already registered") || m.includes("already registered")) return "Bu e-posta adresi zaten kayıtlı.";
  if (m.includes("password") && m.includes("weak")) return "Şifre yeterince güçlü değil (en az 6 karakter).";
  if (m.includes("signup") && m.includes("disabled")) return "Kayıt şu an kapalı.";
  if (m.includes("reset") || m.includes("recovery")) return "Şifre sıfırlama bağlantısı gönderilemedi. E-postayı kontrol edin.";
  return message?.slice(0, 120) || "Bir hata oluştu.";
}
