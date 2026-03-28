"use client";

import { type FormEvent, useEffect, useRef } from "react";

import { ResumeChatMessage as ResumeChatMessageBubble } from "@/components/resume/resume-chat-message";
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
  isCollapsed?: boolean;
  mode?: "sidebar" | "sheet";
  streamingMessageId?: string | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onShortcutClick: (question: string) => void;
  onToggleCollapse?: () => void;
  onClose?: () => void;
};

export function ResumeChatPanel({
  messages,
  inputValue,
  errorMessage,
  isSending,
  disabled = false,
  isCollapsed = false,
  mode = "sidebar",
  streamingMessageId = null,
  onInputChange,
  onSend,
  onShortcutClick,
  onToggleCollapse,
  onClose,
}: ResumeChatPanelProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isSubmitDisabled = disabled || isSending || inputValue.trim().length === 0;
  const isSheet = mode === "sheet";

  useEffect(() => {
    if (isCollapsed) {
      return;
    }

    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [isCollapsed, isSending, messages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    onSend();
  }

  if (isCollapsed) {
    return (
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-full w-full flex-col items-center justify-between gap-6 px-3 py-5 text-center transition-colors hover:bg-zinc-50"
        >
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
              Chat
            </p>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-4">
              <p className="text-lg font-semibold text-zinc-900">{messages.length}</p>
              <p className="mt-1 text-[11px] leading-5 text-zinc-500">消息</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs leading-5 text-zinc-500">展开后继续追问与润色表达</p>
            <span className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white">
              展开
            </span>
          </div>
        </button>
      </section>
    );
  }

  return (
    <section
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white shadow-sm ${
        isSheet ? "rounded-t-[32px] rounded-b-none" : "rounded-[32px]"
      }`}
    >
      <div className="shrink-0 border-b border-zinc-100 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                Chat
              </p>
              {isSending ? (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                  正在生成
                </span>
              ) : null}
            </div>
            <h2 className="text-base font-semibold text-zinc-900">继续追问简历</h2>
            <p className="text-sm leading-6 text-zinc-600">
              结合当前简历文本和分析结果，继续打磨项目表达、自我介绍和面试追问。
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onToggleCollapse && !isSheet ? (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                收起
              </button>
            ) : null}

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                关闭
              </button>
            ) : null}
          </div>
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
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 space-y-4 overflow-y-auto bg-zinc-50/70 px-5 py-5"
      >
        {messages.length > 0 ? (
          messages.map((message) => (
            <ResumeChatMessageBubble
              key={message.id}
              message={message}
              isStreaming={streamingMessageId === message.id}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-5 py-5 text-sm leading-7 text-zinc-500 shadow-sm">
            还没有聊天记录。你可以先从项目亮点、风险点、自我介绍或面试官追问开始。
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-100 bg-white px-5 py-5">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-zinc-500">
              聊天记录会保存在当前浏览器中，刷新页面后仍可继续查看。
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
      </div>
    </section>
  );
}
