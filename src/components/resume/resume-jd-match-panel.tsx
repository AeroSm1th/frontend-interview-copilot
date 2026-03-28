"use client";

import Link from "next/link";

import { ResumeJdMatchResult } from "@/components/resume/resume-jd-match-result";
import type { ResumeJdMatch } from "@/types/resume";

type ResumeJdMatchPanelProps = {
  jdText: string;
  match: ResumeJdMatch | null;
  errorMessage: string;
  validationMessage: string;
  isMatching: boolean;
  disabled?: boolean;
  onSubmit: () => void;
};

function getPreviewText(value: string, maxLength = 220) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function ResumeJdMatchPanel({
  jdText,
  match,
  errorMessage,
  validationMessage,
  isMatching,
  disabled = false,
  onSubmit,
}: ResumeJdMatchPanelProps) {
  const hasJdDraft = jdText.trim().length > 0;
  const hasValidJdDraft = hasJdDraft && !validationMessage;
  const isSubmitDisabled = disabled || isMatching || !hasValidJdDraft;
  const previewText = getPreviewText(jdText);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-zinc-900">JD 匹配分析</h2>
              <p className="text-sm leading-7 text-zinc-600">
                这里会直接消费 /resume 中准备好的岗位 JD，与当前简历上下文一起评估匹配度、缺口和修改建议。
              </p>
            </div>

            {!hasValidJdDraft ? (
              <Link
                href="/resume"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                返回 /resume 编辑
              </Link>
            ) : null}
          </div>

          {hasJdDraft ? (
            <div
              className={`rounded-2xl border px-4 py-4 ${
                hasValidJdDraft
                  ? "border-zinc-200 bg-zinc-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-zinc-800">当前岗位 JD 摘要</p>
                <span className="text-xs text-zinc-500">{jdText.length} 字</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                {previewText}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-sm leading-7 text-zinc-600">
              还没有可用于匹配分析的岗位 JD。先返回 /resume 补充目标岗位信息，这里才会生成 JD 匹配结果。
            </div>
          )}

          {hasJdDraft && !hasValidJdDraft ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {validationMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-zinc-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              {hasValidJdDraft
                ? "当前 JD 草稿与匹配结果会继续保存在浏览器中，方便你在 /resume 和 /analysis 之间来回调整。"
                : "分析页不再直接编辑 JD。需要补充或修改内容时，请回到 /resume。"}
            </p>

            {hasValidJdDraft ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitDisabled}
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
              >
                {isMatching ? "正在匹配分析..." : "开始匹配分析"}
              </button>
            ) : (
              <Link
                href="/resume"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                去 /resume 补充 JD
              </Link>
            )}
          </div>
        </div>
      </section>

      {isMatching ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
            系统正在结合当前简历文本和岗位 JD 评估匹配情况，请稍候。
          </div>
        </section>
      ) : null}

      {!isMatching && !match && hasValidJdDraft && !errorMessage ? (
        <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">还没有 JD 匹配结果</h2>
            <p className="text-sm leading-7 text-zinc-600">
              点击“开始匹配分析”后，这里会展示匹配度、命中技能、缺失技能、风险点和改进建议。
            </p>
          </div>
        </section>
      ) : null}

      {match ? <ResumeJdMatchResult match={match} /> : null}
    </div>
  );
}
