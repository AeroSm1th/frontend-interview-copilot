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
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">JD 匹配总结</h2>
            <p className="text-sm leading-7 text-zinc-600">{match.summary}</p>
          </div>
          <div className="shrink-0 self-start rounded-xl bg-zinc-900 px-4 py-3 text-center text-white">
            <p className="text-[11px] font-medium tracking-[0.12em] text-white/70">
              匹配度
            </p>
            <p className="mt-1 whitespace-nowrap text-lg font-semibold leading-none">
              {Math.round(match.matchScore)}/100
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5"
          >
            <h2 className="text-base font-semibold text-zinc-900">
              {section.title}
            </h2>
            <ul className="mt-3 space-y-3 text-sm leading-7 text-zinc-600">
              {section.items.map((item) => (
                <li key={item} className="rounded-2xl bg-white px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
