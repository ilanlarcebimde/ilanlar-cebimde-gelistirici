import { normalizeBySemantic } from "@/lib/assistant/normalizers";

type FieldRule = {
  inputType: "text" | "textarea" | "number" | "date" | "select";
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  semantic?: { kind?: string; normalizeHint?: string };
};

export type ApplyResult = {
  cv: Record<string, unknown>;
  changed: boolean;
  issues: Array<{ key: string; type: "warning" | "error"; message: string }>;
};

/** Nested cv'yi düz anahtarlı objeye çevirir (key: "personal.fullName" gibi). */
export function flattenCv(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenCv(v as Record<string, unknown>, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

/** Düz anahtarlı cv'yi nested objeye çevirir (load sonrası UI state için). */
export function unflattenCv(flat: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const keys = key.split(".");
    let current = out;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof (current as Record<string, unknown>)[k] !== "object") {
        (current as Record<string, unknown>)[k] = {};
      }
      current = (current as Record<string, unknown>)[k] as Record<string, unknown>;
    }
    (current as Record<string, unknown>)[keys[keys.length - 1]] = value;
  }
  return out;
}

function setByKeyFlat(obj: Record<string, unknown>, key: string, value: unknown): void {
  obj[key] = value;
}

function getByKeyFlat(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

export function applyFieldRulesToCv(params: {
  cv: Record<string, unknown>;
  updates: Array<{ key: string; value: unknown }>;
  fieldRules: Record<string, FieldRule>;
  allowedKeys: string[];
}): ApplyResult {
  const { cv, updates, fieldRules, allowedKeys } = params;

  const nextCv = flattenCv(
    JSON.parse(JSON.stringify(cv ?? {})) as Record<string, unknown>
  );
  let changed = false;
  const issues: ApplyResult["issues"] = [];

  for (const u of updates) {
    const key = u.key;
    if (!allowedKeys.includes(key)) {
      issues.push({ key, type: "error", message: "İzinli olmayan alan anahtarı." });
      continue;
    }

    const rule = fieldRules[key];
    const kind = rule?.semantic?.kind;

    const nr = normalizeBySemantic(kind, u.value);
    const finalValue = nr.value;

    const v = rule?.validation;
    const s = toStr(finalValue);

    if (v?.required && !s.trim()) {
      issues.push({ key, type: "error", message: "Bu alan zorunlu görünüyor." });
      continue;
    }
    if (typeof v?.minLength === "number" && s.trim().length < v.minLength) {
      issues.push({
        key,
        type: "error",
        message: `Bu alan çok kısa. (min ${v.minLength})`,
      });
      continue;
    }
    if (typeof v?.maxLength === "number" && s.trim().length > v.maxLength) {
      issues.push({
        key,
        type: "error",
        message: `Bu alan çok uzun. (max ${v.maxLength})`,
      });
      continue;
    }
    if (v?.pattern) {
      try {
        const re = new RegExp(v.pattern);
        if (s.trim() && !re.test(s.trim())) {
          issues.push({ key, type: "error", message: "Format beklenen kurala uymuyor." });
          continue;
        }
      } catch {
        issues.push({
          key,
          type: "warning",
          message: "Pattern kuralı geçersiz; kontrol atlandı.",
        });
      }
    }

    if (nr.warning) {
      issues.push({ key, type: "warning", message: nr.warning });
    }

    const before = getByKeyFlat(nextCv, key);
    setByKeyFlat(nextCv, key, finalValue);
    if (String(before ?? "") !== String(finalValue ?? "")) changed = true;
  }

  return { cv: nextCv, changed, issues };
}
