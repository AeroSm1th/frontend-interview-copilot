"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ResumeAnalysisResult } from "@/components/resume/resume-analysis-result";
import { ResumeChatPanel } from "@/components/resume/resume-chat-panel";
import { ResumeJdMatchPanel } from "@/components/resume/resume-jd-match-panel";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import {
  getJdValidationMessage,
  getResumeFileReadErrorMessage,
  getResumeFileValidationMessage,
  getResumeValidationMessage,
} from "@/lib/resume-input";
import { getReusableResumeContext } from "@/lib/resume-context";
import { createSourceSignature } from "@/lib/source-signature";
import {
  clearInterviewReport,
  clearInterviewSession,
  clearResumeAnalysis,
  clearResumeChatMessages,
  clearResumeDraft,
  clearResumeJdDraft,
  clearResumeJdMatch,
  readResumeAnalysis,
  readResumeChatMessages,
  readResumeDraft,
  readResumeJdDraft,
  readResumeJdMatch,
  saveInterviewSession,
  saveResumeAnalysisCache,
  saveResumeChatMessages,
  saveResumeDraft,
  saveResumeJdDraft,
  saveResumeJdMatchCache,
  saveSetupForm,
} from "@/lib/storage";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewQuestion } from "@/types/interview";
import type {
  ResumeAnalysis,
  ResumeChatMessage,
  ResumeJdMatch,
} from "@/types/resume";

type AnalyzeResumeErrorResponse = {
  message?: string;
};

type ResumeChatErrorResponse = {
  message?: string;
};

