import { NextResponse } from "next/server";

import { SETUP_FORM_LIMITS } from "@/lib/constants";
import { createOpenAIClient } from "@/lib/openai";
import { buildResumeJdMatchPrompts } from "@/lib/prompts";
import type { ResumeAnalysis, ResumeJdMatch } from "@/types/resume";

type AnalyzeResumeMatchRequestBody = {
  resume: string;
  analysis?: ResumeAnalysis;
  jd: string;
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
    isStringArray(data.risks) &&
    isStringArray(data.suggestedImprovements) &&
    isStringArray(data.keywords)
  );
}

function isResumeJdMatch(value: unknown): value is ResumeJdMatch {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.matchScore === "number" &&
    Number.isFinite(data.matchScore) &&
    data.matchScore >= 0 &&
    data.matchScore <= 100 &&
    typeof data.summary === "string" &&
    isStringArray(data.matchedSkills) &&
    isStringArray(data.missingSkills) &&
    isStringArray(data.risks) &&
    isStringArray(data.suggestions)
  );
}

function parseResumeJdMatchFromContent(content: string): ResumeJdMatch {
  const jsonText = extractJsonText(content);

  if (!jsonText) {
    throw new Error("模型返回的 JD 匹配分析不是有效 JSON。");
  }

  const parsedValue: unknown = JSON.parse(jsonText);

  if (!isResumeJdMatch(parsedValue)) {
    throw new Error("模型返回的 JD 匹配分析字段不完整或格式不正确。");
  }

  return parsedValue;
}

function validateAnalyzeResumeMatchInput(
  body: Partial<AnalyzeResumeMatchRequestBody>,
) {
  const resume = typeof body.resume === "string" ? body.resume.trim() : "";
  const jd = typeof body.jd === "string" ? body.jd.trim() : "";

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

  if (jd.length === 0) {
    return {
      isValid: false as const,
      message: "请输入岗位 JD。",
    };
  }

  if (jd.length < SETUP_FORM_LIMITS.jdMinLength) {
    return {
      isValid: false as const,
      message: `岗位 JD 至少需要 ${SETUP_FORM_LIMITS.jdMinLength} 个字符。`,
    };
  }

  if (typeof body.analysis !== "undefined" && body.analysis !== null) {
    if (!isResumeAnalysis(body.analysis)) {
      return {
        isValid: false as const,
        message: "已有简历分析结果格式不正确，请刷新后重试。",
      };
    }
  }

  return {
    isValid: true as const,
    resume,
    jd,
    analysis: body.analysis ?? null,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AnalyzeResumeMatchRequestBody>;
    const validationResult = validateAnalyzeResumeMatchInput(body);

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          message: validationResult.message,
        },
        { status: 400 },
      );
    }

    const client = createOpenAIClient();
    const { systemPrompt, userPrompt } = buildResumeJdMatchPrompts({
      resume: validationResult.resume,
      analysis: validationResult.analysis,
      jd: validationResult.jd,
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
          message: "模型没有返回 JD 匹配分析内容。",
        },
        { status: 500 },
      );
    }

    const result = parseResumeJdMatchFromContent(content);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "JD 匹配分析时发生未知错误。";

    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
