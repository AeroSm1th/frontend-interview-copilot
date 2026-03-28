"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { INTERVIEW_SESSION_INITIAL_VALUES } from "@/lib/constants";
import { MOCK_INTERVIEW_QUESTIONS } from "@/lib/mock";
import { getReusableResumeContext } from "@/lib/resume-context";
import {
  readInterviewSession,
  readSetupForm,
  saveInterviewSession,
} from "@/lib/storage";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewQuestion, InterviewSession } from "@/types/interview";

type GenerateFollowUpSuccessResponse = {
  followUpQuestion: InterviewQuestion | null;
};

type GenerateFollowUpErrorResponse = {
  message?: string;
};

type FollowUpUiStatus = "idle" | "checking" | "inserted" | "none" | "failed";

type FollowUpUiState = {
  status: FollowUpUiStatus;
  mainQuestionId: string | null;
};

function isInterviewQuestion(value: unknown): value is InterviewQuestion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (typeof data.id !== "string" || typeof data.question !== "string") {
    return false;
  }

  if (
    "kind" in data &&
    typeof data.kind !== "undefined" &&
    data.kind !== "main" &&
    data.kind !== "follow_up"
  ) {
    return false;
  }

  if (
    "parentQuestionId" in data &&
    typeof data.parentQuestionId !== "undefined" &&
    data.parentQuestionId !== null &&
    typeof data.parentQuestionId !== "string"
  ) {
    return false;
  }

  if (
    "followUpStatus" in data &&
    typeof data.followUpStatus !== "undefined" &&
    data.followUpStatus !== "pending" &&
    data.followUpStatus !== "generated" &&
    data.followUpStatus !== "skipped"
  ) {
    return false;
  }

  if (
    "followUpHint" in data &&
    typeof data.followUpHint !== "undefined" &&
    data.followUpHint !== null &&
    typeof data.followUpHint !== "string"
  ) {
    return false;
  }

  return true;
}

function isGenerateFollowUpSuccessResponse(
  value: GenerateFollowUpSuccessResponse | GenerateFollowUpErrorResponse,
): value is GenerateFollowUpSuccessResponse {
  if (!value || typeof value !== "object" || !("followUpQuestion" in value)) {
    return false;
  }

  const data = value as { followUpQuestion: unknown };

  return data.followUpQuestion === null || isInterviewQuestion(data.followUpQuestion);
}

function getGenerateFollowUpErrorMessage(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return "生成追问失败，请稍后重试。";
}

function getQuestionKind(question: InterviewQuestion) {
  return question.kind === "follow_up" ? "follow_up" : "main";
}

function getFollowUpStatus(question: InterviewQuestion) {
  return question.followUpStatus === "generated" || question.followUpStatus === "skipped"
    ? question.followUpStatus
    : "pending";
}

function insertFollowUpQuestion(
  questions: InterviewQuestion[],
  mainQuestionIndex: number,
  followUpQuestion: InterviewQuestion,
) {
  const nextQuestions = questions
    .map((question, index) =>
      index === mainQuestionIndex
        ? {
            ...question,
            kind: "main" as const,
            parentQuestionId: null,
            followUpStatus: "generated" as const,
          }
        : question,
    )
    .filter((question) => question.id !== followUpQuestion.id);

  nextQuestions.splice(mainQuestionIndex + 1, 0, followUpQuestion);

  return nextQuestions;
}

