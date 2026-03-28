import { NextResponse } from "next/server";

import { SETUP_FORM_LIMITS } from "@/lib/constants";
import { createOpenAIClient } from "@/lib/openai";
import { buildResumeChatPrompts } from "@/lib/prompts";
import type { ResumeAnalysis, ResumeChatMessage } from "@/types/resume";

type ResumeChatRequestBody = {
  resume: string;
  analysis: ResumeAnalysis;
  messages?: ResumeChatMessage[];
  question: string;
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

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResumeAnalysis(value: unknown): value is ResumeAnalysis {
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

function isResumeChatMessage(value: unknown): value is ResumeChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.id === "string" &&
    (data.role === "user" || data.role === "assistant") &&
    typeof data.content === "string" &&
    typeof data.createdAt === "string"
  );
}

function validateResumeChatInput(body: Partial<ResumeChatRequestBody>) {
  const resume = typeof body.resume === "string" ? body.resume.trim() : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const messages = body.messages ?? [];

  if (resume.length === 0) {
    return {
      isValid: false as const,
      message: "请输入简历内容。",
    };
  }

  if (resume.length < SETUP_FORM_LIMITS.resumeMinLength) {
    return {
      isValid: false as const,
      message: `简历内容至少需要 ${SETUP_FORM_LIMITS.resumeMinLength} 个字符。`,
    };
  }

  if (!isResumeAnalysis(body.analysis)) {
    return {
      isValid: false as const,
      message: "请先完成一份有效的简历分析。",
    };
  }

  if (!Array.isArray(messages) || !messages.every(isResumeChatMessage)) {
    return {
      isValid: false as const,
      message: "聊天记录格式不正确，请刷新后重试。",
    };
  }

  if (question.length === 0) {
    return {
      isValid: false as const,
      message: "请输入你想追问的问题。",
    };
  }

  return {
    isValid: true as const,
    resume,
    analysis: body.analysis,
    question,
    messages,
  };
}

function createStreamEventPayload(event: ResumeChatStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ResumeChatRequestBody>;
    const validationResult = validateResumeChatInput(body);

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          message: validationResult.message,
        },
        { status: 400 },
      );
    }

    const client = createOpenAIClient();
    const { systemPrompt, userPrompt } = buildResumeChatPrompts({
      resume: validationResult.resume,
      analysis: validationResult.analysis,
      messages: validationResult.messages,
      question: validationResult.question,
    });
    const completion = await client.chat.completions.create({
      model: process.env.AI_MODEL ?? "qwen-turbo",
      stream: true,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          let hasContent = false;

          try {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content;

              if (typeof content !== "string" || content.length === 0) {
                continue;
              }

              hasContent = true;
              controller.enqueue(
                encoder.encode(
                  createStreamEventPayload({
                    type: "delta",
                    content,
                  }),
                ),
              );
            }

            if (!hasContent) {
              controller.enqueue(
                encoder.encode(
                  createStreamEventPayload({
                    type: "error",
                    message: "模型没有返回有效的简历对话内容。",
                  }),
                ),
              );
              return;
            }

            controller.enqueue(
              encoder.encode(
                createStreamEventPayload({
                  type: "done",
                }),
              ),
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "简历对话时发生未知错误。";

            controller.enqueue(
              encoder.encode(
                createStreamEventPayload({
                  type: "error",
                  message,
                }),
              ),
            );
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "简历对话时发生未知错误。";

    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
