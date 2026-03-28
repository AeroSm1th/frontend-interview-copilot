"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ResumeChatPanel } from "@/components/resume/resume-chat-panel";
import { useWorkspaceSidebarSlot } from "@/components/shared/workspace-shell";
import {
  clearResumeChatMessages,
  readResumeChatMessages,
  saveResumeChatMessages,
} from "@/lib/storage";
import type {
  ResumeAnalysis,
  ResumeChatMessage,
} from "@/types/resume";

type AnalysisChatControllerProps = {
  resumeText: string;
  analysis: ResumeAnalysis | null;
  disabled?: boolean;
  canUseChat: boolean;
  chatResetSignal?: number;
  onChattingChange?: (value: boolean) => void;
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

export function AnalysisChatController({
  resumeText,
  analysis,
  disabled = false,
  canUseChat,
  chatResetSignal,
  onChattingChange,
}: AnalysisChatControllerProps) {
  const workspaceSidebarSlot = useWorkspaceSidebarSlot();
  const sidebarContainer = workspaceSidebarSlot?.sidebarContainer ?? null;
  const isSidebarAvailable = workspaceSidebarSlot?.isSidebarAvailable ?? false;
  const setSidebarState = workspaceSidebarSlot?.setSidebarState;
  const [chatMessages, setChatMessages] = useState<ResumeChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isChatSidebarCollapsed, setIsChatSidebarCollapsed] = useState(false);
  const [isChatSheetOpen, setIsChatSheetOpen] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const hasRestoredInitialStateRef = useRef(false);
  const previousChatResetSignalRef = useRef(chatResetSignal);

  const shouldShowChatPanel = isHydrated && canUseChat;

  useEffect(() => {
    if (hasRestoredInitialStateRef.current) {
      return;
    }

    if (canUseChat && analysis && resumeText.trim().length > 0) {
      setChatMessages(readResumeChatMessages());
    } else {
      clearResumeChatMessages();
    }

    hasRestoredInitialStateRef.current = true;
    setIsHydrated(true);
  }, [analysis, canUseChat, resumeText]);

  useEffect(() => {
    if (canUseChat) {
      return;
    }

    setIsChatSidebarCollapsed(false);
    setIsChatSheetOpen(false);
    setStreamingMessageId(null);
  }, [canUseChat]);

  useEffect(() => {
    if (previousChatResetSignalRef.current === chatResetSignal) {
      return;
    }

    previousChatResetSignalRef.current = chatResetSignal;
    setChatMessages([]);
    setChatInput("");
    setChatError("");
    setStreamingMessageId(null);
    clearResumeChatMessages();
  }, [chatResetSignal]);

  useEffect(() => {
    onChattingChange?.(isChatting);
  }, [isChatting, onChattingChange]);

  useEffect(() => {
    return () => {
      onChattingChange?.(false);
    };
  }, [onChattingChange]);

  useEffect(() => {
    if (!setSidebarState || !isSidebarAvailable) {
      return;
    }

    if (!shouldShowChatPanel) {
      setSidebarState("hidden");
      return;
    }

    setSidebarState(isChatSidebarCollapsed ? "collapsed" : "expanded");
  }, [
    isChatSidebarCollapsed,
    isSidebarAvailable,
    setSidebarState,
    shouldShowChatPanel,
  ]);

  useEffect(() => {
    if (!setSidebarState) {
      return;
    }

    return () => {
      setSidebarState("hidden");
    };
  }, [setSidebarState]);

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

  function handleToggleChatSidebar() {
    setIsChatSidebarCollapsed((currentValue) => !currentValue);
  }

  function handleOpenChatSheet() {
    setIsChatSheetOpen(true);
  }

  function handleCloseChatSheet() {
    setIsChatSheetOpen(false);
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

  const desktopSidebar = shouldShowChatPanel && sidebarContainer
    ? createPortal(
        <ResumeChatPanel
          messages={chatMessages}
          inputValue={chatInput}
          errorMessage={chatError}
          isSending={isChatting}
          disabled={disabled}
          isCollapsed={isChatSidebarCollapsed}
          streamingMessageId={streamingMessageId}
          onInputChange={handleChatInputChange}
          onSend={() => void handleChatSend()}
          onShortcutClick={handleChatShortcutClick}
          onToggleCollapse={handleToggleChatSidebar}
        />,
        sidebarContainer,
      )
    : null;

  return (
    <>
      {desktopSidebar}

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
              disabled={disabled}
              streamingMessageId={streamingMessageId}
              onInputChange={handleChatInputChange}
              onSend={() => void handleChatSend()}
              onShortcutClick={handleChatShortcutClick}
              onClose={handleCloseChatSheet}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
