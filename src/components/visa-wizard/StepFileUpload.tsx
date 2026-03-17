"use client";

import { FileUploadField } from "./FileUploadField";
import type { VisaWizardFileState } from "./types";

interface StepFileUploadProps {
  files: VisaWizardFileState;
  onChange: (next: VisaWizardFileState) => void;
  error?: string | null;
}

export function StepFileUpload({ files, onChange, error }: StepFileUploadProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Dosya yükleme alanı</h3>
      <p className="mt-1 text-sm text-slate-600">En az 1 dosya yüklemeden devam edemezsiniz.</p>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FileUploadField
          label="Pasaport / kimlik belgesi"
          files={files.passportOrId ? [files.passportOrId] : []}
          onChange={(next) => onChange({ ...files, passportOrId: next[0] ?? null })}
        />
        <FileUploadField
          label="Özgeçmiş / CV"
          files={files.cv ? [files.cv] : []}
          onChange={(next) => onChange({ ...files, cv: next[0] ?? null })}
        />
        <FileUploadField
          label="Diploma / öğrenci belgesi"
          files={files.diploma ? [files.diploma] : []}
          onChange={(next) => onChange({ ...files, diploma: next[0] ?? null })}
        />
        <FileUploadField
          label="Ret mektubu (varsa)"
          files={files.refusalLetter ? [files.refusalLetter] : []}
          onChange={(next) => onChange({ ...files, refusalLetter: next[0] ?? null })}
        />
        <FileUploadField
          label="Davet / iş teklifi / kabul mektubu (varsa)"
          files={files.invitationOrOffer ? [files.invitationOrOffer] : []}
          onChange={(next) => onChange({ ...files, invitationOrOffer: next[0] ?? null })}
        />
        <FileUploadField
          label="Ek belge yükle"
          multiple
          files={files.extras}
          onChange={(next) => onChange({ ...files, extras: next })}
        />
      </div>
    </div>
  );
}
