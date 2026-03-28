import type { ResumeJdMatch } from "@/types/resume";

type ResumeJdMatchResultProps = {
  match: ResumeJdMatch;
};

export function ResumeJdMatchResult({ match }: ResumeJdMatchResultProps) {
  const sections = [
    {
      title: "命中技能",
      items: match.matchedSkills,
    },
    {
      title: "缺失技能",
      items: match.missingSkills,
    },
    {
      title: "风险点",
      items: match.risks,
    },
    {
      title: "改进建议",
      items: match.suggestions,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">JD 匹配总结</h2>
            <p className="text-sm leading-7 text-zinc-600">{match.summary}</p>
          </div>
          <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white">
            匹配度 {Math.round(match.matchScore)} / 100
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
