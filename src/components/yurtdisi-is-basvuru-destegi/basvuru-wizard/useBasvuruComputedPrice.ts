import { useMemo } from "react";
import type { BasvuruWizardFormState } from "@/lib/yurtdisiIsBasvuruDestegi/wizardTypes";
import { computeBasvuruDestegiPrice } from "@/lib/yurtdisiIsBasvuruDestegi/pricing";
import type { BasvuruPricingInput } from "@/lib/yurtdisiIsBasvuruDestegi/pricing";
import { isValidProfessionId, LISTING_PACKAGES } from "@/lib/yurtdisiIsBasvuruDestegi/constants";

export function useBasvuruComputedPrice(form: BasvuruWizardFormState) {
  return useMemo(() => {
    const pkgOk = LISTING_PACKAGES.some((p) => p.id === form.listingPackageId);
    if (!isValidProfessionId(form.professionId) || !form.countryKeys.length || !pkgOk) {
      return { ok: false as const, pricingInput: null as BasvuruPricingInput | null, price: null };
    }
    const pricingInput: BasvuruPricingInput = {
      profession_id: form.professionId!,
      country_keys: form.countryKeys,
      listing_package_id: form.listingPackageId!,
    };
    return {
      ok: true as const,
      pricingInput,
      price: computeBasvuruDestegiPrice(pricingInput),
    };
  }, [form.professionId, form.countryKeys.join(","), form.listingPackageId]);
}
