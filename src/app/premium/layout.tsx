"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";

function LoadingUI({ showLoginLink = false }: { showLoginLink?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <p className="text-slate-600">Kontrol ediliyor…</p>
        {showLoginLink && (
          <Link href="/giris" className="mt-4 inline-block text-brand-600 hover:underline">
            Giriş yap
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { active: subscriptionActive, loading: subscriptionLoading } = useSubscriptionActive(user?.id);

  // Debug: hangi gate (auth / subscription) takılı görünüyor
  useEffect(() => {
    console.log("PREMIUM GUARD", {
      userId: user?.id ?? null,
      subscriptionLoading,
      subscriptionActive,
      authLoading,
    });
  }, [user?.id, subscriptionLoading, subscriptionActive, authLoading]);

  // Redirect SADECE loading bittikten sonra; render içinde redirect yok
  useEffect(() => {
    if (authLoading || subscriptionLoading) return;

    if (!user) {
      try {
        sessionStorage.setItem("premium_redirect_reason", "no_auth");
      } catch {
        // ignore
      }
      router.replace("/giris?next=" + encodeURIComponent(pathname || "/premium/job-guides"));
      return;
    }
    if (!subscriptionActive) {
      try {
        sessionStorage.setItem("premium_redirect_reason", "no_subscription");
      } catch {
        // ignore
      }
      router.replace("/ucretsiz-yurtdisi-is-ilanlari");
    }
  }, [user, authLoading, subscriptionActive, subscriptionLoading, pathname, router]);

  // Loading iken redirect yapma; sadece Loading UI göster
  if (authLoading || subscriptionLoading) {
    return <LoadingUI />;
  }
  if (!user) {
    return <LoadingUI showLoginLink />;
  }
  if (!subscriptionActive) {
    return <LoadingUI />;
  }

  return <>{children}</>;
}
