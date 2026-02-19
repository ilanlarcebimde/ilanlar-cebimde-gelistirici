"use client";

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type ChannelPushToggleProps = {
  channelSlug: string;
  channelId?: string;
  className?: string;
};

export function ChannelPushToggle({ channelSlug, channelId, className }: ChannelPushToggleProps) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsEnabled(null);
      setIsLoading(false);
      return;
    }
    loadPref();
  }, [user, channelSlug, channelId]);

  const loadPref = async () => {
    if (!user) return;

    try {
      // Önce channel_id'yi bul (eğer verilmemişse)
      let chId = channelId;
      if (!chId) {
        const { data: channel } = await supabase
          .from('channels')
          .select('id')
          .eq('slug', channelSlug)
          .single();
        if (!channel) {
          setIsEnabled(null);
          setIsLoading(false);
          return;
        }
        chId = channel.id;
      }

      // Aktif push subscription var mı?
      const { data: subscription } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!subscription) {
        setIsEnabled(null);
        setIsLoading(false);
        return;
      }

      // Push pref'i kontrol et
      const { data: pref } = await supabase
        .from('push_prefs')
        .select('enabled')
        .eq('subscription_id', subscription.id)
        .eq('channel_id', chId)
        .single();

      setIsEnabled(pref?.enabled ?? false);
    } catch (err) {
      console.error('Load push pref error:', err);
      setIsEnabled(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setIsEnabled = (value: boolean | null) => {
    setEnabled(value);
  };

  const handleToggle = async () => {
    if (!user || enabled === null || isToggling) return;

    setIsToggling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsToggling(false);
        return;
      }

      const res = await fetch('/api/push/prefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          channelSlug,
          enabled: !enabled,
        }),
      });

      if (res.ok) {
        setIsEnabled(!enabled);
      }
    } catch (err) {
      console.error('Toggle push pref error:', err);
    } finally {
      setIsToggling(false);
    }
  };

  if (!user || enabled === null) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading || isToggling}
      className={`p-1.5 rounded-lg transition-colors ${
        enabled
          ? 'text-brand-600 hover:bg-brand-50'
          : 'text-slate-400 hover:bg-slate-100'
      } disabled:opacity-50 ${className || ''}`}
      title={enabled ? 'Bildirimleri kapat' : 'Bildirimleri aç'}
    >
      {enabled ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
    </button>
  );
}
