import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

const reportSections = [
  {
    title: "总结",
    content: "这里将展示本次模拟面试的整体总结。",
  },
  {
    title: "优势",
    content: "这里将展示回答中的亮点和表现较好的部分。",
  },
  {
    title: "薄弱点",
    content: "这里将展示需要加强的知识点或表达问题。",
  },
  {
    title: "建议",
    content: "这里将展示下一步练习建议和改进方向。",
  },
];

export default function ReportPage() {
  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="面试复盘报告"
          description="当前只实现报告页骨架，用于承载后续评分、总结和建议内容。"
        />

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">综合评分</p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-5xl font-semibold tracking-tight text-zinc-900">
              86
            </span>
            <span className="pb-1 text-sm text-zinc-500">/ 100</span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {reportSections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-semibold text-zinc-900">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                {section.content}
              </p>
            </article>
          ))}
        </section>
      </div>
    </PageContainer>
  );
}
