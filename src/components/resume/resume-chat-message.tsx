"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ResumeChatMessage } from "@/types/resume";

type ResumeChatMessageProps = {
  message: ResumeChatMessage;
  isStreaming?: boolean;
};

export function ResumeChatMessage({
  message,
  isStreaming = false,
}: ResumeChatMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-zinc-900 px-4 py-3 text-sm leading-7 text-white shadow-sm">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
            你
          </p>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  const shouldShowStreamingPlaceholder =
    isStreaming && message.content.trim().length === 0;

  return (
    <div className="flex justify-start">
      <div className="w-full rounded-3xl border border-zinc-200 bg-white px-4 py-4 text-sm text-zinc-700 shadow-sm">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
          AI
        </p>

        {shouldShowStreamingPlaceholder ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="inline-flex h-2 w-2 rounded-full bg-zinc-400 animate-pulse" />
            <span>正在生成回复...</span>
          </div>
        ) : (
          <div className="resume-chat-markdown space-y-4 break-words text-[15px] leading-7 text-zinc-700">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                ul: ({ children }) => (
                  <ul className="list-disc space-y-2 pl-5 marker:text-zinc-400">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal space-y-2 pl-5 marker:text-zinc-400">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-zinc-900">{children}</strong>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-600"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-zinc-200 pl-4 text-zinc-600">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  if (className) {
                    return (
                      <code className="block overflow-x-auto rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-zinc-100">
                        {children}
                      </code>
                    );
                  }

                  return (
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-800">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>,
              }}
            >
              {message.content}
            </ReactMarkdown>

            {isStreaming ? (
              <span className="inline-flex h-5 w-2 translate-y-1 rounded-full bg-zinc-300 animate-pulse" />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
