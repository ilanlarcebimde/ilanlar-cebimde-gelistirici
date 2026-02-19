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
    const { channelSlug, enabled } = body;

    if (!channelSlug || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: channelSlug, enabled' },
        { status: 400 }
      );
    }

    // Channel'ı bul
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('slug', channelSlug)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Kullanıcının aktif push subscription'ını bul
    const { data: subscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active push subscription found' },
        { status: 404 }
      );
    }

    // Push pref'i güncelle veya oluştur
    const { error } = await supabase
      .from('push_prefs')
      .upsert(
        {
          subscription_id: subscription.id,
          channel_id: channel.id,
          enabled,
        },
        {
          onConflict: 'subscription_id,channel_id',
        }
      );

    if (error) {
      console.error('Push prefs upsert error:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push prefs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
