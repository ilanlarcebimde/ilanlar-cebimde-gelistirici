"use client";

import { useState, useCallback } from "react";
import { COVER_LETTER_RESULT_UI } from "./coverLetterWizardContent";

/** Step 6 API response shape (cover_letter type). */
export type CoverLetterResultData = {
  turkish_version: string;
  english_version: string;
  ui_notes?: {
    tr_notice?: string;
    en_notice?: string;
  };
};

const DEFAULT_TR_NOTICE = COVER_LETTER_RESULT_UI.noticeTr;
const DEFAULT_EN_NOTICE = COVER_LETTER_RESULT_UI.noticeEn;

type TabId = "tr" | "en";

export interface CoverLetterResultScreenProps {
  data: CoverLetterResultData;
  /** İlanda varsa mailto linki gösterilir (sadece EN sekmesinde). */
  jobEmail?: string | null;
  onClose?: () => void;
  /** Modal içinde kullanılıyorsa true; sticky bar ve max-height davranışı için. */
  inModal?: boolean;
}

export function CoverLetterResultScreen({
  data,
  jobEmail,
  onClose,
  inModal = true,
}: CoverLetterResultScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tr");
  const [copied, setCopied] = useState<TabId | null>(null);

  const trNotice = data.ui_notes?.tr_notice ?? DEFAULT_TR_NOTICE;
  const enNotice = data.ui_notes?.en_notice ?? DEFAULT_EN_NOTICE;
  const trText = data.turkish_version ?? "";
  const enText = data.english_version ?? "";

  const copyTr = useCallback(() => {
    navigator.clipboard.writeText(trText);
    setCopied("tr");
    setTimeout(() => setCopied(null), 2000);
  }, [trText]);

  const copyEn = useCallback(() => {
    navigator.clipboard.writeText(enText);
    setCopied("en");
    setTimeout(() => setCopied(null), 2000);
  }, [enText]);

  const scrollHeight = inModal ? "min-h-[50vh] max-h-[60vh] md:max-h-[55vh]" : "min-h-[40vh]";

  return (
    <div className="flex flex-col rounded-2xl bg-white">
      {/* Tabs — full width, üstte */}
      <div className="flex w-full border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("tr")}
          className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition-colors md:py-3.5 ${
            activeTab === "tr"
              ? "border-slate-800 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          🇹🇷 {COVER_LETTER_RESULT_UI.tabTr}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("en")}
          className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition-colors md:py-3.5 ${
            activeTab === "en"
              ? "border-slate-800 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          🇬🇧 {COVER_LETTER_RESULT_UI.tabEn}
        </button>
      </div>

      {/* İçerik alanı — note + scrollable metin */}
      <div className={`flex flex-1 flex-col overflow-hidden ${inModal ? "p-4 md:p-5" : "p-4"}`}>
        {activeTab === "tr" && (
          <>
            <p className="mb-3 text-sm font-medium text-slate-600">{trNotice}</p>
            <div
              className={`overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap ${scrollHeight}`}
              style={{ maxHeight: inModal ? "60vh" : undefined }}
            >
              {trText || "—"}
            </div>
          </>
        )}
        {activeTab === "en" && (
          <>
            <p className="mb-3 text-sm font-medium text-slate-600">{enNotice}</p>
            <div
              className={`overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap ${scrollHeight}`}
              style={{ maxHeight: inModal ? "60vh" : undefined }}
            >
              {enText || "—"}
            </div>
          </>
        )}

        {/* Sticky alt bar: Kopyala + opsiyonel mailto (EN sekmesinde) */}
        <div className="sticky bottom-0 mt-4 flex flex-col gap-2 border-t border-slate-100 bg-white pt-4 md:flex-row md:items-center md:gap-3">
          {activeTab === "tr" && (
            <button
              type="button"
              onClick={copyTr}
              className="h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white transition-colors hover:bg-slate-800 active:scale-[0.98] md:w-auto md:min-w-[180px] md:px-6"
            >
              {copied === "tr" ? "Kopyalandı" : COVER_LETTER_RESULT_UI.buttonCopyTr}
            </button>
          )}
          {activeTab === "en" && (
            <>
              <button
                type="button"
                onClick={copyEn}
                className="h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white transition-colors hover:bg-slate-800 active:scale-[0.98] md:w-auto md:min-w-[160px] md:px-6"
              >
                {copied === "en" ? "Copied" : COVER_LETTER_RESULT_UI.buttonCopyEn}
              </button>
              {jobEmail && (
                <a
                  href={`mailto:${jobEmail}`}
                  className="flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white font-medium text-slate-700 transition-colors hover:bg-slate-50 md:w-auto md:min-w-[200px] md:px-6"
                >
                  {COVER_LETTER_RESULT_UI.buttonOpenInEmail}
                </a>
              )}
            </>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-medium text-slate-600 hover:bg-slate-50 md:ml-auto"
            >
              {COVER_LETTER_RESULT_UI.buttonClose}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
