"use client";

import { type FormEvent } from "react";

import type { ResumeChatMessage } from "@/types/resume";

const QUICK_QUESTIONS = [
  "帮我提炼项目亮点",
  "模拟面试官追问",
  "这份简历有哪些风险点",
  "我该怎么做自我介绍",
] as const;

type ResumeChatPanelProps = {
  messages: ResumeChatMessage[];
  inputValue: string;
  errorMessage: string;
  isSending: boolean;
  disabled?: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onShortcutClick: (question: string) => void;
};

export function ResumeChatPanel({
  messages,
  inputValue,
  errorMessage,
  isSending,
  disabled = false,
  onInputChange,
  onSend,
  onShortcutClick,
}: ResumeChatPanelProps) {
  const recentMessages = messages.slice(-6);
  const isSubmitDisabled = disabled || isSending || inputValue.trim().length === 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    onSend();
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-zinc-900">继续追问简历</h2>
        <p className="text-sm leading-7 text-zinc-600">
          基于当前简历文本和分析结果继续提问，适合追问项目亮点、风险点、自我介绍或面试表达。
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onShortcutClick(question)}
            disabled={disabled || isSending}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-400"
          >
            {question}
          </button>
        ))}
      </div>

      {recentMessages.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3">
          {recentMessages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-7 ${
                    isUser
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-zinc-50 text-zinc-700"
                  }`}
                >
                  <p className="mb-1 text-xs font-medium opacity-70">
                    {isUser ? "你" : "AI"}
                  </p>
                  <p>{message.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-4 text-sm text-zinc-500">
          还没有聊天记录。你可以继续追问项目亮点、面试官可能怎么追问，或者这份简历该怎么讲得更清楚。
        </div>
      )}

      {isSending ? (
        <div className="mt-4 rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
          AI 正在结合当前简历文本和分析结果回答，请稍候。
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="resume-chat-input" className="text-sm font-medium text-zinc-800">
            继续提问
          </label>
          <textarea
            id="resume-chat-input"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="例如：如果我是面试官，会怎么追问这个项目？"
            disabled={disabled || isSending}
            className="min-h-28 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-400"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            聊天记录会保存在当前浏览器中，后续刷新页面可继续查看。
          </p>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {isSending ? "正在发送..." : "发送问题"}
          </button>
        </div>
      </form>
    </section>
  );
}
