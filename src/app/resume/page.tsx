"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { RESUME_UPLOAD_LIMITS } from "@/lib/constants";
import {
  getResumeFileReadErrorMessage,
  getResumeFileValidationMessage,
  getResumeValidationMessage,
} from "@/lib/resume-input";
import {
  clearResumeAnalysis,
  clearResumeChatMessages,
  clearResumeDraft,
  clearResumeJdMatch,
  readResumeDraft,
  saveResumeDraft,
} from "@/lib/storage";

export default function ResumePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeText, setResumeText] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [lastImportedFileName, setLastImportedFileName] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  const validationMessage = getResumeValidationMessage(resumeText);
  const shouldShowValidationError = Boolean(validationMessage) && resumeText.trim().length > 0;
  const hasResumeDraft = resumeText.trim().length > 0;

  useEffect(() => {
    setResumeText(readResumeDraft());
    setIsHydrated(true);
  }, []);

  function applyResumeText(value: string) {
    const hasResumeChanged = value !== resumeText;

    setResumeText(value);
    saveResumeDraft(value);

    if (uploadError) {
      setUploadError("");
    }

    if (hasResumeChanged) {
      clearResumeAnalysis();
      clearResumeChatMessages();
      clearResumeJdMatch();
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

  function handleClear() {
    setResumeText("");
    setUploadError("");
    setLastImportedFileName("");
    clearResumeDraft();
    clearResumeAnalysis();
    clearResumeChatMessages();
    clearResumeJdMatch();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <PageContainer className="justify-center">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <PageHeader
          title="简历输入页"
          description="新的第一步只负责准备简历草稿。你可以直接粘贴文本或导入 .md 文件，内容会自动保存到当前浏览器中，然后进入 /analysis 继续做分析、JD 匹配和简历聊天。"
        />

        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="resume-draft-content"
                  className="text-sm font-medium text-zinc-800"
                >
                  简历草稿
                </label>
                <span className="text-xs text-zinc-500">{resumeText.length} 字</span>
              </div>

              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-800">导入 Markdown 简历</p>
                    <p className="text-xs text-zinc-500">
                      支持 .md 文件，大小不超过 {RESUME_UPLOAD_LIMITS.maxFileSizeLabel}
                      。导入后仍可继续手动编辑。
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,text/markdown"
                      onChange={handleFileImport}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={handleOpenFilePicker}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
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
                id="resume-draft-content"
                value={resumeText}
                onChange={(event) => applyResumeText(event.target.value)}
                placeholder="请粘贴你的简历文本，建议包含项目经历、技术栈、负责内容和结果。"
                aria-invalid={shouldShowValidationError}
                className={`min-h-80 w-full rounded-2xl border px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 ${
                  shouldShowValidationError
                    ? "border-red-300 bg-red-50/60"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              />

              {shouldShowValidationError ? (
                <p className="text-sm text-red-600">{validationMessage}</p>
              ) : (
                <p className="text-sm text-zinc-500">
                  简历草稿会自动保存在当前浏览器中。进入分析页后，会继续复用这份草稿以及相关缓存。
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-500">
                这一页只保留输入与导入职责，分析、JD 匹配、聊天和开始模拟面试都已经迁移到 /analysis。
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!hasResumeDraft}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-400"
                >
                  清空草稿
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/analysis")}
                  disabled={!hasResumeDraft}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                >
                  继续到 /analysis
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-zinc-900">下一步会发生什么</h2>
              <p className="text-sm leading-7 text-zinc-600">
                进入 /analysis 后，你可以先做简历分析，再补充目标岗位 JD、查看匹配结果、继续和 AI 聊天，最后直接进入 /interview。
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/analysis")}
              disabled={!hasResumeDraft}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-400"
            >
              {isHydrated && hasResumeDraft ? "前往分析工作台" : "先输入简历"}
            </button>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
