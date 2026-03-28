import Link from "next/link";

import type { InterviewHistoryItem } from "@/types/interview";

type HistoryListItemProps = {
  item: InterviewHistoryItem;
  onDelete: (id: string) => void;
};

function formatHistoryDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTextPreview(value: string, maxLength: number) {
  const normalizedText = value.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return "暂无内容";
  }

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength).trim()}...`;
}

function getInterviewModeLabel(mode?: InterviewHistoryItem["mode"]) {
  return mode === "targeted_practice" ? "专项训练" : "普通模拟";
}

export function HistoryListItem({
  item,
  onDelete,
}: HistoryListItemProps) {
  const answeredCount = item.answers.filter((answer) =>
    Boolean(answer.answer.trim()),
  ).length;
  const isTargetedPractice = item.mode === "targeted_practice";

  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">
            生成时间 {formatHistoryDate(item.createdAt)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white">
              评分 {item.report.score}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                isTargetedPractice
                  ? "bg-amber-100 text-amber-700"
                  : "bg-zinc-100 text-zinc-700"
              }`}
            >
              {getInterviewModeLabel(item.mode)}
            </span>
            <span className="text-sm text-zinc-500">
              已回答 {answeredCount} / {item.questions.length} 题
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/history/${item.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            查看详情
          </Link>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            删除记录
          </button>
        </div>
      </div>

      <section className="mt-5 rounded-2xl bg-zinc-50 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          报告总结
        </p>
        <p className="mt-2 text-sm leading-7 text-zinc-700">
          {getTextPreview(item.report.summary, 180)}
        </p>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-zinc-100 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            JD 预览
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            {getTextPreview(item.setup.jd, 140)}
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-100 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            简历预览
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            {getTextPreview(item.setup.resume, 140)}
          </p>
        </section>
      </div>
    </article>
  );
}
