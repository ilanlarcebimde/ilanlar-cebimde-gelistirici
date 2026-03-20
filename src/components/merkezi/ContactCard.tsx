"use client";

import type { MerkeziPostContact } from "@/lib/merkezi/types";

interface ContactCardProps {
  contact: MerkeziPostContact | null;
  locked: boolean;
  onUnlock?: () => void;
  isPaid: boolean;
}

export function ContactCard({ contact, locked, onUnlock, isPaid }: ContactCardProps) {
  if (isPaid && locked) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
        <p className="font-medium text-amber-900">Firma iletişim bilgisi</p>
        <p className="mt-1 text-sm text-amber-800">
          Premium üyeler için açıktır. Hemen başvurmak için Premium ile kilidi açın.
        </p>
        {onUnlock && (
          <button
            type="button"
            onClick={onUnlock}
            className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Premium ile Hemen Başvur
          </button>
        )}
      </div>
    );
  }

  const hasSafeApplyUrl =
    contact?.apply_url &&
    (contact.apply_url.startsWith("http://") || contact.apply_url.startsWith("https://"));
  const hasAnyContact =
    contact &&
    (contact.contact_email || contact.contact_phone || hasSafeApplyUrl);
  if (!hasAnyContact) return null;

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${isPaid ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={`font-semibold ${isPaid ? "text-emerald-900" : "text-slate-900"}`}>İletişim</h3>
        {isPaid && (
          <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-medium text-white">
            Aktif
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-2 text-sm">
        {contact.contact_email && (
          <li>
            <a
              href={`mailto:${contact.contact_email}`}
              className={isPaid ? "text-emerald-700 hover:underline" : "text-sky-600 hover:underline"}
            >
              {contact.contact_email}
            </a>
          </li>
        )}
        {contact.contact_phone && (
          <li>
            <a
              href={`tel:${contact.contact_phone.replace(/\s/g, "")}`}
              className={isPaid ? "text-emerald-700 hover:underline" : "text-sky-600 hover:underline"}
            >
              {contact.contact_phone}
            </a>
          </li>
        )}
        {hasSafeApplyUrl && contact.apply_url && (
          <li>
            <a
              href={contact.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className={isPaid ? "inline-flex items-center gap-1 text-emerald-700 hover:underline" : "inline-flex items-center gap-1 text-sky-600 hover:underline"}
            >
              Başvuru linki
              <span aria-hidden>↗</span>
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

