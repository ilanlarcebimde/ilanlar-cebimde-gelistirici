import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForUser } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseForUser(token);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys, userAgent } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Missing required fields: endpoint, keys.p256dh, keys.auth' },
        { status: 400 }
      );
    }

    // Upsert push subscription (endpoint unique)
    const { data: subscription, error: subError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: userAgent || null,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: 'endpoint',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (subError) {
      console.error('Push subscription upsert error:', subError);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    // Kullanıcının abone olduğu kanallar için push_prefs otomatik oluştur
    const { data: userSubscriptions } = await supabase
      .from('channel_subscriptions')
      .select('channel_id')
      .eq('user_id', user.id);

    if (userSubscriptions && userSubscriptions.length > 0 && subscription) {
      const prefs = userSubscriptions.map((sub) => ({
        subscription_id: subscription.id,
        channel_id: sub.channel_id,
        enabled: true,
      }));

      await supabase.from('push_prefs').upsert(prefs, {
        onConflict: 'subscription_id,channel_id',
        ignoreDuplicates: false,
      });
    }

    return NextResponse.json({ success: true, subscriptionId: subscription?.id });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
