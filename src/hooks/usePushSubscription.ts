"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  getExistingSubscription,
  type PushSubscriptionData,
} from '@/lib/push';
import { supabase } from '@/lib/supabase';

export function usePushSubscription() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let supported = false;
    try {
      supported = !!(window && 'Notification' in window && navigator && 'serviceWorker' in navigator);
      if (supported) {
        const NotificationApi = (window as unknown as { Notification?: { permission: string } }).Notification;
        if (NotificationApi && typeof NotificationApi.permission === 'string') {
          setPermission(NotificationApi.permission as 'default' | 'granted' | 'denied');
        }
      }
    } catch (_) {
      setPermission('denied');
    }
    setIsSupported(supported);
    checkSubscription();
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!user || !isSupported) {
      setIsLoading(false);
      return;
    }

    try {
      const existing = await getExistingSubscription();
      if (!existing) {
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      // Supabase'de kayıtlı mı kontrol et
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('push_subscriptions')
        .select('id, is_active')
        .eq('endpoint', existing.endpoint)
        .eq('user_id', user.id)
        .single();

      setIsSubscribed(data?.is_active ?? false);
    } catch (err) {
      console.error('Check subscription error:', err);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  const subscribe = useCallback(async () => {
    if (!user) {
      setError('Giriş yapmanız gerekiyor');
      return false;
    }

    if (!isSupported) {
      setError('Bu tarayıcı bildirimleri desteklemiyor');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. İzin iste
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('Bildirim izni verilmedi');
        setIsLoading(false);
        return false;
      }

      // 2. Service Worker kaydet
      const registration = await registerServiceWorker();

      // 3. Push subscription oluştur
      const subscriptionData = await subscribeToPush(registration);

      // 4. Supabase'e kaydet
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Oturum bulunamadı');
        setIsLoading(false);
        return false;
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          endpoint: subscriptionData.endpoint,
          keys: subscriptionData.keys,
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Abonelik kaydedilemedi');
      }

      setIsSubscribed(true);
      await checkSubscription();
      return true;
    } catch (err: any) {
      console.error('Subscribe error:', err);
      setError(err.message || 'Bildirim aboneliği başarısız');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, checkSubscription]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      const existing = await getExistingSubscription();
      if (!existing) {
        setIsSubscribed(false);
        setIsLoading(false);
        return true;
      }

      // Service Worker'dan unsubscribe
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Supabase'de pasifleştir
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return false;
      }

      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('endpoint', existing.endpoint)
        .eq('user_id', user.id);

      setIsSubscribed(false);
      try {
        const NotificationApi = typeof window !== 'undefined' && (window as unknown as { Notification?: { permission: string } }).Notification;
        if (NotificationApi && typeof NotificationApi.permission === 'string') {
          setPermission(NotificationApi.permission as 'default' | 'granted' | 'denied');
        }
      } catch (_) {}
      return true;
    } catch (err: any) {
      console.error('Unsubscribe error:', err);
      setError(err.message || 'Abonelik iptali başarısız');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}
