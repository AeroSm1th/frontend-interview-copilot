"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { generateMockInterviewReport, MOCK_INTERVIEW_QUESTIONS } from "@/lib/mock";
import {
  clearInterviewSession,
  clearSetupForm,
  readInterviewSession,
  readSetupForm,
} from "@/lib/storage";
import { validateSetupForm } from "@/lib/validation";

export default function ReportPage() {
  const router = useRouter();
  const setupForm = readSetupForm();
  const interviewSession = readInterviewSession();
  const hasValidSetup = validateSetupForm(setupForm).isValid;
  const answeredCount = Object.values(interviewSession.answers).filter((answer) =>
    Boolean(answer.trim()),
  ).length;
  const totalAnswerLength = Object.values(interviewSession.answers).reduce(
    (total, answer) => total + answer.trim().length,
    0,
  );
  const hasInterviewData =
    interviewSession.currentQuestionIndex > 0 || Object.keys(interviewSession.answers).length > 0;
  const hasRequiredData = hasValidSetup && hasInterviewData;

  function handleRestart() {
    clearSetupForm();
    clearInterviewSession();
    router.push("/setup");
  }

  if (!hasRequiredData) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="还没有可展示的报告"
            description="请先完成设置和本地 mock 面试流程，随后这里会展示一份模拟复盘报告。"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/setup"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              返回设置页
            </Link>
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              重新开始
            </button>
          </div>
        </section>
      </PageContainer>
    );
  }

  const report = generateMockInterviewReport(interviewSession, setupForm);
  const reportSections = [
    {
      title: "总结",
      content: report.summary,
    },
    {
      title: "优势",
      items: report.strengths,
    },
    {
      title: "薄弱点",
      items: report.weaknesses,
    },
    {
      title: "建议",
      items: report.suggestions,
    },
  ];

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="面试复盘报告"
          description="这是一份基于本地 setup 数据和 mock 面试过程生成的模拟复盘报告，当前不会调用 AI。"
        />

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">综合评分</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-5xl font-semibold tracking-tight text-zinc-900">
                  {report.score}
                </span>
                <span className="pb-1 text-sm text-zinc-500">/ 100</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <p className="text-xs text-zinc-500">已回答题目</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {answeredCount} / {MOCK_INTERVIEW_QUESTIONS.length}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <p className="text-xs text-zinc-500">总回答字数</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {totalAnswerLength}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <p className="text-xs text-zinc-500">当前进度</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  第 {interviewSession.currentQuestionIndex + 1} 题
                </p>
              </div>
            </div>
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
              {"content" in section ? (
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {section.content}
                </p>
              ) : (
                <ul className="mt-3 space-y-3 text-sm leading-7 text-zinc-600">
                  {section.items.map((item) => (
                    <li key={item} className="rounded-2xl bg-zinc-50 px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>

        <section className="flex justify-end">
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            重新开始
          </button>
        </section>
      </div>
    </PageContainer>
  );
}
