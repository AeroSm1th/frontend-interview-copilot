import { NextResponse } from "next/server";

import { SETUP_FORM_LIMITS } from "@/lib/constants";
import { createOpenAIClient } from "@/lib/openai";
import { buildAnalyzeResumePrompts } from "@/lib/prompts";
import type { ResumeAnalysis } from "@/types/resume";

type AnalyzeResumeRequestBody = {
  resume: string;
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
    data.strengths.length >= 2 &&
    isStringArray(data.risks) &&
    data.risks.length >= 2 &&
    isStringArray(data.suggestedImprovements) &&
    data.suggestedImprovements.length >= 2 &&
    isStringArray(data.keywords) &&
    data.keywords.length >= 2
  );
}

function parseResumeAnalysisFromContent(content: string): ResumeAnalysis {
  const jsonText = extractJsonText(content);

  if (!jsonText) {
    throw new Error("模型返回的简历分析不是有效 JSON。");
  }

  const parsedValue: unknown = JSON.parse(jsonText);

  if (!isResumeAnalysis(parsedValue)) {
    throw new Error("模型返回的简历分析字段不完整或格式不正确。");
  }

  return parsedValue;
}

function validateAnalyzeResumeInput(body: Partial<AnalyzeResumeRequestBody>) {
  const resume = typeof body.resume === "string" ? body.resume.trim() : "";

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

  return {
    isValid: true as const,
    resume,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AnalyzeResumeRequestBody>;
    const validationResult = validateAnalyzeResumeInput(body);

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          message: validationResult.message,
        },
        { status: 400 },
      );
    }

    const client = createOpenAIClient();
    const { systemPrompt, userPrompt } = buildAnalyzeResumePrompts({
      resume: validationResult.resume,
    });
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
          message: "模型没有返回简历分析内容。",
        },
        { status: 500 },
      );
    }

    const analysis = parseResumeAnalysisFromContent(content);

    return NextResponse.json(analysis);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "简历分析时发生未知错误。";

    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
