/**
 * Başvuru merkezi / premium modallarından haftalık premium için PayTR ödeme sayfasına geçiş.
 * `paytr_pending` şeması `/odeme` ile uyumlu olmalıdır.
 */
export type WeeklyPaytrPending = {
  email: string;
  user_name?: string;
  plan: "weekly";
  user_id?: string;
};

export function startWeeklyPremiumCheckout(params: {
  email: string;
  userId?: string | null;
  userName?: string | null;
  /** Ödeme sonrası tam sayfa yönlendirme (path, / ile başlamalı) */
  returnHref?: string | null;
  /** Varsa ödeme sonrası job guide wizard */
  pendingJobId?: string | null;
}): void {
  if (typeof window === "undefined") return;
  const email = params.email.trim();
  if (!email) return;
  const user_name = params.userName?.trim() || email.split("@")[0] || "Müşteri";
  const payload: WeeklyPaytrPending = {
    email,
    user_name,
    plan: "weekly",
    ...(params.userId && { user_id: params.userId }),
  };
  sessionStorage.setItem("paytr_pending", JSON.stringify(payload));
  if (params.pendingJobId) {
    sessionStorage.setItem("premium_pending_job_id", params.pendingJobId);
  } else {
    sessionStorage.removeItem("premium_pending_job_id");
  }
  if (params.returnHref && params.returnHref.startsWith("/")) {
    sessionStorage.setItem("premium_after_payment_redirect", params.returnHref);
  } else {
    sessionStorage.removeItem("premium_after_payment_redirect");
  }
  window.location.href = "/odeme";
}
