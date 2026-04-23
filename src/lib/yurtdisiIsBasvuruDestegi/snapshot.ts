import { YURTDISI_BASVURU_WIZARD_VERSION } from "./paytr";
import type { BasvuruPricingInput, ComputedBasvuruPrice } from "./pricing";
import { computeBasvuruDestegiPrice } from "./pricing";
import type { BasvuruWizardFormState } from "./wizardTypes";
import { professionLabelById } from "./constants";

export type BasvuruDestegiStoredSnapshot = {
  v: typeof YURTDISI_BASVURU_WIZARD_VERSION;
  pricing: BasvuruPricingInput;
  priceBreakdown: ComputedBasvuruPrice;
  form: BasvuruWizardFormState;
  /** Özet gösterim */
  profession_label: string;
  created_at_client: string;
};

export function buildBasvuruDestegiSnapshot(
  form: BasvuruWizardFormState,
  pricingInput: BasvuruPricingInput
): BasvuruDestegiStoredSnapshot {
  const priceBreakdown = computeBasvuruDestegiPrice(pricingInput);
  return {
    v: YURTDISI_BASVURU_WIZARD_VERSION,
    pricing: pricingInput,
    priceBreakdown,
    form: JSON.parse(JSON.stringify(form)) as BasvuruWizardFormState,
    profession_label: professionLabelById(pricingInput.profession_id),
    created_at_client: new Date().toISOString(),
  };
}

/** initiate profile_snapshot: payments.profile_snapshot jsonb */
export function basvuruProfileSnapshotForDb(
  data: BasvuruDestegiStoredSnapshot
): Record<string, unknown> {
  const s = JSON.stringify({ basvuru_destegi: data });
  if (s.length > 1_200_000) {
    return {
      basvuru_destegi: {
        v: data.v,
        error: "payload_too_large",
        profession_label: data.profession_label,
        pricing: data.pricing,
      },
    } as Record<string, unknown>;
  }
  return { basvuru_destegi: data } as Record<string, unknown>;
}
