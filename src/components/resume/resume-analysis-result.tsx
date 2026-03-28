import type { ResumeAnalysis } from "@/types/resume";

type ResumeAnalysisResultProps = {
  analysis: ResumeAnalysis;
};

export function ResumeAnalysisResult({
  analysis,
}: ResumeAnalysisResultProps) {
  const sections = [
    {
      title: "关键词",
      items: analysis.keywords,
      tone: "soft",
    },
    {
      title: "优势",
      items: analysis.strengths,
      tone: "default",
    },
    {
      title: "风险点",
      items: analysis.risks,
      tone: "default",
    },
    {
      title: "改进建议",
      items: analysis.suggestedImprovements,
      tone: "default",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-base font-semibold text-zinc-900">整体总结</h2>
            <p className="text-sm leading-7 text-zinc-600">{analysis.summary}</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            已提炼 {analysis.keywords.length} 个核心关键词
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-900">
                {section.title}
              </h2>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                {section.items.length} 条
              </span>
            </div>

            {section.title === "关键词" ? (
              <div className="mt-4 flex flex-wrap gap-2.5">
                {section.items.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-600">
                {section.items.map((item) => (
                  <li key={item} className="rounded-2xl bg-white px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
