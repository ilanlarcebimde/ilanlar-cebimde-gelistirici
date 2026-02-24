"use client";

export type GuideBlock = {
  type: "bullets" | "text" | "table" | "template";
  heading: string;
  items: string[] | null;
  text: string | null;
  rows: { k: string; v: string }[] | null;
};

export type GuideResponse = {
  session_id: string;
  step: number;
  title: string;
  content_blocks: GuideBlock[];
  disclaimer_blocks?: { type: "text"; text: string }[];
  cta?: { label?: string; url?: string };
  ui?: { next_step_ready?: boolean; next_step?: number | null; continue_label?: string };
};

export function isGuideResponse(data: unknown): data is GuideResponse {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.session_id === "string" &&
    typeof d.step === "number" &&
    typeof d.title === "string" &&
    Array.isArray(d.content_blocks)
  );
}

function BlockBullets({ block }: { block: GuideBlock }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold text-slate-800">{block.heading}</h3>
      <ul className="list-inside space-y-1 text-slate-600" style={{ listStyleType: "disc" }}>
        {(block.items ?? []).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function BlockText({ block }: { block: GuideBlock }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold text-slate-800">{block.heading}</h3>
      <p className="text-slate-600 whitespace-pre-wrap">{block.text ?? ""}</p>
    </section>
  );
}

function BlockTable({ block }: { block: GuideBlock }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold text-slate-800">{block.heading}</h3>
      {block.rows && block.rows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="bg-slate-50 px-4 py-2 font-medium text-slate-700 align-top w-[40%]">{row.k}</td>
                  <td className="px-4 py-2 text-slate-600">{row.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function BlockTemplate({ block }: { block: GuideBlock }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold text-slate-800">{block.heading}</h3>
      <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono">
        {block.text ?? ""}
      </pre>
    </section>
  );
}

function RenderBlock({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "bullets":
      return <BlockBullets block={block} />;
    case "text":
      return <BlockText block={block} />;
    case "table":
      return <BlockTable block={block} />;
    case "template":
      return <BlockTemplate block={block} />;
    default:
      return null;
  }
}

// ——— Ana component ———

export type GuideRendererProps = {
  data: GuideResponse;
  onNextStep?: (sessionId: string, nextStep: number) => void;
  nextStepLoading?: boolean;
};

export function GuideRenderer({ data, onNextStep, nextStepLoading = false }: GuideRendererProps) {
  const showNextStep =
    data.ui?.next_step_ready === true &&
    data.ui?.next_step != null &&
    typeof data.ui.next_step === "number" &&
    onNextStep != null;

  const handleNextStep = () => {
    if (!showNextStep || !onNextStep || data.ui?.next_step == null) return;
    onNextStep(data.session_id, data.ui.next_step);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
        <h2 className="text-xl font-bold text-slate-900">{data.title}</h2>

        <hr className="border-slate-200" />

        {data.content_blocks && data.content_blocks.length > 0 ? (
          <div className="space-y-6">
            {data.content_blocks.map((block, index) => (
              <RenderBlock key={index} block={block} />
            ))}
          </div>
        ) : null}

        {data.disclaimer_blocks && data.disclaimer_blocks.length > 0 ? (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-amber-800">
            <p className="font-semibold text-amber-900">Uyarı</p>
            {data.disclaimer_blocks.map((d, i) => (
              <p key={i} className="mt-1">{d.text}</p>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          {data.cta?.url ? (
            <a
              href={data.cta.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {data.cta?.label ?? "İlana Git"}
            </a>
          ) : null}
          {showNextStep ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={nextStepLoading}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {nextStepLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  Yükleniyor…
                </>
              ) : (
                data.ui?.continue_label ?? "Sonraki Adım"
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** GuideResponse ise GuideRenderer; değilse aynı card stiliyle "İçerik yüklenemedi." */
export function GuideRendererSafe({
  data,
  onNextStep,
  nextStepLoading,
}: {
  data: unknown;
  onNextStep?: (sessionId: string, nextStep: number) => void;
  nextStepLoading?: boolean;
}) {
  if (isGuideResponse(data)) {
    return (
      <GuideRenderer
        data={data}
        onNextStep={onNextStep}
        nextStepLoading={nextStepLoading}
      />
    );
  }
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-6 text-center text-slate-600">
        İçerik yüklenemedi.
      </div>
    </div>
  );
}
