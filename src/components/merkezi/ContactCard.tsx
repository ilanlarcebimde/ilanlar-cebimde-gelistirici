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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-900">İletişim</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {contact.contact_email && (
          <li>
            <a
              href={`mailto:${contact.contact_email}`}
              className="text-sky-600 hover:underline"
            >
              {contact.contact_email}
            </a>
          </li>
        )}
        {contact.contact_phone && (
          <li>
            <a
              href={`tel:${contact.contact_phone.replace(/\s/g, "")}`}
              className="text-sky-600 hover:underline"
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
              className="inline-flex items-center gap-1 text-sky-600 hover:underline"
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

