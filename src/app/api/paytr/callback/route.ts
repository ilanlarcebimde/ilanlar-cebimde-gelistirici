import { NextRequest, NextResponse } from "next/server";
import { makeCallbackHash } from "@/lib/paytr";

/** PayTR bildirim endpoint'i. Her durumda 200 + "OK" dönülmeli; redirect olmamalı. */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const merchant_oid = (formData.get("merchant_oid") as string) || "";
    const status = (formData.get("status") as string) || "";
    const total_amount = (formData.get("total_amount") as string) || "";
    const hash = (formData.get("hash") as string) || "";

    const expectedHash = makeCallbackHash(merchant_oid, status, total_amount);
    const hashOk = hash === expectedHash;

    if (hashOk && status === "success") {
      // Ödeme başarılı: siparişi güncelle (profiles.status = 'paid', events vb.)
      // TODO: profile_id veya merchant_oid ile eşleştirip DB güncellemesi

      // n8n webhook tetikleyicisi (fire-and-forget; hata PayTR yanıtını etkilemez)
      const webhookUrl = process.env.N8N_CV_WEBHOOK_URL;
      const authKey = process.env.N8N_AUTH_KEY;
      if (webhookUrl) {
        try {
          const payload: Record<string, string> = {
            orderId: merchant_oid,
            paymentStatus: "success",
            action: "generate_cv",
          };
          await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authKey ? { "x-api-key": authKey } : {}),
            },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.error("[PayTR callback] n8n webhook error:", err);
        }
      }
    }
    // Hash eşleşmese veya status === "failed" olsa bile PayTR'ye 200 OK veriyoruz
  } catch {
    // Hata olsa bile PayTR'ye 200 + OK
  }

  return new NextResponse("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
