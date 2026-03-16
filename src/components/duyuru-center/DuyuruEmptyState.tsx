type DuyuruEmptyStateProps = {
  hasFilters: boolean;
  onClear: () => void;
};

export function DuyuruEmptyState({ hasFilters, onClear }: DuyuruEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Sonuç bulunamadı</h3>
      <p className="mt-2 text-sm text-slate-600">
        Seçtiğiniz filtrelere uygun duyuru görünmüyor. Farklı filtre kombinasyonu deneyebilirsiniz.
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filtreleri Temizle
        </button>
      ) : null}
    </div>
  );
}
