"use client";

import { type FormEvent } from "react";

import { ResumeJdMatchResult } from "@/components/resume/resume-jd-match-result";
import { SETUP_FORM_LIMITS } from "@/lib/constants";
import type { ResumeJdMatch } from "@/types/resume";

type ResumeJdMatchPanelProps = {
  jdText: string;
  match: ResumeJdMatch | null;
  errorMessage: string;
  validationMessage: string;
  shouldShowValidationError: boolean;
  isMatching: boolean;
  disabled?: boolean;
  onJdChange: (value: string) => void;
  onSubmit: () => void;
};

export function ResumeJdMatchPanel({
  jdText,
  match,
  errorMessage,
  validationMessage,
  shouldShowValidationError,
  isMatching,
  disabled = false,
  onJdChange,
  onSubmit,
}: ResumeJdMatchPanelProps) {
  const isSubmitDisabled = disabled || isMatching || Boolean(validationMessage);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    onSubmit();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="resume-jd-content"
                className="text-sm font-medium text-zinc-800"
              >
                目标岗位 JD
              </label>
              <span className="text-xs text-zinc-500">
                {jdText.length} 字 / 至少 {SETUP_FORM_LIMITS.jdMinLength} 字
              </span>
            </div>

            <textarea
              id="resume-jd-content"
              value={jdText}
              onChange={(event) => onJdChange(event.target.value)}
              placeholder="可选：粘贴一个目标岗位 JD，看看这份简历和岗位要求的匹配情况。"
              aria-invalid={shouldShowValidationError}
              disabled={disabled || isMatching}
              className={`min-h-40 w-full rounded-2xl border px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 ${
                shouldShowValidationError
                  ? "border-red-300 bg-red-50/60"
                  : "border-zinc-200 bg-zinc-50"
              }`}
            />

            {shouldShowValidationError ? (
              <p className="text-sm text-red-600">{validationMessage}</p>
            ) : (
              <p className="text-sm text-zinc-500">
                输入一个岗位 JD 后，系统会结合当前简历文本评估匹配度，并给出技能命中、差距和修改建议。
              </p>
            )}
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-zinc-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              JD 草稿和匹配结果会保存在当前浏览器中，方便你继续修改和对照。
            </p>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              {isMatching ? "正在匹配分析..." : "开始匹配分析"}
            </button>
          </div>
        </form>
      </section>

      {isMatching ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
            系统正在结合当前简历文本和岗位 JD 评估匹配情况，请稍候。
          </div>
        </section>
      ) : null}

      {!isMatching && !match && !errorMessage ? (
        <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-zinc-900">还没有 JD 匹配结果</h2>
            <p className="text-sm leading-7 text-zinc-600">
              先粘贴一个目标岗位 JD 并点击“开始匹配分析”，这里会展示匹配度、命中技能、缺失技能、风险点和改进建议。
            </p>
          </div>
        </section>
      ) : null}

      {match ? <ResumeJdMatchResult match={match} /> : null}
    </div>
  );
}
