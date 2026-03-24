"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { INTERVIEW_SESSION_INITIAL_VALUES } from "@/lib/constants";
import { MOCK_INTERVIEW_QUESTIONS } from "@/lib/mock";
import {
  readInterviewSession,
  readSetupForm,
  saveInterviewSession,
} from "@/lib/storage";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewSession } from "@/types/interview";

export default function InterviewPage() {
  const router = useRouter();
  const setupForm = readSetupForm();
  const hasValidSetup = validateSetupForm(setupForm).isValid;
  const [session, setSession] = useState<InterviewSession>(() => {
    const savedSession = readInterviewSession();
    const questions =
      savedSession.questions.length > 0
        ? savedSession.questions
        : MOCK_INTERVIEW_QUESTIONS;
    const maxQuestionIndex = questions.length - 1;

    return {
      questions,
      currentQuestionIndex: Math.min(
        savedSession.currentQuestionIndex,
        maxQuestionIndex,
      ),
      answers: savedSession.answers,
    };
  });
  const questions =
    session.questions.length > 0 ? session.questions : MOCK_INTERVIEW_QUESTIONS;
  const maxQuestionIndex = questions.length - 1;

  useEffect(() => {
    if (!hasValidSetup) {
      return;
    }

    saveInterviewSession({
      ...session,
      questions,
    });
  }, [hasValidSetup, questions, session]);

  const currentQuestion = questions[session.currentQuestionIndex];
  const currentAnswer =
    session.answers.find((item) => item.questionId === currentQuestion.id)?.answer ??
    "";
  const progressWidth = `${((session.currentQuestionIndex + 1) / questions.length) * 100}%`;
  const isLastQuestion = session.currentQuestionIndex === questions.length - 1;
  const answeredCount = useMemo(
    () =>
      questions.filter((question) =>
        Boolean(
          session.answers.find((item) => item.questionId === question.id)?.answer.trim(),
        ),
      ).length,
    [questions, session.answers],
  );

  function handleAnswerChange(value: string) {
    setSession((currentSession) => ({
      ...currentSession,
      answers: currentSession.answers.some(
        (item) => item.questionId === currentQuestion.id,
      )
        ? currentSession.answers.map((item) =>
            item.questionId === currentQuestion.id
              ? {
                  ...item,
                  answer: value,
                }
              : item,
          )
        : [
            ...currentSession.answers,
            {
              questionId: currentQuestion.id,
              answer: value,
            },
          ],
    }));
  }

  function goToQuestion(index: number) {
    setSession((currentSession) => ({
      ...currentSession,
      currentQuestionIndex: Math.max(
        INTERVIEW_SESSION_INITIAL_VALUES.currentQuestionIndex,
        Math.min(index, maxQuestionIndex),
      ),
    }));
  }

  function handleNextStep() {
    if (isLastQuestion) {
      router.push("/report");
      return;
    }

    goToQuestion(session.currentQuestionIndex + 1);
  }

  if (!hasValidSetup) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="还没有可用的面试信息"
            description="请先返回设置页填写岗位 JD 和简历内容，再开始本地 mock 面试流程。"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/setup"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              返回设置页
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              回到首页
            </Link>
          </div>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="模拟面试"
          description="这里先使用固定的 5 道前端 mock 题完成本地面试流程，当前不会调用 AI。"
        />

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">当前进度</p>
              <p className="mt-1 text-base font-semibold text-zinc-900">
                第 {session.currentQuestionIndex + 1} 题 / 共{" "}
                {questions.length} 题
              </p>
            </div>
            <div className="w-36 rounded-full bg-zinc-100 p-1">
              <div
                className="h-2 rounded-full bg-zinc-900 transition-all"
                style={{ width: progressWidth }}
              />
            </div>
          </div>

          <div className="mb-4 rounded-2xl bg-zinc-50 p-5">
            <p className="text-sm font-medium text-zinc-500">题目区域</p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 px-4 py-3">
            <p className="text-sm text-zinc-500">
              已完成 {answeredCount} / {questions.length} 题
            </p>
            <p className="text-sm text-zinc-500">
              当前回答 {currentAnswer.length} 字
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <label
              htmlFor="answer-content"
              className="text-sm font-medium text-zinc-800"
            >
              你的回答
            </label>
            <textarea
              id="answer-content"
              value={currentAnswer}
              onChange={(event) => handleAnswerChange(event.target.value)}
              placeholder="请输入你的回答"
              className="min-h-56 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <p className="text-sm text-zinc-500">
              当前允许留空切换题目，答案会自动保存在本地浏览器中。
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => goToQuestion(session.currentQuestionIndex - 1)}
            disabled={
              session.currentQuestionIndex ===
              INTERVIEW_SESSION_INITIAL_VALUES.currentQuestionIndex
            }
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-400"
          >
            上一题
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            {isLastQuestion ? "查看报告" : "下一题"}
          </button>
        </section>
      </div>
    </PageContainer>
  );
}