function markMainQuestionFollowUpSkipped(
  questions: InterviewQuestion[],
  mainQuestionIndex: number,
) {
  return questions.map((question, index) =>
    index === mainQuestionIndex
      ? {
          ...question,
          kind: "main" as const,
          parentQuestionId: null,
          followUpStatus: "skipped" as const,
        }
      : question,
  );
}

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
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpUiState, setFollowUpUiState] = useState<FollowUpUiState>({
    status: "idle",
    mainQuestionId: null,
  });
  const questions =
    session.questions.length > 0 ? session.questions : MOCK_INTERVIEW_QUESTIONS;
  const maxQuestionIndex = questions.length - 1;
  const mainQuestionOrderMap = useMemo(() => {
    const nextOrderMap = new Map<string, number>();
    let nextMainQuestionOrder = 0;

    questions.forEach((question) => {
      if (getQuestionKind(question) === "main") {
        nextMainQuestionOrder += 1;
        nextOrderMap.set(question.id, nextMainQuestionOrder);
      }
    });

    return nextOrderMap;
  }, [questions]);

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
  const currentQuestionKind = getQuestionKind(currentQuestion);
  const currentMainQuestionOrder =
    currentQuestionKind === "main"
      ? mainQuestionOrderMap.get(currentQuestion.id) ?? session.currentQuestionIndex + 1
      : null;
  const currentParentMainOrder =
    currentQuestion.parentQuestionId != null
      ? mainQuestionOrderMap.get(currentQuestion.parentQuestionId) ?? null
      : null;
  const currentFollowUpHint =
    currentQuestionKind === "follow_up"
      ? currentQuestion.followUpHint?.trim() ?? ""
      : "";
  const currentAnswer =
    session.answers.find((item) => item.questionId === currentQuestion.id)?.answer ??
    "";
  const progressWidth = `${((session.currentQuestionIndex + 1) / questions.length) * 100}%`;
  const isLastQuestion = session.currentQuestionIndex === questions.length - 1;
  const shouldAttemptFollowUp =
    currentQuestionKind === "main" &&
    currentAnswer.trim().length > 0 &&
    getFollowUpStatus(currentQuestion) === "pending";
  const answeredCount = useMemo(
    () =>
      questions.filter((question) =>
        Boolean(
          session.answers.find((item) => item.questionId === question.id)?.answer.trim(),
        ),
      ).length,
    [questions, session.answers],
  );
  const followUpUiMainQuestionOrder =
    followUpUiState.mainQuestionId != null
      ? mainQuestionOrderMap.get(followUpUiState.mainQuestionId) ?? null
      : null;
  const followUpUiNotice =
    followUpUiState.status === "idle"
      ? null
      : followUpUiState.status === "checking"
        ? {
            title: "正在判断是否追加追问",
            description: `系统正在根据主问题${
              followUpUiMainQuestionOrder != null ? ` ${followUpUiMainQuestionOrder}` : ""
            }的回答决定是否生成 1 道追问，请稍候。`,
            className:
              "rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600",
          }
        : followUpUiState.status === "inserted"
          ? {
              title: "已追加 1 道追问",
              description: `这道追问来自主问题${
                followUpUiMainQuestionOrder != null
                  ? ` ${followUpUiMainQuestionOrder}`
                  : ""
              }，请继续补充刚才回答里的关键细节。`,
              className:
                "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700",
            }
          : followUpUiState.status === "none"
            ? {
                title: "本题未追加追问",
                description: `主问题${
                  followUpUiMainQuestionOrder != null
                    ? ` ${followUpUiMainQuestionOrder}`
                    : ""
                }的回答无需继续深挖，系统已进入下一题。`,
                className:
                  "rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600",
              }
            : {
                title: "追问生成失败，已继续后续流程",
                description:
                  "这次没有成功生成追问，但当前回答已经保留，系统不会阻塞后续题目与报告流程。",
                className:
                  "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600",
              };

  function persistSession(nextSession: InterviewSession) {
    setSession(nextSession);

    if (hasValidSetup) {
      saveInterviewSession(nextSession);
    }
  }

  function handleAnswerChange(value: string) {
    if (followUpUiState.status !== "checking" && followUpUiState.status !== "idle") {
      setFollowUpUiState({
        status: "idle",
        mainQuestionId: null,
      });
    }

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

  function moveToNextQuestionOrReport(nextSession: InterviewSession) {
    const nextIndex = nextSession.currentQuestionIndex + 1;

    if (nextIndex > nextSession.questions.length - 1) {
      persistSession({
        ...nextSession,
        currentQuestionIndex: Math.max(nextSession.questions.length - 1, 0),
      });
      router.push("/report");
      return;
    }

    persistSession({
      ...nextSession,
      currentQuestionIndex: nextIndex,
    });
  }

  function goToQuestion(index: number) {
    setFollowUpUiState({
      status: "idle",
      mainQuestionId: null,
    });
    setSession((currentSession) => ({
      ...currentSession,
      currentQuestionIndex: Math.max(
        INTERVIEW_SESSION_INITIAL_VALUES.currentQuestionIndex,
        Math.min(index, maxQuestionIndex),
      ),
    }));
  }

  async function handleNextStep() {
    if (currentQuestionKind === "follow_up") {
      setFollowUpUiState({
        status: "idle",
        mainQuestionId: null,
      });
      moveToNextQuestionOrReport(session);
      return;
    }

    if (!currentAnswer.trim()) {
      setFollowUpUiState({
        status: "idle",
        mainQuestionId: null,
      });
      moveToNextQuestionOrReport(session);
      return;
    }

    if (getFollowUpStatus(currentQuestion) !== "pending") {
      setFollowUpUiState({
        status: "idle",
        mainQuestionId: null,
      });
      moveToNextQuestionOrReport(session);
      return;
    }

    try {
      setIsGeneratingFollowUp(true);
      setFollowUpUiState({
        status: "checking",
        mainQuestionId: currentQuestion.id,
      });
      const { reusableAnalysis, reusableJdMatch } = getReusableResumeContext({
        resume: setupForm.resume,
        jd: setupForm.jd,
      });
      const response = await fetch("/api/generate-follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: setupForm.resume,
          jd: setupForm.jd,
          analysis: reusableAnalysis,
          jdMatch: reusableJdMatch,
          mainQuestionId: currentQuestion.id,
          mainQuestion: currentQuestion.question,
          mainAnswer: currentAnswer,
        }),
      });
      const result = (await response.json()) as
        | GenerateFollowUpSuccessResponse
        | GenerateFollowUpErrorResponse;

      if (!response.ok) {
        throw new Error(getGenerateFollowUpErrorMessage(result));
      }

      if (!isGenerateFollowUpSuccessResponse(result)) {
        throw new Error("返回的追问结果格式不正确，请稍后重试。");
      }

      if (result.followUpQuestion) {
        setFollowUpUiState({
          status: "inserted",
          mainQuestionId: currentQuestion.id,
        });
        const nextQuestions = insertFollowUpQuestion(
          session.questions,
          session.currentQuestionIndex,
          result.followUpQuestion,
        );

        persistSession({
          ...session,
          questions: nextQuestions,
          currentQuestionIndex: session.currentQuestionIndex + 1,
        });
        return;
      }
    } catch {
      setFollowUpUiState({
        status: "failed",
        mainQuestionId: currentQuestion.id,
      });
      const nextQuestions = markMainQuestionFollowUpSkipped(
        session.questions,
        session.currentQuestionIndex,
      );

      moveToNextQuestionOrReport({
        ...session,
        questions: nextQuestions,
      });
      return;
    } finally {
      setIsGeneratingFollowUp(false);
    }

    setFollowUpUiState({
      status: "none",
      mainQuestionId: currentQuestion.id,
    });
    const nextQuestions = markMainQuestionFollowUpSkipped(
      session.questions,
      session.currentQuestionIndex,
    );

    moveToNextQuestionOrReport({
      ...session,
      questions: nextQuestions,
    });
  }

  if (!hasValidSetup) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="还没有可用的面试信息"
            description="请先返回分析页确认岗位 JD 和简历内容，再开始新的模拟面试主流程。"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/analysis"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              返回分析页
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
          description="这里会基于当前岗位与简历逐题作答；主问题回答后，系统可能追加 1 道追问，并继续进入后续复盘与历史链路。"
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
            <div className="flex flex-wrap items-center gap-3">
              {currentQuestionKind === "follow_up" ? (
                <>
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    追问
                  </span>
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500">
                    关联主问题 {currentParentMainOrder ?? "未知"}
                  </span>
                </>
              ) : (
                <span className="inline-flex rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                  主问题 {currentMainQuestionOrder}
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">
              {currentQuestion.question}
            </h2>
            {currentQuestionKind === "follow_up" ? (
              <p className="mt-2 text-sm text-zinc-500">
                这是基于你上一道主问题回答追加的补充追问。
              </p>
            ) : null}
            {currentFollowUpHint ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                追问提示：{currentFollowUpHint}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-100 px-4 py-3">
            <p className="text-sm text-zinc-500">
              已完成 {answeredCount} / {questions.length} 题
            </p>
            <div className="text-right text-sm text-zinc-500">
              <p>当前回答 {currentAnswer.length} 字</p>
              <p className="mt-1">
                {currentQuestionKind === "follow_up" ? "当前题型：追问" : "当前题型：主问题"}
              </p>
            </div>
          </div>
        </section>

        {followUpUiNotice ? (
          <section className={followUpUiNotice.className}>
            <p className="font-medium">{followUpUiNotice.title}</p>
            <p className="mt-1">{followUpUiNotice.description}</p>
          </section>
        ) : null}

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <label
              htmlFor="answer-content"
              className="text-sm font-medium text-zinc-800"
            >
              {currentQuestionKind === "follow_up" ? "你的补充回答" : "你的回答"}
            </label>
            <textarea
              id="answer-content"
              value={currentAnswer}
              onChange={(event) => handleAnswerChange(event.target.value)}
              placeholder="请输入你的回答"
              disabled={isGeneratingFollowUp}
              className="min-h-56 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100"
            />
            <p className="text-sm text-zinc-500">
              {currentQuestionKind === "follow_up"
                ? "请围绕上一道主问题继续补充细节；答案会自动保存在本地浏览器中。"
                : "当前允许留空切换题目，答案会自动保存在本地浏览器中。"}
            </p>
            {isGeneratingFollowUp ? (
              <p className="text-sm text-zinc-500">
                正在根据当前主问题回答判断是否需要追加追问，期间会暂时锁定输入与切题操作...
              </p>
            ) : null}
          </div>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => goToQuestion(session.currentQuestionIndex - 1)}
            disabled={
              isGeneratingFollowUp ||
              session.currentQuestionIndex ===
                INTERVIEW_SESSION_INITIAL_VALUES.currentQuestionIndex
            }
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-400"
          >
            上一题
          </button>

          <button
            type="button"
            onClick={() => void handleNextStep()}
            disabled={isGeneratingFollowUp}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {isGeneratingFollowUp
              ? "正在判断追问..."
              : !shouldAttemptFollowUp && isLastQuestion
                ? "查看报告"
                : "下一题"}
          </button>
        </section>
      </div>
    </PageContainer>
  );
}
