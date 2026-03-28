"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { MOCK_INTERVIEW_QUESTIONS } from "@/lib/mock";
import { getReusableResumeContext } from "@/lib/resume-context";
import {
  appendInterviewHistory,
  clearInterviewSession,
  clearInterviewReport,
  clearSetupForm,
  readInterviewReport,
  readInterviewSession,
  readSetupForm,
  saveInterviewReport,
} from "@/lib/storage";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewReport } from "@/types/interview";

type GenerateReportErrorResponse = {
  message?: string;
};

function getGenerateReportErrorMessage(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return "生成报告失败，请稍后重试。";
}

function createHistoryItemId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
}

export default function ReportPage() {
  const router = useRouter();
  const hasTriggeredGeneration = useRef(false);
  const setupForm = useMemo(() => readSetupForm(), []);
  const interviewSession = useMemo(() => readInterviewSession(), []);
  const hasValidSetup = validateSetupForm(setupForm).isValid;
  const currentQuestions =
    interviewSession.questions.length > 0
      ? interviewSession.questions
      : MOCK_INTERVIEW_QUESTIONS;
  const questionCount = currentQuestions.length;
  const followUpCount = currentQuestions.filter(
    (question) => question.kind === "follow_up",
  ).length;
  const answeredCount = interviewSession.answers.filter((item) =>
    Boolean(item.answer.trim()),
  ).length;
  const totalAnswerLength = interviewSession.answers.reduce(
    (total, item) => total + item.answer.trim().length,
    0,
  );
  const hasInterviewData =
    interviewSession.currentQuestionIndex > 0 ||
    interviewSession.questions.length > 0 ||
    interviewSession.answers.length > 0;
  const hasRequiredData = hasValidSetup && hasInterviewData;
  const [report, setReport] = useState<InterviewReport | null>(() =>
    readInterviewReport(),
  );
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  function handleRestart() {
    clearSetupForm();
    clearInterviewSession();
    clearInterviewReport();
    router.push("/resume");
  }

  async function generateReport() {
    if (!hasRequiredData) {
      return;
    }

    try {
      setIsGeneratingReport(true);
      setReportError("");
      const { reusableAnalysis, reusableJdMatch } = getReusableResumeContext({
        resume: setupForm.resume,
        jd: setupForm.jd,
      });

      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jd: setupForm.jd,
          resume: setupForm.resume,
          questions: currentQuestions,
          answers: interviewSession.answers,
          analysis: reusableAnalysis,
          jdMatch: reusableJdMatch,
        }),
      });
      const result = (await response.json()) as
        | InterviewReport
        | GenerateReportErrorResponse;

      if (!response.ok) {
        throw new Error(getGenerateReportErrorMessage(result));
      }

      const nextReport = result as InterviewReport;
      setReport(nextReport);
      saveInterviewReport(nextReport);

      try {
        appendInterviewHistory({
          id: createHistoryItemId(),
          createdAt: new Date().toISOString(),
          setup: {
            jd: setupForm.jd,
            resume: setupForm.resume,
          },
          questions: currentQuestions,
          answers: interviewSession.answers,
          report: nextReport,
        });
      } catch {}
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "生成报告失败，请稍后重试。",
      );
    } finally {
      setIsGeneratingReport(false);
    }
  }

  const handleAutoGenerateReport = useEffectEvent(() => {
    void generateReport();
  });

  useEffect(() => {
    if (!hasRequiredData || report || hasTriggeredGeneration.current) {
      return;
    }

    hasTriggeredGeneration.current = true;
    handleAutoGenerateReport();
  }, [hasRequiredData, report]);

  if (!hasRequiredData) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="还没有可展示的报告"
            description="请先完成分析和本地模拟面试流程，随后这里会展示一份模拟复盘报告。"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/analysis"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              返回分析页
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

  const reportSections = [
    {
      title: "优势",
      items: report?.strengths ?? [],
    },
    {
      title: "薄弱点",
      items: report?.weaknesses ?? [],
    },
    {
      title: "建议",
      items: report?.suggestions ?? [],
    },
  ];

  if (isGeneratingReport && !report) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="正在生成复盘报告"
            description="系统正在基于岗位信息和整轮面试回答生成真实 AI 报告，请稍候。"
          />
          <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
            正在生成报告...
          </div>
        </section>
      </PageContainer>
    );
  }

  if (!report) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="报告生成失败"
            description="这次没有成功拿到 AI 报告，你可以重试一次，当前面试数据仍然保留。"
          />
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {reportError || "生成报告失败，请稍后重试。"}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                hasTriggeredGeneration.current = true;
                void generateReport();
              }}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              重试生成
            </button>
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

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="面试复盘报告"
          description="这是一份基于岗位信息和整轮问答生成的真实 AI 复盘报告，内容会优先读取本地缓存。第一阶段只重构信息架构，不影响现有报告与历史能力。"
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
                  {answeredCount} / {questionCount}
                </p>
                {followUpCount > 0 ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    含 {followUpCount} 道追问
                  </p>
                ) : null}
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

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">总结</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600">{report.summary}</p>
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

        <section className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/history"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            查看历史记录
          </Link>
          <button
            type="button"
            onClick={() => {
              clearInterviewReport();
              setReport(null);
              hasTriggeredGeneration.current = true;
              void generateReport();
            }}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            重新生成报告
          </button>
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
