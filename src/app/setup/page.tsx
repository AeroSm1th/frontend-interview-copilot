"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { SETUP_FORM_LIMITS } from "@/lib/constants";
import {
  clearInterviewSession,
  clearInterviewReport,
  readResumeAnalysis,
  readResumeDraft,
  readResumeJdDraft,
  readResumeJdMatch,
  readSetupForm,
  saveInterviewSession,
  saveSetupForm,
} from "@/lib/storage";
import { validateSetupForm } from "@/lib/validation";
import type {
  InterviewQuestion,
  SetupFormData,
  SetupFormField,
} from "@/types/interview";

type GenerateQuestionsSuccessResponse = {
  questions: InterviewQuestion[];
};

type GenerateQuestionsErrorResponse = {
  message?: string;
};

function isGenerateQuestionsSuccessResponse(
  value: GenerateQuestionsSuccessResponse | GenerateQuestionsErrorResponse,
): value is GenerateQuestionsSuccessResponse {
  return Array.isArray((value as GenerateQuestionsSuccessResponse).questions);
}

function getGenerateQuestionsErrorMessage(
  value: GenerateQuestionsSuccessResponse | GenerateQuestionsErrorResponse,
) {
  if ("message" in value && typeof value.message === "string") {
    return value.message;
  }

  return "生成题目失败，请稍后重试。";
}

export default function SetupPage() {
  const router = useRouter();
  const hasSavedDraft = useRef(false);
  const [formData, setFormData] = useState<SetupFormData>(() => readSetupForm());
  const [touchedFields, setTouchedFields] = useState<
    Record<SetupFormField, boolean>
  >({
    jd: false,
    resume: false,
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!hasSavedDraft.current) {
      hasSavedDraft.current = true;
      return;
    }

    saveSetupForm(formData);
  }, [formData]);

  const validationResult = validateSetupForm(formData);

  function handleChange(field: SetupFormField, value: string) {
    if (submitError) {
      setSubmitError("");
    }

    setFormData((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleBlur(field: SetupFormField) {
    setTouchedFields((currentFields) => ({
      ...currentFields,
      [field]: true,
    }));
  }

  function shouldShowError(field: SetupFormField) {
    return (
      (touchedFields[field] || hasSubmitted) &&
      Boolean(validationResult.errors[field])
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    setSubmitError("");

    if (!validationResult.isValid) {
      setTouchedFields({
        jd: true,
        resume: true,
      });
      return;
    }

    try {
      setIsGeneratingQuestions(true);
      clearInterviewSession();
      clearInterviewReport();
      const currentResumeDraft = readResumeDraft();
      const currentResumeAnalysis = readResumeAnalysis();
      const currentResumeJdDraft = readResumeJdDraft();
      const currentResumeJdMatch = readResumeJdMatch();
      const reusableAnalysis =
        formData.resume === currentResumeDraft && currentResumeAnalysis
          ? currentResumeAnalysis
          : undefined;
      const reusableJdMatch =
        formData.resume === currentResumeDraft &&
        formData.jd === currentResumeJdDraft &&
        currentResumeJdMatch
          ? currentResumeJdMatch
          : undefined;

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
      setSubmitError(
        error instanceof Error ? error.message : "生成题目失败，请稍后重试。",
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <PageHeader
          title="填写目标岗位信息"
          description="请先完善岗位 JD 和简历内容。当前版本只处理前端表单、校验和本地草稿保存。"
        />

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="job-description"
                  className="text-sm font-medium text-zinc-800"
                >
                  目标岗位 JD
                </label>
                <span className="text-xs text-zinc-500">
                  {formData.jd.length} 字 / 至少 {SETUP_FORM_LIMITS.jdMinLength} 字
                </span>
              </div>
              <textarea
                id="job-description"
                name="jd"
                placeholder="请粘贴岗位描述内容"
                value={formData.jd}
                onChange={(event) => handleChange("jd", event.target.value)}
                onBlur={() => handleBlur("jd")}
                aria-invalid={shouldShowError("jd")}
                className={`min-h-40 w-full rounded-2xl border px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 ${
                  shouldShowError("jd")
                    ? "border-red-300 bg-red-50/60"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              />
              {shouldShowError("jd") ? (
                <p className="text-sm text-red-600">{validationResult.errors.jd}</p>
              ) : (
                <p className="text-sm text-zinc-500">
                  建议粘贴完整的岗位职责、技术要求和加分项。
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="resume-content"
                  className="text-sm font-medium text-zinc-800"
                >
                  简历内容
                </label>
                <span className="text-xs text-zinc-500">
                  {formData.resume.length} 字 / 至少{" "}
                  {SETUP_FORM_LIMITS.resumeMinLength} 字
                </span>
              </div>
              <textarea
                id="resume-content"
                name="resume"
                placeholder="请粘贴你的简历内容"
                value={formData.resume}
                onChange={(event) => handleChange("resume", event.target.value)}
                onBlur={() => handleBlur("resume")}
                aria-invalid={shouldShowError("resume")}
                className={`min-h-48 w-full rounded-2xl border px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 ${
                  shouldShowError("resume")
                    ? "border-red-300 bg-red-50/60"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              />
              {shouldShowError("resume") ? (
                <p className="text-sm text-red-600">
                  {validationResult.errors.resume}
                </p>
              ) : (
                <p className="text-sm text-zinc-500">
                  建议包含项目经历、技术栈和你负责的具体工作。
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-zinc-500">
                  输入内容会自动保存在当前浏览器中。
                </p>
                {submitError ? (
                  <p className="text-sm text-red-600">{submitError}</p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={!validationResult.isValid || isGeneratingQuestions}
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
              >
                {isGeneratingQuestions ? "正在生成题目..." : "开始模拟面试"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}
