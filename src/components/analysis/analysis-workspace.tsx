"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AnalysisChatController } from "@/components/analysis/analysis-chat-controller";
import { ResumeAnalysisResult } from "@/components/resume/resume-analysis-result";
import { ResumeJdMatchPanel } from "@/components/resume/resume-jd-match-panel";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { getJdValidationMessage, getResumeValidationMessage } from "@/lib/resume-input";
import { getReusableResumeContext } from "@/lib/resume-context";
import { createSourceSignature } from "@/lib/source-signature";
import {
  clearInterviewReport,
  clearInterviewSession,
  clearResumeJdMatch,
  readResumeAnalysis,
  readResumeDraft,
  readResumeJdDraft,
  readResumeJdMatch,
  saveInterviewSession,
  saveResumeAnalysisCache,
  saveResumeDraft,
  saveResumeJdDraft,
  saveResumeJdMatchCache,
  saveSetupForm,
} from "@/lib/storage";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewQuestion } from "@/types/interview";
import type { ResumeAnalysis, ResumeJdMatch } from "@/types/resume";

type AnalyzeResumeErrorResponse = {
  message?: string;
};

type AnalyzeResumeMatchErrorResponse = {
  message?: string;
};

type GenerateQuestionsSuccessResponse = {
  questions: InterviewQuestion[];
};

type GenerateQuestionsErrorResponse = {
  message?: string;
};

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResumeAnalysisResponse(value: unknown): value is ResumeAnalysis {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.summary === "string" &&
    isStringArray(data.strengths) &&
    isStringArray(data.risks) &&
    isStringArray(data.suggestedImprovements) &&
    isStringArray(data.keywords)
  );
}

function isResumeJdMatchResponse(value: unknown): value is ResumeJdMatch {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.matchScore === "number" &&
    Number.isFinite(data.matchScore) &&
    typeof data.summary === "string" &&
    isStringArray(data.matchedSkills) &&
    isStringArray(data.missingSkills) &&
    isStringArray(data.risks) &&
    isStringArray(data.suggestions)
  );
}

function isGenerateQuestionsSuccessResponse(
  value: GenerateQuestionsSuccessResponse | GenerateQuestionsErrorResponse,
): value is GenerateQuestionsSuccessResponse {
  return Array.isArray((value as GenerateQuestionsSuccessResponse).questions);
}

function getAnalyzeResumeErrorMessage(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return "简历分析失败，请稍后重试。";
}

function getResumeMatchErrorMessage(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return "JD 匹配分析失败，请稍后重试。";
}

function getGenerateQuestionsErrorMessage(
  value: GenerateQuestionsSuccessResponse | GenerateQuestionsErrorResponse,
) {
  if ("message" in value && typeof value.message === "string") {
    return value.message;
  }

  return "生成题目失败，请稍后重试。";
}

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

