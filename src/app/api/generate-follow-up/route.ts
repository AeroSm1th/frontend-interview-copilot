import { NextResponse } from "next/server";

import { createOpenAIClient } from "@/lib/openai";
import { buildGenerateFollowUpPrompts } from "@/lib/prompts";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewQuestion, SetupFormData } from "@/types/interview";
import type { ResumeAnalysis, ResumeJdMatch } from "@/types/resume";

type GenerateFollowUpRequestBody = SetupFormData & {
  analysis?: ResumeAnalysis;
  jdMatch?: ResumeJdMatch;
  mainQuestionId?: string;
  mainQuestion?: string;
  mainAnswer?: string;
};

type GenerateFollowUpResponse = {
  followUpQuestion: InterviewQuestion | null;
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

function isResumeJdMatch(value: unknown): value is ResumeJdMatch {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.matchScore === "number" &&
    Number.isFinite(data.matchScore) &&
    typeof data.summary === "string" &&
    isStringArray(data.matchedSkills) &&
    isStringArray(data.missingSkills) &&
    isStringArray(data.risks) &&
    isStringArray(data.suggestions)
  );
}

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

function createFollowUpQuestionId(mainQuestionId: string) {
  return `${mainQuestionId}-follow-up`;
}

function parseFollowUpQuestionText(content: string): string | null {
  const jsonText = extractJsonText(content);

  if (!jsonText) {
    throw new Error("模型返回内容不是有效 JSON。");
  }

  const parsedValue: unknown = JSON.parse(jsonText);

  if (!parsedValue || typeof parsedValue !== "object") {
    throw new Error("模型返回内容格式不正确。");
  }

  const data = parsedValue as Record<string, unknown>;

  if (!("followUpQuestion" in data)) {
    throw new Error("模型返回的 followUpQuestion 字段缺失。");
  }

  if (data.followUpQuestion === null) {
    return null;
  }

  if (typeof data.followUpQuestion !== "string") {
    throw new Error("模型返回的 followUpQuestion 字段格式不正确。");
  }

  const followUpQuestion = data.followUpQuestion.trim();

  return followUpQuestion.length > 0 ? followUpQuestion : null;
}

function validateGenerateFollowUpInput(body: Partial<GenerateFollowUpRequestBody>) {
  const formData: SetupFormData = {
    jd: body.jd ?? "",
    resume: body.resume ?? "",
  };
  const formValidationResult = validateSetupForm(formData);

  if (!formValidationResult.isValid) {
    return {
      isValid: false as const,
      message: "输入校验失败。",
      errors: formValidationResult.errors,
    };
  }

  const mainQuestionId = body.mainQuestionId?.trim() ?? "";
  const mainQuestion = body.mainQuestion?.trim() ?? "";
  const mainAnswer = body.mainAnswer?.trim() ?? "";

  if (!mainQuestionId) {
    return {
      isValid: false as const,
      message: "缺少有效的主问题 ID。",
    };
  }

  if (!mainQuestion) {
    return {
      isValid: false as const,
      message: "缺少有效的主问题内容。",
    };
  }

  if (!mainAnswer) {
    return {
      isValid: false as const,
      message: "缺少有效的主问题回答。",
    };
  }

  return {
    isValid: true as const,
    formData,
    mainQuestionId,
    mainQuestion,
    mainAnswer,
    analysis: isResumeAnalysis(body.analysis) ? body.analysis : undefined,
    jdMatch: isResumeJdMatch(body.jdMatch) ? body.jdMatch : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const parsedBody = (await request.json()) as unknown;
    const body =
      parsedBody && typeof parsedBody === "object"
        ? (parsedBody as GenerateFollowUpRequestBody)
        : {};
    const validationResult = validateGenerateFollowUpInput(body);

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          message: validationResult.message,
          errors: "errors" in validationResult ? validationResult.errors : undefined,
        },
        { status: 400 },
      );
    }

    const client = createOpenAIClient();
    const { systemPrompt, userPrompt } = buildGenerateFollowUpPrompts({
      jd: validationResult.formData.jd,
      resume: validationResult.formData.resume,
      mainQuestion: validationResult.mainQuestion,
      mainAnswer: validationResult.mainAnswer,
      analysis: validationResult.analysis,
      jdMatch: validationResult.jdMatch,
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
          message: "模型没有返回追问内容。",
        },
        { status: 500 },
      );
    }

    const followUpQuestionText = parseFollowUpQuestionText(content);
    const responseBody: GenerateFollowUpResponse = {
      followUpQuestion: followUpQuestionText
        ? {
            id: createFollowUpQuestionId(validationResult.mainQuestionId),
            question: followUpQuestionText,
            kind: "follow_up",
            parentQuestionId: validationResult.mainQuestionId,
          }
        : null,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "生成追问时发生未知错误。";

    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
