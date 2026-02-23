"use client";

import { useEffect, useRef } from "react";
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
  const { active: subscriptionActive, loading: subscriptionLoading, refetch: refetchSubscription } = useSubscriptionActive(user?.id);
  const retryCancelledRef = useRef(false);

  // Debug: hangi gate (auth / subscription) takılı görünüyor
  useEffect(() => {
    console.log("[PremiumLayout]", {
      userId: user?.id ?? null,
      authLoading,
      subscriptionLoading,
      subscriptionActive,
    });
  }, [user?.id, authLoading, subscriptionLoading, subscriptionActive]);

  // Redirect SADECE loading bittikten sonra. subscriptionActive=false ise 3 kez refetch dene, hâlâ false ise redirect (DB gecikmesi/yarışı önler).
  useEffect(() => {
    if (authLoading || subscriptionLoading) return;

    if (!user) {
      console.log("[PremiumLayout] redirect: no_auth");
      try {
        sessionStorage.setItem("premium_redirect_reason", "no_auth");
      } catch {
        // ignore
      }
      router.replace("/giris?next=" + encodeURIComponent(pathname || "/premium/job-guides"));
      return;
    }

    if (!subscriptionActive) {
      retryCancelledRef.current = false;
      (async () => {
        const delays = [0, 600, 1200];
        for (const waitMs of delays) {
          await new Promise((r) => setTimeout(r, waitMs));
          if (retryCancelledRef.current) return;
          const ok = await refetchSubscription();
          if (retryCancelledRef.current) return;
          if (ok) {
            console.log("[PremiumLayout] retry: subscription active, no redirect");
            return;
          }
        }
        if (retryCancelledRef.current) return;
        console.log("[PremiumLayout] redirect: no_subscription (after 3 retries)");
        try {
          sessionStorage.setItem("premium_redirect_reason", "no_subscription");
        } catch {
          // ignore
        }
        router.replace("/ucretsiz-yurtdisi-is-ilanlari");
      })();
      return () => {
        retryCancelledRef.current = true;
      };
    }
  }, [user, authLoading, subscriptionActive, pathname, router, refetchSubscription]);

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
