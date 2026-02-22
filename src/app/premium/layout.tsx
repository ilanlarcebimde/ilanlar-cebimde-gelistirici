"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";

const REDIRECT_DELAY_MS = 1200;

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { active: subscriptionActive, loading: subscriptionLoading, refetch } = useSubscriptionActive(user?.id);
  const [retried, setRetried] = useState(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/giris?next=" + encodeURIComponent("/premium/job-guides"));
      return;
    }
    if (subscriptionLoading) return;
    if (subscriptionActive) return;

    // Abonelik yok: önce bir kez refetch (ödeme dönüşü / gecikme), sonra yönlendir
    if (!retried) {
      setRetried(true);
      redirectTimeoutRef.current = setTimeout(() => {
        redirectTimeoutRef.current = null;
        refetch().then((active) => {
          if (!active) {
            router.replace("/ucretsiz-yurtdisi-is-ilanlari");
          }
        });
      }, REDIRECT_DELAY_MS);
    } else {
      router.replace("/ucretsiz-yurtdisi-is-ilanlari");
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [user, authLoading, subscriptionActive, subscriptionLoading, retried, refetch, router]);

  if (authLoading || !user || subscriptionLoading || !subscriptionActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <p className="text-slate-600">Yükleniyor…</p>
          {!authLoading && !user && (
            <Link href="/giris" className="mt-4 inline-block text-brand-600 hover:underline">
              Giriş yap
            </Link>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