type ResumeChatStreamEvent =
  | {
      type: "delta";
      content: string;
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      message: string;
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

function getResumeChatErrorMessage(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return "简历对话失败，请稍后重试。";
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

function createResumeChatMessage(
  role: ResumeChatMessage["role"],
  content: string,
): ResumeChatMessage {
  const fallbackId = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: globalThis.crypto?.randomUUID?.() ?? fallbackId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function parseResumeChatStreamEvent(value: string): ResumeChatStreamEvent | null {
  const dataLine = value
    .split("\n")
    .find((line) => line.startsWith("data: "));

  if (!dataLine) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(dataLine.slice(6));

    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    if ("type" in parsedValue && parsedValue.type === "done") {
      return {
        type: "done",
      };
    }

    if (
      "type" in parsedValue &&
      parsedValue.type === "delta" &&
      "content" in parsedValue &&
      typeof parsedValue.content === "string"
    ) {
      return {
        type: "delta",
        content: parsedValue.content,
      };
    }

    if (
      "type" in parsedValue &&
      parsedValue.type === "error" &&
      "message" in parsedValue &&
      typeof parsedValue.message === "string"
    ) {
      return {
        type: "error",
        message: parsedValue.message,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function AnalysisWorkspace() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [jdText, setJdText] = useState("");
  const [jdMatch, setJdMatch] = useState<ResumeJdMatch | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasSubmittedJdMatch, setHasSubmittedJdMatch] = useState(false);
  const [hasAttemptedInterviewStart, setHasAttemptedInterviewStart] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [jdMatchError, setJdMatchError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [interviewStartError, setInterviewStartError] = useState("");
  const [lastImportedFileName, setLastImportedFileName] = useState("");
  const [chatMessages, setChatMessages] = useState<ResumeChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isChatSidebarCollapsed, setIsChatSidebarCollapsed] = useState(false);
  const [isChatSheetOpen, setIsChatSheetOpen] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const validationMessage = getResumeValidationMessage(resumeText);
  const jdValidationMessage = getJdValidationMessage(jdText);
  const shouldShowValidationError =
    Boolean(validationMessage) &&
    (hasSubmitted || hasAttemptedInterviewStart || resumeText.trim().length > 0);
  const shouldShowJdValidationError =
    Boolean(jdValidationMessage) &&
    (hasSubmittedJdMatch || hasAttemptedInterviewStart || jdText.trim().length > 0);
  const hasReadyResume = resumeText.trim().length > 0;
  const canUseChat = Boolean(analysis) && hasReadyResume;
  const canUseJdMatch = hasReadyResume;
  const isWorkspaceBusy =
    isAnalyzing || isChatting || isMatching || isGeneratingQuestions;
  const shouldShowInitialLoadingState = isHydrated && isAnalyzing && !analysis;
  const shouldShowRefreshingState = isHydrated && isAnalyzing && Boolean(analysis);
  const shouldShowSubmitFailureState =
    isHydrated && !isAnalyzing && !analysis && Boolean(submitError);
  const shouldShowEmptyState =
    isHydrated && !isAnalyzing && !analysis && !submitError;
  const shouldShowJdMatchPanel = isHydrated && canUseJdMatch;
  const shouldShowChatPanel = isHydrated && canUseChat;
  const shouldShowNextStepCard = isHydrated && hasReadyResume;

  useEffect(() => {
    const nextResumeText = readResumeDraft();
    const nextAnalysis = readResumeAnalysis();
    const nextJdText = readResumeJdDraft();
    const nextJdMatch = readResumeJdMatch();
    const nextChatMessages = readResumeChatMessages();

    setResumeText(nextResumeText);
    setAnalysis(nextAnalysis);
    setJdText(nextJdText);

    if (nextResumeText.trim().length > 0 && nextAnalysis) {
      setChatMessages(nextChatMessages);
    } else {
      clearResumeChatMessages();
    }

    if (nextResumeText.trim().length > 0 && nextJdText.trim().length > 0 && nextJdMatch) {
      setJdMatch(nextJdMatch);
    } else {
      clearResumeJdMatch();
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (shouldShowChatPanel) {
      return;
    }

    setIsChatSidebarCollapsed(false);
    setIsChatSheetOpen(false);
    setStreamingMessageId(null);
  }, [shouldShowChatPanel]);

  function clearResumeChatState() {
    setChatMessages([]);
    setChatInput("");
    setChatError("");
    setStreamingMessageId(null);
    clearResumeChatMessages();
  }

  function clearResumeJdMatchState() {
    setJdMatch(null);
    setJdMatchError("");
    setHasSubmittedJdMatch(false);
    clearResumeJdMatch();
  }

  function applyResumeText(value: string) {
    const hasResumeChanged = value !== resumeText;

    setResumeText(value);
    saveResumeDraft(value);

    if (submitError) {
      setSubmitError("");
    }

    if (uploadError) {
      setUploadError("");
    }

    if (chatError) {
      setChatError("");
    }

    if (jdMatchError) {
      setJdMatchError("");
    }

    if (interviewStartError) {
      setInterviewStartError("");
    }

    if (hasResumeChanged && analysis) {
      clearResumeChatState();
      clearResumeJdMatchState();
      setAnalysis(null);
      clearResumeAnalysis();
    } else if (hasResumeChanged && chatMessages.length > 0) {
      clearResumeChatState();
    }

    if (hasResumeChanged && jdMatch) {
      clearResumeJdMatchState();
    }
  }

  function handleResumeChange(value: string) {
    applyResumeText(value);
  }

  function handleJdChange(value: string) {
    const hasJdChanged = value !== jdText;

    setJdText(value);
    saveResumeJdDraft(value);

    if (jdMatchError) {
      setJdMatchError("");
    }

    if (interviewStartError) {
      setInterviewStartError("");
    }

    if (hasJdChanged && jdMatch) {
      clearResumeJdMatchState();
    }
  }

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setUploadError("");

    const validationError = getResumeFileValidationMessage(file);

    if (validationError) {
      setUploadError(validationError);
      input.value = "";
      return;
    }

    try {
      const fileContent = await file.text();

      if (fileContent.trim().length === 0) {
        throw new Error("文件内容为空，请检查后重试。");
      }

      applyResumeText(fileContent);
      setLastImportedFileName(file.name);
    } catch (error) {
      setUploadError(getResumeFileReadErrorMessage(error));
    } finally {
      input.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    setSubmitError("");

    if (validationMessage) {
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
      clearResumeChatState();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "简历分析失败，请稍后重试。",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleClear() {
    setResumeText("");
    setAnalysis(null);
    setJdText("");
    setSubmitError("");
    setJdMatchError("");
    setUploadError("");
    setInterviewStartError("");
    setLastImportedFileName("");
    setHasSubmitted(false);
    setHasSubmittedJdMatch(false);
    setHasAttemptedInterviewStart(false);
    setIsChatSidebarCollapsed(false);
    setIsChatSheetOpen(false);
    clearResumeDraft();
    clearResumeAnalysis();
    clearResumeJdDraft();
    clearResumeJdMatchState();
    clearResumeChatState();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleChatInputChange(value: string) {
    setChatInput(value);

    if (chatError) {
      setChatError("");
    }
  }

  function handleChatShortcutClick(question: string) {
    setChatInput(question);

    if (chatError) {
      setChatError("");
    }
  }

  async function handleChatSend() {
    const question = chatInput.trim();

    if (!question) {
      return;
    }

    if (!analysis || resumeText.trim().length === 0) {
      setChatError("请先提供简历内容并完成简历分析。");
      return;
    }

    const previousMessages = chatMessages;
    const userMessage = createResumeChatMessage("user", question);
    const assistantPlaceholder = createResumeChatMessage("assistant", "");

    try {
      setIsChatting(true);
      setChatError("");
      setChatInput("");
      setStreamingMessageId(assistantPlaceholder.id);
      setChatMessages([
        ...previousMessages,
        userMessage,
        assistantPlaceholder,
      ]);

      const response = await fetch("/api/resume-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: resumeText,
          analysis,
          messages: previousMessages,
          question,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as ResumeChatErrorResponse;

        throw new Error(getResumeChatErrorMessage(result));
      }

      if (!response.body) {
        throw new Error("未收到可读取的聊天响应流，请稍后重试。");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantReply = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          const event = parseResumeChatStreamEvent(eventChunk);

          if (!event) {
            continue;
          }

          if (event.type === "error") {
            throw new Error(event.message);
          }

          if (event.type === "delta") {
            assistantReply += event.content;
            setChatMessages([
              ...previousMessages,
              userMessage,
              {
                ...assistantPlaceholder,
                content: assistantReply,
              },
            ]);
          }
        }
      }

      buffer += decoder.decode();

      if (buffer.trim()) {
        const trailingEvents = buffer.split("\n\n");

        for (const eventChunk of trailingEvents) {
          const event = parseResumeChatStreamEvent(eventChunk);

          if (!event) {
            continue;
          }

          if (event.type === "error") {
            throw new Error(event.message);
          }

          if (event.type === "delta") {
            assistantReply += event.content;
          }
        }
      }

      const finalReply = assistantReply.trim();

      if (!finalReply) {
        throw new Error("AI 没有返回有效回复，请稍后重试。");
      }

      const nextMessages = [
        ...previousMessages,
        userMessage,
        {
          ...assistantPlaceholder,
          content: finalReply,
        },
      ];

      setChatMessages(nextMessages);
      saveResumeChatMessages(nextMessages);
    } catch (error) {
      setChatMessages(previousMessages);
      setChatInput(question);
      setChatError(
        error instanceof Error ? error.message : "简历对话失败，请稍后重试。",
      );
    } finally {
      setStreamingMessageId(null);
      setIsChatting(false);
    }
  }

  async function handleJdMatchSubmit() {
    setHasSubmittedJdMatch(true);
    setJdMatchError("");

    if (jdValidationMessage) {
      return;
    }

    if (resumeText.trim().length === 0) {
      setJdMatchError("请先提供简历内容。");
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
    setHasAttemptedInterviewStart(true);
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

  function handleToggleChatSidebar() {
    setIsChatSidebarCollapsed((currentValue) => !currentValue);
  }

  function handleOpenChatSheet() {
    setIsChatSheetOpen(true);
  }

  function handleCloseChatSheet() {
    setIsChatSheetOpen(false);
  }

  if (!isHydrated) {
    return (
      <PageContainer className="flex items-center">
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

  if (isHydrated && !hasReadyResume) {
    return (
      <PageContainer className="flex items-center">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <PageHeader
            title="还没有可分析的简历草稿"
            description="分析工作台会读取当前浏览器中的 resumeDraft。请先去简历页输入或导入一份简历，再回来继续做分析、JD 匹配和模拟面试准备。"
          />
          <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
            第一阶段会尽量复用现有缓存与上下文逻辑，所以这里仍然会沿用本地简历草稿、分析缓存、JD 草稿和聊天记录。
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/resume"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              前往简历页
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
    <PageContainer className="justify-center">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <PageHeader
          title="分析工作台"
          description="这里接住新的主流程第二步：基于当前简历草稿做简历分析、JD 匹配和简历聊天，并直接开始模拟面试。第一阶段优先保证链路稳定，可继续沿用现有缓存与组件。"
        />

        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="resume-analysis-content"
                  className="text-sm font-medium text-zinc-800"
                >
                  当前简历草稿
                </label>
                <span className="text-xs text-zinc-500">
                  {resumeText.length} 字
                </span>
              </div>

              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-800">
                      继续调整简历草稿
                    </p>
                    <p className="text-xs text-zinc-500">
                      第一阶段为了稳定迁移，分析页仍然允许你直接微调当前简历草稿；如果想回到更简洁的输入页，也可以返回
                      /resume。
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href="/resume"
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      返回 /resume
                    </Link>
                    <div className="flex items-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".md,text/markdown"
                        onChange={handleFileImport}
                        disabled={isWorkspaceBusy}
                        className="sr-only"
                        tabIndex={-1}
                      />
                      <button
                        type="button"
                        onClick={handleOpenFilePicker}
                        disabled={isWorkspaceBusy}
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-400"
                      >
                        重新导入 .md
                      </button>
                    </div>
                  </div>
                </div>

                {uploadError ? (
                  <p className="mt-3 text-sm text-red-600">{uploadError}</p>
                ) : lastImportedFileName ? (
                  <p className="mt-3 break-all text-sm text-zinc-500">
                    已导入 {lastImportedFileName}，内容已回填到下方文本框。
                  </p>
                ) : null}
              </div>

              <textarea
                id="resume-analysis-content"
                value={resumeText}
                onChange={(event) => handleResumeChange(event.target.value)}
                placeholder="请粘贴你的简历文本，建议包含项目经历、技术栈、负责内容和结果。"
                aria-invalid={shouldShowValidationError}
                disabled={isWorkspaceBusy}
                className={`min-h-72 w-full rounded-2xl border px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 ${
                  shouldShowValidationError
                    ? "border-red-300 bg-red-50/60"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              />

              {shouldShowValidationError ? (
                <p className="text-sm text-red-600">{validationMessage}</p>
              ) : (
                <p className="text-sm text-zinc-500">
                  当前草稿会自动保存在浏览器中，分析结果、JD 草稿、匹配结果和聊天记录也会尽量复用。
                </p>
              )}
            </div>

            {submitError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                {submitError}
              </div>
            ) : null}

            {interviewStartError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                {interviewStartError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-500">
                先看分析和 JD 匹配，再从这里直接开始模拟面试。新的主链路不再依赖 /setup 页面。
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isWorkspaceBusy}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-400"
                >
                  清空内容
                </button>
                <button
                  type="button"
                  onClick={handleStartInterview}
                  disabled={isWorkspaceBusy}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-400"
                >
                  {isGeneratingQuestions ? "正在生成题目..." : "开始模拟面试"}
                </button>
                <button
                  type="submit"
                  disabled={Boolean(validationMessage) || isWorkspaceBusy}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                >
                  {isAnalyzing
                    ? "正在分析..."
                    : analysis
                      ? "重新分析"
                      : "开始分析"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
          <div className="min-w-0 space-y-6">
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
                正在基于当前简历内容重新分析，完成后会覆盖本地缓存结果。
              </section>
            ) : null}

            {shouldShowSubmitFailureState ? (
              <section className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm">
                <PageHeader
                  title="分析失败"
                  description="这次没有成功拿到结构化简历分析结果。你可以保留当前内容并再次发起分析。"
                />
              </section>
            ) : null}

            {shouldShowEmptyState ? (
              <section className="rounded-[32px] border border-dashed border-zinc-300 bg-white p-8 shadow-sm">
                <PageHeader
                  title="还没有分析结果"
                  description="先点击“开始分析”，这里会展示总结、优势、风险点、改进建议和关键词。"
                />
              </section>
            ) : null}

            {isHydrated && analysis ? (
              <ResumeAnalysisResult analysis={analysis} />
            ) : null}

            {shouldShowNextStepCard ? (
              <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-zinc-900">
                      下一步：开始模拟面试
                    </h2>
                    <p className="text-sm leading-7 text-zinc-600">
                      请确认当前 JD 与简历内容已经准备好。开始后会直接生成题目并进入 /interview。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartInterview}
                    disabled={isWorkspaceBusy}
                    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                  >
                    {isGeneratingQuestions ? "正在生成题目..." : "开始模拟面试"}
                  </button>
                </div>
              </section>
            ) : null}

            {shouldShowJdMatchPanel ? (
              <ResumeJdMatchPanel
                jdText={jdText}
                match={jdMatch}
                errorMessage={jdMatchError}
                validationMessage={jdValidationMessage}
                shouldShowValidationError={shouldShowJdValidationError}
                isMatching={isMatching}
                disabled={isAnalyzing || isChatting || isGeneratingQuestions}
                onJdChange={handleJdChange}
                onSubmit={handleJdMatchSubmit}
              />
            ) : null}
          </div>

          {shouldShowChatPanel ? (
            <aside className="hidden xl:block">
              <div className="sticky top-8 h-[calc(100vh-4rem)] min-h-[560px]">
                <ResumeChatPanel
                  messages={chatMessages}
                  inputValue={chatInput}
                  errorMessage={chatError}
                  isSending={isChatting}
                  disabled={isAnalyzing || isMatching || isGeneratingQuestions}
                  isCollapsed={isChatSidebarCollapsed}
                  streamingMessageId={streamingMessageId}
                  onInputChange={handleChatInputChange}
                  onSend={handleChatSend}
                  onShortcutClick={handleChatShortcutClick}
                  onToggleCollapse={handleToggleChatSidebar}
                />
              </div>
            </aside>
          ) : null}
        </div>

        {shouldShowChatPanel && !isChatSheetOpen ? (
          <button
            type="button"
            onClick={handleOpenChatSheet}
            className="fixed bottom-6 right-4 z-30 inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 xl:hidden"
          >
            {isChatting ? "正在生成回复..." : "打开简历聊天"}
          </button>
        ) : null}

        {shouldShowChatPanel && isChatSheetOpen ? (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              type="button"
              aria-label="关闭简历聊天"
              onClick={handleCloseChatSheet}
              className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
            />

            <div className="absolute inset-x-0 bottom-0 top-20">
              <ResumeChatPanel
                mode="sheet"
                messages={chatMessages}
                inputValue={chatInput}
                errorMessage={chatError}
                isSending={isChatting}
                disabled={isAnalyzing || isMatching || isGeneratingQuestions}
                streamingMessageId={streamingMessageId}
                onInputChange={handleChatInputChange}
                onSend={handleChatSend}
                onShortcutClick={handleChatShortcutClick}
                onClose={handleCloseChatSheet}
              />
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
