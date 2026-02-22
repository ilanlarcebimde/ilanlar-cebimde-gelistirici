"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { active: subscriptionActive, loading: subscriptionLoading } = useSubscriptionActive(user?.id);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/giris?next=" + encodeURIComponent("/premium/job-guides"));
      return;
    }
    if (!subscriptionLoading && !subscriptionActive) {
      router.replace("/ucretsiz-yurtdisi-is-ilanlari");
      return;
    }
  }, [user, authLoading, subscriptionActive, subscriptionLoading, router]);

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
