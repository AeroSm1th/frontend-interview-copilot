"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { readInterviewHistoryItemById } from "@/lib/storage";
import type {
  InterviewAnswer,
  InterviewHistoryItem,
  InterviewQuestion,
} from "@/types/interview";

type HistoryDetailStatus = "loading" | "ready" | "not-found";

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

function getAnsweredCount(answers: InterviewAnswer[]) {
  return answers.filter((answer) => Boolean(answer.answer.trim())).length;
}

function findAnswerByQuestionId(
  answers: InterviewAnswer[],
  questionId: InterviewQuestion["id"],
) {
  return answers.find((answer) => answer.questionId === questionId) ?? null;
}

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const historyId = params.id;
  const [status, setStatus] = useState<HistoryDetailStatus>("loading");
  const [historyItem, setHistoryItem] = useState<InterviewHistoryItem | null>(null);

  useEffect(() => {
    const nextHistoryItem = historyId
      ? readInterviewHistoryItemById(historyId)
      : null;

    startTransition(() => {
      setHistoryItem(nextHistoryItem);
      setStatus(nextHistoryItem ? "ready" : "not-found");
    });
  }, [historyId]);

  if (status === "loading") {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="正在读取历史详情"
            description="系统正在从当前浏览器加载这轮模拟面试的本地历史快照，请稍候。"
          />
          <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
            正在读取历史详情...
          </div>
        </section>
      </PageContainer>
    );
  }

  if (!historyItem) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="未找到这条历史记录"
            description="这条本地历史可能已经被删除，或者当前浏览器中没有对应的记录。"
          />
          <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
            历史记录只保存在当前浏览器中，清空或删除后将无法继续查看。
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/history"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              返回历史记录
            </Link>
            <Link
              href="/resume"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              开始新的模拟
            </Link>
          </div>
        </section>
      </PageContainer>
    );
  }

  const answeredCount = getAnsweredCount(historyItem.answers);
  const reportSections = [
    {
      title: "优势",
      items: historyItem.report.strengths,
    },
    {
      title: "薄弱点",
      items: historyItem.report.weaknesses,
    },
    {
      title: "建议",
      items: historyItem.report.suggestions,
    },
  ];

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="历史详情"
            description="这里展示的是这轮模拟面试保存在当前浏览器中的完整历史快照，不会混用当前进行中的会话状态。"
          />
          <Link
            href="/history"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            返回历史记录
          </Link>
        </div>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-sm text-zinc-500">
                生成时间 {formatHistoryDate(historyItem.createdAt)}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white">
                  评分 {historyItem.report.score} / 100
                </span>
                <span className="text-sm text-zinc-500">
                  已回答 {answeredCount} / {historyItem.questions.length} 题
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">报告总结</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-600">
            {historyItem.report.summary || "暂无总结内容"}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {reportSections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-semibold text-zinc-900">
                {section.title}
              </h2>
              {section.items.length > 0 ? (
                <ul className="mt-3 space-y-3 text-sm leading-7 text-zinc-600">
                  {section.items.map((item) => (
                    <li key={item} className="rounded-2xl bg-zinc-50 px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                  暂无内容
                </div>
              )}
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">岗位 JD</h2>
            <div className="mt-3 rounded-2xl bg-zinc-50 px-4 py-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-600">
                {historyItem.setup.jd || "暂无 JD 内容"}
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">简历快照</h2>
            <div className="mt-3 rounded-2xl bg-zinc-50 px-4 py-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-600">
                {historyItem.setup.resume || "暂无简历内容"}
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">题目与回答</h2>
              <p className="mt-1 text-sm text-zinc-500">
                问答明细按历史快照中的题目顺序展示，并通过 questionId 匹配对应回答。
              </p>
            </div>
            <span className="text-sm text-zinc-500">
              共 {historyItem.questions.length} 题
            </span>
          </div>

          {historyItem.questions.length > 0 ? (
            <div className="mt-5 space-y-4">
              {historyItem.questions.map((question, index) => {
                const matchedAnswer = findAnswerByQuestionId(
                  historyItem.answers,
                  question.id,
                );
                const answerText = matchedAnswer?.answer.trim() || "暂无回答";

                return (
                  <article
                    key={question.id}
                    className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500">
                        题目 {index + 1}
                      </span>
                      <span className="text-xs text-zinc-400">
                        questionId: {question.id}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-zinc-900">问题</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                        {question.question}
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-medium text-zinc-900">回答</p>
                      <div className="mt-2 rounded-2xl bg-white px-4 py-4">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-600">
                          {answerText}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-500">
              这条历史记录中暂无题目数据。
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
