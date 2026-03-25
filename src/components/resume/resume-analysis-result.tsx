import type { ResumeAnalysis } from "@/types/resume";

type ResumeAnalysisResultProps = {
  analysis: ResumeAnalysis;
};

export function ResumeAnalysisResult({
  analysis,
}: ResumeAnalysisResultProps) {
  const sections = [
    {
      title: "优势",
      items: analysis.strengths,
    },
    {
      title: "风险点",
      items: analysis.risks,
    },
    {
      title: "改进建议",
      items: analysis.suggestedImprovements,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">整体总结</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-600">{analysis.summary}</p>

        <div className="mt-5">
          <h3 className="text-sm font-medium text-zinc-800">关键词</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-base font-semibold text-zinc-900">
              {section.title}
            </h2>
            <ul className="mt-3 space-y-3 text-sm leading-7 text-zinc-600">
              {section.items.map((item) => (
                <li key={item} className="rounded-2xl bg-zinc-50 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
