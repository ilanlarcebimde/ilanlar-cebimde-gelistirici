"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { DuyuruCountry, DuyuruSort, DuyuruStatusFilter } from "./types";
import { formatNewsTypeLabel } from "./helpers";

type DuyuruFilterBarProps = {
  countries: DuyuruCountry[];
  newsTypes: string[];
  selectedCountry: string;
  selectedType: string;
  selectedStatus: DuyuruStatusFilter;
  search: string;
  sortBy: DuyuruSort;
  onlyImportant: boolean;
  onCountryChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: DuyuruStatusFilter) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: DuyuruSort) => void;
  onOnlyImportantChange: (value: boolean) => void;
};

const STATUS_OPTIONS: Array<{ value: DuyuruStatusFilter; label: string }> = [
  { value: "all", label: "Tümü" },
  { value: "featured", label: "Öne Çıkan" },
  { value: "breaking", label: "Son Dakika" },
  { value: "important", label: "Önemli" },
];

export function DuyuruFilterBar(props: DuyuruFilterBarProps) {
  const {
    countries,
    newsTypes,
    selectedCountry,
    selectedType,
    selectedStatus,
    search,
    sortBy,
    onlyImportant,
    onCountryChange,
    onTypeChange,
    onStatusChange,
    onSearchChange,
    onSortChange,
    onOnlyImportantChange,
  } = props;
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sheetOpen]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCountry) count += 1;
    if (selectedType) count += 1;
    if (selectedStatus !== "all") count += 1;
    return count;
  }, [selectedCountry, selectedType, selectedStatus]);

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:space-y-4 md:p-5">
      <div className="grid gap-2.5 lg:grid-cols-[1.6fr,200px,220px] lg:gap-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Başlık, özet veya kaynak içinde ara..."
            className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 md:h-11"
          />
        </label>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as DuyuruSort)}
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100 md:h-11"
        >
          <option value="newest">En Yeni</option>
          <option value="oldest">En Eski</option>
          <option value="priority">Önce Önemli</option>
        </select>

        <label className="inline-flex h-10 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm text-slate-700 md:h-11">
          <span>Sadece önemli duyurular</span>
          <input
            type="checkbox"
            checked={onlyImportant}
            onChange={(e) => onOnlyImportantChange(e.target.checked)}
            className="h-4 w-4 accent-slate-900"
          />
        </label>
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ülke</p>
          <select
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          >
            <option value="">Tümü</option>
            {countries.map((country) => (
              <option key={country.slug} value={country.slug}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Duyuru Türü</p>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          >
            <option value="">Tümü</option>
            {newsTypes.map((type) => (
              <option key={type} value={type}>
                {formatNewsTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Durum</p>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as DuyuruStatusFilter)}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Gelişmiş Filtreler
          </span>
          <span className="text-xs text-slate-500">{activeFilterCount > 0 ? `${activeFilterCount} aktif` : "Kapalı"}</span>
        </button>
      </div>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[1200] md:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-slate-950/45"
            aria-label="Filtre panelini kapat"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Filtreleri Aç</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCountryChange("");
                    onTypeChange("");
                    onStatusChange("all");
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Filtreleri Temizle
                </button>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ülke</p>
                <select
                  value={selectedCountry}
                  onChange={(e) => onCountryChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                >
                  <option value="">Tümü</option>
                  {countries.map((country) => (
                    <option key={country.slug} value={country.slug}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Duyuru Türü</p>
                <select
                  value={selectedType}
                  onChange={(e) => onTypeChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                >
                  <option value="">Tümü</option>
                  {newsTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatNewsTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Durum</p>
                <select
                  value={selectedStatus}
                  onChange={(e) => onStatusChange(e.target.value as DuyuruStatusFilter)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Filtreleri Uygula
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
