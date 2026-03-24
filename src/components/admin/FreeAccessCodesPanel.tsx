"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LETTER_PANEL_TARGET_SLUG } from "@/lib/freeAccessCodes";

type Row = {
  id: string;
  code: string;
  description: string | null;
  target_slug: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(local: string): string {
  const d = new Date(local);
  return d.toISOString();
}

const TARGET_OPTIONS = [{ value: LETTER_PANEL_TARGET_SLUG, label: "İş başvuru mektubu sayfası" }];

export function FreeAccessCodesPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTarget, setNewTarget] = useState(LETTER_PANEL_TARGET_SLUG);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newLimit, setNewLimit] = useState("");

  const [editRow, setEditRow] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/free-access-codes", { credentials: "include" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Liste alınamadı");
      }
      const data = (await res.json()) as Row[];
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const defaultRange = useMemo(() => {
    const start = new Date();
    const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
    return {
      start: toDatetimeLocalValue(start.toISOString()),
      end: toDatetimeLocalValue(end.toISOString()),
    };
  }, []);

  useEffect(() => {
    if (!newStart && defaultRange.start) setNewStart(defaultRange.start);
    if (!newEnd && defaultRange.end) setNewEnd(defaultRange.end);
  }, [defaultRange, newStart, newEnd]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/free-access-codes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          description: newDesc || null,
          target_slug: newTarget,
          starts_at: fromDatetimeLocalValue(newStart),
          expires_at: fromDatetimeLocalValue(newEnd),
          is_active: true,
          usage_limit: newLimit.trim() ? Number(newLimit) : null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Kayıt oluşturulamadı");
      setNewCode("");
      setNewDesc("");
      setNewLimit("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r: Row) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/free-access-codes/${r.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !r.is_active }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Güncellenemedi");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Bu kodu silmek istediğinize emin misiniz?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/free-access-codes/${id}`, { method: "DELETE", credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Silinemedi");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/free-access-codes/${editRow.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editRow.code,
          description: editRow.description,
          target_slug: editRow.target_slug,
          starts_at: editRow.starts_at,
          expires_at: editRow.expires_at,
          is_active: editRow.is_active,
          usage_limit: editRow.usage_limit,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Güncellenemedi");
      setEditRow(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ücretsiz erişim kodları (WhatsApp kanal)</h2>
          <p className="mt-1 text-sm text-slate-600">
            İş başvuru mektubu sayfası için dönemsel kodlar tanımlayın. Kodlar büyük harfe normalize edilir; geçerlilik
            tarihleri ve aktiflik buradan yönetilir.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleCreate} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Yeni kod</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Kod / şifre</span>
            <input
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Örn. BAHAR2026"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Açıklama / not (isteğe bağlı)</span>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="İç not"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Hedef sayfa / ürün</span>
            <select
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {TARGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Kullanım limiti (boş = sınırsız)</span>
            <input
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Örn. 500"
              inputMode="numeric"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Geçerlilik başlangıcı</span>
            <input
              required
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Geçerlilik bitişi</span>
            <input
              required
              type="datetime-local"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor…" : "Kodu oluştur"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-900">Tanımlı kodlar</h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Yükleniyor…</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Henüz kod yok.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Kod</th>
                  <th className="px-3 py-2">Hedef</th>
                  <th className="px-3 py-2">Başlangıç</th>
                  <th className="px-3 py-2">Bitiş</th>
                  <th className="px-3 py-2">Aktif</th>
                  <th className="px-3 py-2">Kullanım</th>
                  <th className="px-3 py-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-mono text-xs font-medium text-slate-900">{r.code}</td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-xs text-slate-600">{r.target_slug}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                      {new Date(r.starts_at).toLocaleString("tr-TR")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                      {new Date(r.expires_at).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(r)}
                        disabled={saving}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {r.is_active ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {r.usage_count}
                      {r.usage_limit != null ? ` / ${r.usage_limit}` : ""}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setEditRow({ ...r })}
                        className="text-sky-600 hover:underline"
                      >
                        Düzenle
                      </button>
                      <button type="button" onClick={() => remove(r.id)} className="ml-3 text-red-600 hover:underline">
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <form
            onSubmit={saveEdit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-slate-900">Kodu düzenle</h3>
            <div className="mt-4 grid gap-3">
              <label className="block text-sm">
                <span className="text-slate-600">Kod</span>
                <input
                  required
                  value={editRow.code}
                  onChange={(e) => setEditRow({ ...editRow, code: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Açıklama</span>
                <input
                  value={editRow.description ?? ""}
                  onChange={(e) => setEditRow({ ...editRow, description: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Hedef slug</span>
                <input
                  value={editRow.target_slug}
                  onChange={(e) => setEditRow({ ...editRow, target_slug: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Başlangıç</span>
                <input
                  type="datetime-local"
                  value={toDatetimeLocalValue(editRow.starts_at)}
                  onChange={(e) =>
                    setEditRow({ ...editRow, starts_at: fromDatetimeLocalValue(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Bitiş</span>
                <input
                  type="datetime-local"
                  value={toDatetimeLocalValue(editRow.expires_at)}
                  onChange={(e) =>
                    setEditRow({ ...editRow, expires_at: fromDatetimeLocalValue(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editRow.is_active}
                  onChange={(e) => setEditRow({ ...editRow, is_active: e.target.checked })}
                />
                Aktif
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Kullanım limiti (boş = sınırsız)</span>
                <input
                  value={editRow.usage_limit ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setEditRow({
                      ...editRow,
                      usage_limit: v ? Number(v) : null,
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditRow(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
