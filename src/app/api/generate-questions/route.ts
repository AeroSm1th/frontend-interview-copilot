import { NextResponse } from "next/server";

import { createOpenAIClient } from "@/lib/openai";
import { buildGenerateQuestionsPrompts } from "@/lib/prompts";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewQuestion, SetupFormData } from "@/types/interview";

type GenerateQuestionsResponse = {
  questions: InterviewQuestion[];
};

function extractJsonText(content: string) {
  const trimmedContent = content.trim();

  if (trimmedContent.startsWith("{") && trimmedContent.endsWith("}")) {
    return trimmedContent;
  }

  const startIndex = trimmedContent.indexOf("{");
  const endIndex = trimmedContent.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return null;
  }

  return trimmedContent.slice(startIndex, endIndex + 1);
}

function isInterviewQuestion(value: unknown): value is InterviewQuestion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return typeof data.id === "string" && typeof data.question === "string";
}

function parseQuestionsFromContent(content: string): InterviewQuestion[] {
  const jsonText = extractJsonText(content);

  if (!jsonText) {
    throw new Error("模型返回内容不是有效 JSON。");
  }

  const parsedValue: unknown = JSON.parse(jsonText);

  if (!parsedValue || typeof parsedValue !== "object") {
    throw new Error("模型返回内容格式不正确。");
  }

  const data = parsedValue as Record<string, unknown>;

  if (!Array.isArray(data.questions) || !data.questions.every(isInterviewQuestion)) {
    throw new Error("模型返回的 questions 字段格式不正确。");
  }

  if (data.questions.length !== 5) {
    throw new Error("模型返回的 questions 数量不是 5。");
  }

  return data.questions;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SetupFormData>;
    const formData: SetupFormData = {
      jd: body.jd ?? "",
      resume: body.resume ?? "",
    };
    const validationResult = validateSetupForm(formData);

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          message: "输入校验失败。",
          errors: validationResult.errors,
        },
        { status: 400 },
      );
    }

    const client = createOpenAIClient();
    const { systemPrompt, userPrompt } = buildGenerateQuestionsPrompts(formData);
    const completion = await client.chat.completions.create({
      model: process.env.AI_MODEL ?? "qwen-turbo",
      response_format: {
        type: "json_object",
      },
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
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          message: "模型没有返回题目内容。",
        },
        { status: 500 },
      );
    }

    const questions = parseQuestionsFromContent(content);
    const responseBody: GenerateQuestionsResponse = {
      questions,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "生成面试题时发生未知错误。";

    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
