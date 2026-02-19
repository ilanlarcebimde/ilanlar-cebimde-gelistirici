import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// VAPID keys (env'den alınacak)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@ilanlarcebimde.com';

// Web push config
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Supabase service role client (RLS bypass)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: NextRequest) {
  try {
    // Secret header kontrolü (n8n'den gelecek)
    const secret = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { channelSlug, date, countNew, topTitle } = body;

    if (!channelSlug) {
      return NextResponse.json(
        { error: 'Missing required field: channelSlug' },
        { status: 400 }
      );
    }

    // Channel'ı bul
    const { data: channel, error: channelError } = await supabaseAdmin
      .from('channels')
      .select('id, name, slug')
      .eq('slug', channelSlug)
      .single();

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Bu kanal için enabled push_prefs olan subscription'ları bul
    const { data: prefs, error: prefsError } = await supabaseAdmin
      .from('push_prefs')
      .select(
        `
        enabled,
        push_subscriptions!inner (
          id,
          endpoint,
          p256dh,
          auth,
          is_active
        )
      `
      )
      .eq('channel_id', channel.id)
      .eq('enabled', true)
      .eq('push_subscriptions.is_active', true);

    if (prefsError) {
      console.error('Push prefs query error:', prefsError);
      return NextResponse.json({ error: 'Failed to fetch push preferences' }, { status: 500 });
    }

    if (!prefs || prefs.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No active subscriptions' });
    }

    // Push bildirimleri gönder
    const payload = JSON.stringify({
      title: `${channel.name}: Bugünkü ilanlar yayında`,
      body: countNew
        ? `${countNew} yeni ilan eklendi${topTitle ? `. En yenisi: ${topTitle}` : ''}`
        : 'Yeni iş ilanları yayında',
      url: `/aboneliklerim?kanal=${channel.slug}${date ? `&day=${date}` : ''}`,
      channelSlug: channel.slug,
    });

    const results = await Promise.allSettled(
      prefs.map(async (pref: any) => {
        const sub = pref.push_subscriptions;
        if (!sub) return { status: 'skipped', reason: 'No subscription' };

        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, payload);
          return { status: 'sent', subscriptionId: sub.id };
        } catch (error: any) {
          // 410/404: endpoint expired → deactivate
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabaseAdmin
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', sub.id);

            // Log
            await supabaseAdmin.from('push_delivery_log').insert({
              subscription_id: sub.id,
              channel_id: channel.id,
              status: 'expired',
              error: `HTTP ${error.statusCode}`,
            });

            return { status: 'expired', subscriptionId: sub.id };
          }

          // Diğer hatalar
          await supabaseAdmin.from('push_delivery_log').insert({
            subscription_id: sub.id,
            channel_id: channel.id,
            status: 'failed',
            error: error.message || 'Unknown error',
          });

          return { status: 'failed', subscriptionId: sub.id, error: error.message };
        }
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'sent').length;
    const expired = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'expired'
    ).length;
    const failed = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'failed'
    ).length;

    return NextResponse.json({
      success: true,
      sent,
      expired,
      failed,
      total: prefs.length,
    });
  } catch (error) {
    console.error('Push notify-daily error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
