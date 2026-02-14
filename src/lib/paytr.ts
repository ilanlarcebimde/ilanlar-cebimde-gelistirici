import crypto from "crypto";

const PAYTR_GET_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

function getMerchantKey(): string {
  const key = process.env.PAYTR_MERCHANT_KEY;
  if (!key) throw new Error("PAYTR_MERCHANT_KEY is not set");
  return key;
}

function getMerchantSalt(): string {
  const salt = process.env.PAYTR_MERCHANT_SALT;
  if (!salt) throw new Error("PAYTR_MERCHANT_SALT is not set");
  return salt;
}

function getMerchantId(): string {
  const id = process.env.PAYTR_MERCHANT_ID;
  if (!id) throw new Error("PAYTR_MERCHANT_ID is not set");
  return id;
}

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  return url.replace(/\/$/, "");
}

/** Sadece harf ve rakam; PayTR kuralı */
export function sanitizeMerchantOid(oid: string): string {
  return oid.replace(/[^a-zA-Z0-9]/g, "");
}

/** Initiate hash: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket_base64 + no_installment + max_installment + currency + test_mode + merchant_salt */
export function makePaytrToken(params: {
  merchant_id: string;
  user_ip: string;
  merchant_oid: string;
  email: string;
  payment_amount: string;
  user_basket_base64: string;
  no_installment: string;
  max_installment: string;
  currency: string;
  test_mode: string;
  merchant_salt: string;
}): string {
  const str =
    params.merchant_id +
    params.user_ip +
    params.merchant_oid +
    params.email +
    params.payment_amount +
    params.user_basket_base64 +
    params.no_installment +
    params.max_installment +
    params.currency +
    params.test_mode +
    params.merchant_salt;
  return crypto.createHmac("sha256", getMerchantKey()).update(str).digest("base64");
}

/** Callback hash: merchant_oid + merchant_salt + status + total_amount */
export function makeCallbackHash(merchant_oid: string, status: string, total_amount: string): string {
  const salt = getMerchantSalt();
  const str = merchant_oid + salt + status + total_amount;
  return crypto.createHmac("sha256", getMerchantKey()).update(str).digest("base64");
}

export function isTestMode(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.PAYTR_TEST_MODE === "1";
}

export interface InitiateParams {
  merchant_oid: string;
  email: string;
  amount: number;
  user_name?: string;
  user_address?: string;
  user_phone?: string;
  merchant_ok_url?: string;
  merchant_fail_url?: string;
  basket_description?: string;
}

export async function getPaytrToken(params: InitiateParams, userIp: string): Promise<{ token: string }> {
  const merchant_id = getMerchantId();
  const merchant_salt = getMerchantSalt();
  const merchant_oid = sanitizeMerchantOid(params.merchant_oid);
  const payment_amount = String(Math.round(params.amount * 100));
  const basketDescription = params.basket_description || "Ödeme";
  const user_basket = [[basketDescription, params.amount.toFixed(2), 1]] as [string, string, number][];
  const user_basket_base64 = Buffer.from(JSON.stringify(user_basket)).toString("base64");
  const no_installment = "0";
  const max_installment = "0";
  const currency = "TL";
  const test_mode = isTestMode() ? "1" : "0";

  const paytr_token = makePaytrToken({
    merchant_id,
    user_ip: userIp,
    merchant_oid,
    email: params.email,
    payment_amount,
    user_basket_base64,
    no_installment,
    max_installment,
    currency,
    test_mode,
    merchant_salt,
  });

  const siteUrl = getSiteUrl();
  const merchant_ok_url = params.merchant_ok_url || `${siteUrl}/odeme/basarili`;
  const merchant_fail_url = params.merchant_fail_url || `${siteUrl}/odeme/basarisiz`;

  const user_name = (params.user_name && String(params.user_name).trim()) || "Müşteri";
  const user_address = (params.user_address && String(params.user_address).trim()) || "Adres girilmedi";
  const user_phone = (params.user_phone && String(params.user_phone).trim()) || "5550000000";

  const body = new URLSearchParams();
  body.set("merchant_id", merchant_id);
  body.set("user_ip", userIp);
  body.set("merchant_oid", merchant_oid);
  body.set("email", params.email.trim());
  body.set("payment_amount", payment_amount);
  body.set("paytr_token", paytr_token);
  body.set("user_basket", user_basket_base64);
  body.set("no_installment", no_installment);
  body.set("max_installment", max_installment);
  body.set("currency", currency);
  body.set("test_mode", test_mode);
  body.set("merchant_ok_url", merchant_ok_url);
  body.set("merchant_fail_url", merchant_fail_url);
  body.set("user_name", user_name.slice(0, 60));
  body.set("user_address", user_address.slice(0, 400));
  body.set("user_phone", user_phone.slice(0, 20));
  body.set("debug_on", "1");
  body.set("timeout_limit", "30");
  body.set("lang", "tr");
  body.set("iframe_v2", "1");

  const res = await fetch(PAYTR_GET_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as { status?: string; token?: string; reason?: string };
  if (data.status === "success" && data.token) {
    return { token: data.token };
  }
  throw new Error(data.reason || "PayTR token alınamadı");
}
