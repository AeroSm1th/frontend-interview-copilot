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
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-base font-semibold text-zinc-900">整体总结</h2>
            <p className="text-sm leading-7 text-zinc-600">{analysis.summary}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            已提炼 {analysis.keywords.length} 个核心关键词
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-900">
                {section.title}
              </h2>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                {section.items.length} 条
              </span>
            </div>

            <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-600">
              {section.items.map((item) => (
                <li
                  key={item}
                  className={`rounded-2xl px-4 py-3 ${
                    section.tone === "soft"
                      ? "border border-zinc-200 bg-zinc-50"
                      : "bg-zinc-50"
                  }`}
                >
                  {section.title === "关键词" ? (
                    <span className="text-sm font-medium text-zinc-700">{item}</span>
                  ) : (
                    item
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
