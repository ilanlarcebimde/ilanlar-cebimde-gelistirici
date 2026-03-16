"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { DuyuruCountry, DuyuruSort, DuyuruStatusFilter } from "./types";
import { NEWS_TYPE_LABELS } from "./helpers";

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

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="grid gap-3 lg:grid-cols-[1.6fr,220px,220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Başlık, özet veya kaynak içinde ara..."
            className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          />
        </label>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as DuyuruSort)}
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
        >
          <option value="newest">Sıralama: En Yeni</option>
          <option value="oldest">Sıralama: En Eski</option>
          <option value="priority">Sıralama: Önce Önemli</option>
        </select>

        <label className="inline-flex h-11 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm text-slate-700">
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
                {NEWS_TYPE_LABELS[type] ?? "Resmi Duyuru"}
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

      <details className="md:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
          <SlidersHorizontal className="h-4 w-4" />
          Filtre Grupları
        </summary>
        <div className="mt-3 space-y-3">
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
                  {NEWS_TYPE_LABELS[type] ?? "Resmi Duyuru"}
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
      </details>
    </section>
  );
}
