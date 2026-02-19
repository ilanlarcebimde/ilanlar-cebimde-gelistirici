"use client";

import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useAuth } from '@/hooks/useAuth';

export function PushNotificationButton() {
  const { user } = useAuth();
  const { isSupported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe } =
    usePushSubscription();
  const [showError, setShowError] = useState(false);

  if (!user) return null;

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
        title="Bu tarayıcı bildirimleri desteklemiyor"
      >
        <BellOff className="h-4 w-4" />
        <span>Desteklenmiyor</span>
      </button>
    );
  }

  if (permission === 'denied') {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
        title="Bildirim izni tarayıcı ayarlarından verilmeli"
      >
        <BellOff className="h-4 w-4" />
        <span>İzin Reddedildi</span>
      </button>
    );
  }

  const handleClick = async () => {
    setShowError(false);
    if (isSubscribed) {
      const success = await unsubscribe();
      if (!success && error) {
        setShowError(true);
      }
    } else {
      const success = await subscribe();
      if (!success && error) {
        setShowError(true);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          isSubscribed
            ? 'bg-brand-600 text-white hover:bg-brand-700'
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        } disabled:opacity-50`}
      >
        {isSubscribed ? (
          <>
            <Bell className="h-4 w-4" />
            <span>Bildirimler Açık</span>
          </>
        ) : (
          <>
            <BellOff className="h-4 w-4" />
            <span>Bildirimleri Aç</span>
          </>
        )}
      </button>
      {showError && error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
