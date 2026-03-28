"use client";

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

import { ResumeAnalysisResult } from "@/components/resume/resume-analysis-result";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { RESUME_UPLOAD_LIMITS, SETUP_FORM_LIMITS } from "@/lib/constants";
import {
  clearResumeAnalysis,
  clearResumeDraft,
  readResumeAnalysis,
  readResumeDraft,
  saveResumeAnalysis,
  saveResumeDraft,
} from "@/lib/storage";
import type { ResumeAnalysis } from "@/types/resume";

type AnalyzeResumeErrorResponse = {
  message?: string;
};

function getResumeValidationMessage(resume: string) {
  const length = resume.trim().length;

  if (length === 0) {
    return "请输入简历内容。";
  }

  if (length < SETUP_FORM_LIMITS.resumeMinLength) {
    return `简历内容至少需要 ${SETUP_FORM_LIMITS.resumeMinLength} 个字符。`;
  }

  return "";
}

function isAcceptedResumeFile(file: File) {
  const normalizedFileName = file.name.toLowerCase();
  const hasAcceptedExtension = RESUME_UPLOAD_LIMITS.acceptedExtensions.some((extension) =>
    normalizedFileName.endsWith(extension),
  );
  const hasAcceptedMimeType = RESUME_UPLOAD_LIMITS.acceptedMimeTypes.some(
    (mimeType) => mimeType === file.type,
  );

  return hasAcceptedExtension || hasAcceptedMimeType;
}

function getResumeFileValidationMessage(file: File) {
  if (!isAcceptedResumeFile(file)) {
    return "只支持上传 .md 简历文件。";
  }

  if (file.size === 0) {
    return "文件内容为空，请检查后重试。";
  }

  if (file.size > RESUME_UPLOAD_LIMITS.maxFileSizeInBytes) {
    return `文件不能超过 ${RESUME_UPLOAD_LIMITS.maxFileSizeLabel}。`;
  }

  return "";
}

function getResumeFileReadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "读取文件失败，请重试。";
}

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

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [lastImportedFileName, setLastImportedFileName] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  const validationMessage = getResumeValidationMessage(resumeText);
  const shouldShowValidationError =
    Boolean(validationMessage) && (hasSubmitted || resumeText.trim().length > 0);
  const shouldShowInitialLoadingState = isHydrated && isAnalyzing && !analysis;
  const shouldShowRefreshingState = isHydrated && isAnalyzing && Boolean(analysis);
  const shouldShowSubmitFailureState =
    isHydrated && !isAnalyzing && !analysis && Boolean(submitError);
  const shouldShowEmptyState =
    isHydrated && !isAnalyzing && !analysis && !submitError;

  useEffect(() => {
    const nextResumeText = readResumeDraft();
    const nextAnalysis = readResumeAnalysis();

    setResumeText(nextResumeText);
    setAnalysis(nextAnalysis);
    setIsHydrated(true);
  }, []);

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

    if (analysis && hasResumeChanged) {
      setAnalysis(null);
      clearResumeAnalysis();
    }
  }

  function handleResumeChange(value: string) {
    applyResumeText(value);
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
      saveResumeAnalysis(result);
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
    setSubmitError("");
    setUploadError("");
    setLastImportedFileName("");
    setHasSubmitted(false);
    clearResumeDraft();
    clearResumeAnalysis();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="简历分析"
          description="粘贴简历文本后，获取一份面向前端实习和校招场景的 AI 分析结果。当前页面会优先读取浏览器中的本地草稿和分析缓存。"
        />

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="resume-analysis-content"
                  className="text-sm font-medium text-zinc-800"
                >
                  简历文本
                </label>
                <span className="text-xs text-zinc-500">
                  {resumeText.length} 字 / 至少{" "}
                  {SETUP_FORM_LIMITS.resumeMinLength} 字
                </span>
              </div>

              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-800">
                      导入 Markdown 简历
                    </p>
                    <p className="text-xs text-zinc-500">
                      支持 .md 文件，大小不超过{" "}
                      {RESUME_UPLOAD_LIMITS.maxFileSizeLabel}
                      。导入后仍可继续手动编辑。
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,text/markdown"
                      onChange={handleFileImport}
                      disabled={isAnalyzing}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={handleOpenFilePicker}
                      disabled={isAnalyzing}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-400"
                    >
                      选择 .md 文件
                    </button>
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
                disabled={isAnalyzing}
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
                  输入内容会自动保存在当前浏览器中，刷新页面后会优先恢复草稿和最近一次分析结果。
                </p>
              )}
            </div>

            {submitError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClear}
                disabled={isAnalyzing}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-400"
              >
                清空内容
              </button>
              <button
                type="submit"
                disabled={Boolean(validationMessage) || isAnalyzing}
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
              >
                {isAnalyzing
                  ? "正在分析..."
                  : analysis
                    ? "重新分析"
                    : "开始分析"}
              </button>
            </div>
          </form>
        </section>

        {shouldShowInitialLoadingState ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
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
          <section className="rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-600 shadow-sm">
            正在基于当前简历内容重新分析，完成后会覆盖本地缓存结果。
          </section>
        ) : null}

        {shouldShowSubmitFailureState ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <PageHeader
              title="分析失败"
              description="这次没有成功拿到结构化简历分析结果。你可以保留当前内容并再次发起分析。"
            />
          </section>
        ) : null}

        {shouldShowEmptyState ? (
          <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-8 shadow-sm">
            <PageHeader
              title="还没有分析结果"
              description="先粘贴一份简历文本并点击“开始分析”，这里会展示总结、优势、风险点、改进建议和关键词。"
            />
          </section>
        ) : null}

        {isHydrated && analysis ? (
          <ResumeAnalysisResult analysis={analysis} />
        ) : null}
      </div>
    </PageContainer>
  );
}
