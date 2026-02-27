import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie tabanlı Supabase server client.
 * - Route Handlers / Server Components içinde kullanılır.
 * - Client'tan Bearer token taşımayı gerektirmez.
 */
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anonKey) throw new Error("SUPABASE_ENV_MISSING");

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}

