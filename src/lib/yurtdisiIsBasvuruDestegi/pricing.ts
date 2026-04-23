import {
  EU_COUNTRY_OPTIONS,
  LISTING_PACKAGES,
  type ListingPackageId,
  YURTDISI_BASVURU_BASE_TRY,
  YURTDISI_BASVURU_EXTRA_COUNTRY_TRY,
  isAllowedCountryKey,
  isValidProfessionId,
} from "./constants";

export type BasvuruPricingInput = {
  profession_id: string;
  country_keys: string[];
  listing_package_id: ListingPackageId;
};

function roundTry(n: number): number {
  return Math.round(n * 100) / 100;
}

export type PriceLine = { code: string; label: string; amountTry: number };

export type ComputedBasvuruPrice = {
  baseTry: number;
  extraCountriesCount: number;
  extraCountryChargeTry: number;
  listingPackage: (typeof LISTING_PACKAGES)[number];
  lineItems: PriceLine[];
  totalTry: number;
};

/** Fiyatı etkileyen alanlar — sunucu bu yapıyı tekrar hesaplayıp `amount` ile eşleştirir. */
export function computeBasvuruDestegiPrice(input: BasvuruPricingInput): ComputedBasvuruPrice {
  const baseTry = YURTDISI_BASVURU_BASE_TRY;
  const countries = [...new Set(input.country_keys)].filter((k) => isAllowedCountryKey(k));
  const n = countries.length;
  const extra = Math.max(0, n - 1);
  const extraCountryChargeTry = roundTry(extra * YURTDISI_BASVURU_EXTRA_COUNTRY_TRY);

  const pkg = LISTING_PACKAGES.find((p) => p.id === input.listing_package_id);
  if (!pkg) {
    throw new Error("invalid_listing_package");
  }

  const lineItems: PriceLine[] = [
    { code: "base", label: "Başvuru ve süreç yönetimi (taban)", amountTry: baseTry },
  ];
  if (extra > 0) {
    lineItems.push({
      code: "extra_countries",
      label: `Ek hedef ülke (${extra} × ${YURTDISI_BASVURU_EXTRA_COUNTRY_TRY} TL)`,
      amountTry: extraCountryChargeTry,
    });
  }
  lineItems.push({
    code: "listing_package",
    label: `İş ilanı paketi: ${pkg.label}`,
    amountTry: pkg.addTry,
  });

  const totalTry = roundTry(lineItems.reduce((s, l) => s + l.amountTry, 0));

  return {
    baseTry,
    extraCountriesCount: extra,
    extraCountryChargeTry,
    listingPackage: pkg,
    lineItems,
    totalTry,
  };
}

export function parseBasvuruPricingInput(raw: unknown): { ok: true; data: BasvuruPricingInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Eksik fiyat verisi." };
  }
  const o = raw as Record<string, unknown>;
  const profession_id = typeof o.profession_id === "string" ? o.profession_id.trim() : "";
  if (!isValidProfessionId(profession_id)) {
    return { ok: false, error: "Geçersiz veya eksik meslek seçimi." };
  }

  const country_keys_raw = o.country_keys;
  if (!Array.isArray(country_keys_raw) || country_keys_raw.length === 0) {
    return { ok: false, error: "En az bir hedef ülke seçin." };
  }
  const country_keys: string[] = [];
  for (const c of country_keys_raw) {
    if (typeof c !== "string" || !c.trim()) {
      return { ok: false, error: "Geçersiz ülke değeri." };
    }
    const k = c.trim().toLowerCase();
    if (!isAllowedCountryKey(k)) {
      return { ok: false, error: "İzin verilmeyen veya desteklenmeyen ülke." };
    }
    if (!country_keys.includes(k)) country_keys.push(k);
  }

  const lp = Number(o.listing_package_id);
  const allowed = new Set(LISTING_PACKAGES.map((p) => p.id));
  if (!allowed.has(lp as ListingPackageId)) {
    return { ok: false, error: "Geçersiz ilan paketi." };
  }

  return {
    ok: true,
    data: {
      profession_id,
      country_keys,
      listing_package_id: lp as ListingPackageId,
    },
  };
}

/** Sunucu: hesaplanan net tutar, istemci `amount` / fatura `net` ile aynı olmalı */
export function assertAmountMatchesBasvuruPricing(
  pricingInput: unknown,
  amountTry: number
): { ok: true; computed: ComputedBasvuruPrice; input: BasvuruPricingInput } | { ok: false; error: string } {
  const parsed = parseBasvuruPricingInput(pricingInput);
  if (!parsed.ok) return parsed;
  let computed: ComputedBasvuruPrice;
  try {
    computed = computeBasvuruDestegiPrice(parsed.data);
  } catch {
    return { ok: false, error: "Fiyat hesaplanamadı." };
  }
  if (Math.abs(computed.totalTry - amountTry) > 0.009) {
    return { ok: false, error: "Tutar güvenlik doğrulamasından geçmedi. Sayfayı yenileyip tekrar deneyin." };
  }
  return { ok: true, computed, input: parsed.data };
}

export { EU_COUNTRY_OPTIONS };