function getFilledLineCount(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

type SourceSummaryCardProps = {
  title: string;
  value: string;
  emptyText: string;
  warningText?: string;
  isWarning?: boolean;
};

function SourceSummaryCard({
  title,
  value,
  emptyText,
  warningText,
  isWarning = false,
}: SourceSummaryCardProps) {
  const hasValue = value.trim().length > 0;
  const previewText = getPreviewText(value);
  const lineCount = getFilledLineCount(value);

  return (
    <article className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <span className="text-xs text-zinc-500">{value.length} 字</span>
      </div>

      {hasValue ? (
        <>
          <p
            className={`mt-4 rounded-2xl px-4 py-4 text-sm leading-7 ${
              isWarning
                ? "border border-amber-200 bg-amber-50 text-amber-700"
                : "bg-white text-zinc-600"
            }`}
          >
            {previewText}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-full bg-white px-3 py-1">{lineCount} 段内容</span>
            <span className="rounded-full bg-white px-3 py-1">来源于 /resume</span>
          </div>
          {warningText ? (
            <p className="mt-4 text-sm text-amber-700">{warningText}</p>
          ) : null}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-4 text-sm leading-7 text-zinc-500">
          {emptyText}
        </div>
      )}
    </article>
  );
}

export function AnalysisWorkspace() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [jdText, setJdText] = useState("");
  const [jdMatch, setJdMatch] = useState<ResumeJdMatch | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [jdMatchError, setJdMatchError] = useState("");
  const [interviewStartError, setInterviewStartError] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [chatResetSignal, setChatResetSignal] = useState(0);

  const resumeValidationMessage = getResumeValidationMessage(resumeText);
  const jdValidationMessage = getJdValidationMessage(jdText);
  const hasResumeDraft = resumeText.trim().length > 0;
  const hasValidResumeDraft = hasResumeDraft && !resumeValidationMessage;
  const hasJdDraft = jdText.trim().length > 0;
  const hasValidJdDraft = hasJdDraft && !jdValidationMessage;
  const canUseChat = Boolean(analysis) && hasValidResumeDraft;
  const isWorkspaceBusy =
    isAnalyzing || isChatting || isMatching || isGeneratingQuestions;
  const shouldShowInitialLoadingState = isHydrated && isAnalyzing && !analysis;
  const shouldShowRefreshingState = isHydrated && isAnalyzing && Boolean(analysis);
  const shouldShowSubmitFailureState =
    isHydrated && !isAnalyzing && !analysis && Boolean(submitError);
  const shouldShowEmptyState =
    isHydrated && !isAnalyzing && !analysis && !submitError;
  const shouldShowJdMatchPanel = isHydrated && hasValidResumeDraft;
  const shouldShowNextStepCard = isHydrated && hasValidResumeDraft;

  useEffect(() => {
    const nextResumeText = readResumeDraft();
    const nextAnalysis = readResumeAnalysis();
    const nextJdText = readResumeJdDraft();
    const nextJdMatch = readResumeJdMatch();

    setResumeText(nextResumeText);
    setAnalysis(nextAnalysis);
    setJdText(nextJdText);

    if (nextResumeText.trim().length > 0 && nextJdText.trim().length > 0 && nextJdMatch) {
      setJdMatch(nextJdMatch);
    } else {
      clearResumeJdMatch();
    }

    setIsHydrated(true);
  }, []);

  async function handleAnalyze() {
    setSubmitError("");

    if (!hasValidResumeDraft) {
      return;
    }

    try {
      setIsAnalyzing(true);

      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: resumeText,
        }),
      });
      const result = (await response.json()) as
        | ResumeAnalysis
        | AnalyzeResumeErrorResponse;

      if (!response.ok) {
        throw new Error(getAnalyzeResumeErrorMessage(result));
      }

      if (!isResumeAnalysisResponse(result)) {
        throw new Error("返回的简历分析结果格式不正确，请稍后重试。");
      }

      setAnalysis(result);
      saveResumeDraft(resumeText);
      saveResumeAnalysisCache({
        result,
        sourceSignature: createSourceSignature(resumeText),
      });
      setChatResetSignal((currentValue) => currentValue + 1);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "简历分析失败，请稍后重试。",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleJdMatchSubmit() {
    setJdMatchError("");

    if (!hasValidJdDraft) {
      return;
    }

    if (!hasValidResumeDraft) {
      setJdMatchError("请先提供可用的简历内容。");
      return;
    }

    try {
      setIsMatching(true);

      const response = await fetch("/api/analyze-resume-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: resumeText,
          analysis,
          jd: jdText,
        }),
      });
      const result = (await response.json()) as
        | ResumeJdMatch
        | AnalyzeResumeMatchErrorResponse;

      if (!response.ok) {
        throw new Error(getResumeMatchErrorMessage(result));
      }

      if (!isResumeJdMatchResponse(result)) {
        throw new Error("返回的 JD 匹配分析结果格式不正确，请稍后重试。");
      }

      setJdMatch(result);
      saveResumeJdDraft(jdText);
      saveResumeJdMatchCache({
        result,
        sourceSignature: {
          resume: createSourceSignature(resumeText),
          jd: createSourceSignature(jdText),
        },
      });
    } catch (error) {
      setJdMatchError(
        error instanceof Error ? error.message : "JD 匹配分析失败，请稍后重试。",
      );
    } finally {
      setIsMatching(false);
    }
  }

  async function handleStartInterview() {
    setInterviewStartError("");

    const formData = {
      jd: jdText,
      resume: resumeText,
    };
    const validationResult = validateSetupForm(formData);

    if (!validationResult.isValid) {
      return;
    }

    try {
      setIsGeneratingQuestions(true);
      saveResumeDraft(resumeText);
      saveResumeJdDraft(jdText);
      saveSetupForm(formData);
      clearInterviewSession();
      clearInterviewReport();

      const { reusableAnalysis, reusableJdMatch } = getReusableResumeContext({
        resume: resumeText,
        jd: jdText,
      });
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          analysis: reusableAnalysis,
          jdMatch: reusableJdMatch,
        }),
      });
      const result = (await response.json()) as
        | GenerateQuestionsSuccessResponse
        | GenerateQuestionsErrorResponse;

      if (!response.ok) {
        throw new Error(getGenerateQuestionsErrorMessage(result));
      }

      if (!isGenerateQuestionsSuccessResponse(result) || result.questions.length !== 5) {
        throw new Error("生成的题目数量不正确，请稍后重试。");
      }

      saveInterviewSession({
        questions: result.questions,
        answers: [],
        currentQuestionIndex: 0,
      });
      router.push("/interview");
    } catch (error) {
      setInterviewStartError(
        error instanceof Error ? error.message : "生成题目失败，请稍后重试。",
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  }

  if (!isHydrated) {
    return (
      <PageContainer className="flex items-center lg:min-h-full">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="正在读取分析工作台"
            description="系统正在恢复当前浏览器中的简历草稿、分析缓存、JD 草稿和聊天记录，请稍候。"
          />
          <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
            正在读取本地工作区状态...
          </div>
        </section>
      </PageContainer>
    );
  }

  if (!hasValidResumeDraft) {
    return (
      <PageContainer className="flex items-center lg:min-h-full">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title={hasResumeDraft ? "当前简历草稿还不完整" : "还没有可分析的简历草稿"}
            description={
              hasResumeDraft
                ? "分析工作台现在只消费 /resume 中准备好的简历内容。请先回到 /resume 补全简历，再回来继续做分析、JD 匹配和面试准备。"
                : "分析工作台会读取当前浏览器中的 resumeDraft。请先去 /resume 输入或导入一份简历，再回来继续做分析、JD 匹配和模拟面试准备。"
            }
          />
          <div
            className={`rounded-2xl px-5 py-4 text-sm ${
              hasResumeDraft
                ? "border border-amber-200 bg-amber-50 text-amber-700"
                : "bg-zinc-50 text-zinc-600"
            }`}
          >
            {hasResumeDraft
              ? resumeValidationMessage
              : "当前还没有找到可用的本地简历草稿。"}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/resume"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              返回 /resume 编辑
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
    <PageContainer className="justify-center lg:min-h-full">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <PageHeader
          title="分析工作台"
          description="这里接住新的主流程第二步：只消费 /resume 中已经准备好的简历和岗位信息，完成简历分析、JD 匹配、简历聊天与模拟面试准备。"
        />

        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-zinc-900">当前上下文摘要</h2>
                <p className="max-w-3xl text-sm leading-7 text-zinc-600">
                  /analysis 不再承担输入页职责。这里会直接读取当前浏览器中的
                  resumeDraft 和 resumeJdDraft，并基于这些内容继续完成分析和面试准备。
                </p>
              </div>
              <Link
                href="/resume"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                返回 /resume 编辑
              </Link>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <SourceSummaryCard
                title="Resume 摘要"
                value={resumeText}
                emptyText="当前还没有可用的简历内容。"
              />
              <SourceSummaryCard
                title="JD 摘要"
                value={jdText}
                emptyText="当前还没有岗位 JD。回到 /resume 补充后，才可以继续做 JD 匹配并开始模拟面试。"
                isWarning={hasJdDraft && !hasValidJdDraft}
                warningText={
                  hasJdDraft && !hasValidJdDraft
                    ? jdValidationMessage
                    : undefined
                }
              />
            </div>
          </div>
        </section>

        <div className="min-w-0 space-y-6">
          <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-zinc-900">简历分析</h2>
                <p className="text-sm leading-7 text-zinc-600">
                  基于当前 Resume 摘要生成结构化分析结果，帮助你先梳理优势、风险点、关键词和改进建议。
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleAnalyze()}
                disabled={isWorkspaceBusy}
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
              >
                {isAnalyzing ? "正在分析..." : analysis ? "重新分析" : "开始分析"}
              </button>
            </div>

            {submitError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                {submitError}
              </div>
            ) : null}
          </section>

          {shouldShowInitialLoadingState ? (
            <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
              <PageHeader
                title="正在分析简历"
                description="系统正在结合前端实习和校招场景提炼你的优势、风险点和改进建议，请稍候。"
              />
              <div className="mt-6 rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
                正在分析简历...
              </div>
            </section>
          ) : null}

          {shouldShowRefreshingState ? (
            <section className="rounded-[32px] border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-600 shadow-sm">
              正在基于当前 Resume 重新分析，完成后会覆盖本地缓存结果。
            </section>
          ) : null}

          {shouldShowSubmitFailureState ? (
            <section className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm">
              <PageHeader
                title="分析失败"
                description="这次没有成功拿到结构化简历分析结果。你可以保留当前上下文并再次发起分析。"
              />
            </section>
          ) : null}

          {shouldShowEmptyState ? (
            <section className="rounded-[32px] border border-dashed border-zinc-300 bg-white p-8 shadow-sm">
              <PageHeader
                title="还没有分析结果"
                description="点击上方“开始分析”后，这里会展示总结、优势、风险点、改进建议和关键词。"
              />
            </section>
          ) : null}

          {isHydrated && analysis ? (
            <ResumeAnalysisResult analysis={analysis} />
          ) : null}

          {shouldShowJdMatchPanel ? (
            <ResumeJdMatchPanel
              jdText={jdText}
              match={jdMatch}
              errorMessage={jdMatchError}
              validationMessage={jdValidationMessage}
              isMatching={isMatching}
              disabled={isAnalyzing || isChatting || isGeneratingQuestions}
              onSubmit={() => void handleJdMatchSubmit()}
            />
          ) : null}

          {shouldShowNextStepCard ? (
            <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-zinc-900">
                    下一步：开始模拟面试
                  </h2>
                  <p className="text-sm leading-7 text-zinc-600">
                    这里继续复用现有兼容逻辑：校验 JD 和简历、写入 setupForm、生成题目并初始化 interviewSession，然后进入 /interview。
                  </p>
                </div>

                {hasValidJdDraft ? (
                  <button
                    type="button"
                    onClick={() => void handleStartInterview()}
                    disabled={isWorkspaceBusy}
                    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                  >
                    {isGeneratingQuestions ? "正在生成题目..." : "开始模拟面试"}
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

              {!hasValidJdDraft ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                  {hasJdDraft
                    ? jdValidationMessage
                    : "当前还没有目标岗位 JD。分析页不再直接补录 JD，需要回到 /resume 后再开始模拟面试。"}
                </div>
              ) : null}

              {interviewStartError ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                  {interviewStartError}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <AnalysisChatController
          resumeText={resumeText}
          analysis={analysis}
          disabled={isAnalyzing || isMatching || isGeneratingQuestions}
          canUseChat={canUseChat}
          chatResetSignal={chatResetSignal}
          onChattingChange={setIsChatting}
        />
      </div>
    </PageContainer>
  );
}
