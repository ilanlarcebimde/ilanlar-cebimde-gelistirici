/**
 * Ülke bazlı resmî kaynak seçimi (vize / maaş).
 * country_sources tablosundan okur; whitelist + fetch fetchWithCache ile yapılır.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CountrySourceRow = {
  title: string;
  url: string;
  domain: string;
  priority: number;
};

export async function getCountrySources(
  country: string,
  purpose: "visa" | "salary",
  limit = 3
): Promise<CountrySourceRow[]> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("country_sources")
    .select("title, url, domain, priority")
    .eq("country", country)
    .eq("purpose", purpose)
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .limit(limit);

  return (data ?? []) as CountrySourceRow[];
}
