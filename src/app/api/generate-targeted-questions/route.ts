import { NextResponse } from "next/server";

import { createOpenAIClient } from "@/lib/openai";
import { buildGenerateTargetedQuestionsPrompts } from "@/lib/prompts";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewQuestion, SetupFormData } from "@/types/interview";
import type { ResumeAnalysis, ResumeJdMatch } from "@/types/resume";

type GenerateTargetedQuestionsRequestBody = SetupFormData & {
  weaknesses?: string[];
  suggestions?: string[];
  analysis?: ResumeAnalysis;
  jdMatch?: ResumeJdMatch;
  previousQuestions?: string[];
};

type GenerateTargetedQuestionsResponse = {
  questions: InterviewQuestion[];
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeStringArray(value: unknown) {
  if (!isStringArray(value)) {
    return null;
  }

  return value.map((item) => item.trim()).filter(Boolean);
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

function isInterviewQuestionKind(value: unknown) {
  return value === "main" || value === "follow_up";
}

function isFollowUpStatus(value: unknown) {
  return value === "pending" || value === "generated" || value === "skipped";
}

function isInterviewQuestion(value: unknown): value is InterviewQuestion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (typeof data.id !== "string" || typeof data.question !== "string") {
    return false;
  }

  if (
    "kind" in data &&
    typeof data.kind !== "undefined" &&
    !isInterviewQuestionKind(data.kind)
  ) {
    return false;
  }

  if (
    "parentQuestionId" in data &&
    typeof data.parentQuestionId !== "undefined" &&
    data.parentQuestionId !== null &&
    typeof data.parentQuestionId !== "string"
  ) {
    return false;
  }

  if (
    "followUpStatus" in data &&
    typeof data.followUpStatus !== "undefined" &&
    !isFollowUpStatus(data.followUpStatus)
  ) {
    return false;
  }

  return true;
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

  return data.questions.map((question) => ({
    id: question.id,
    question: question.question,
  }));
}

function validateGenerateTargetedQuestionsInput(
  body: Partial<GenerateTargetedQuestionsRequestBody>,
) {
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

  const weaknesses = normalizeStringArray(body.weaknesses);
  const suggestions = normalizeStringArray(body.suggestions);

  if (!weaknesses || !suggestions) {
    return {
      isValid: false as const,
      message: "专项训练所需的薄弱点或建议格式不正确。",
    };
  }

  if (weaknesses.length === 0 && suggestions.length === 0) {
    return {
      isValid: false as const,
      message: "缺少有效的薄弱点或建议，无法生成专项训练题。",
    };
  }

  const previousQuestions = normalizeStringArray(body.previousQuestions) ?? [];

  return {
    isValid: true as const,
    formData,
    weaknesses,
    suggestions,
    previousQuestions,
    analysis: isResumeAnalysis(body.analysis) ? body.analysis : undefined,
    jdMatch: isResumeJdMatch(body.jdMatch) ? body.jdMatch : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const parsedBody = (await request.json()) as unknown;
    const body =
      parsedBody && typeof parsedBody === "object"
        ? (parsedBody as Partial<GenerateTargetedQuestionsRequestBody>)
        : {};
    const validationResult = validateGenerateTargetedQuestionsInput(body);

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
    const { systemPrompt, userPrompt } = buildGenerateTargetedQuestionsPrompts({
      jd: validationResult.formData.jd,
      resume: validationResult.formData.resume,
      weaknesses: validationResult.weaknesses,
      suggestions: validationResult.suggestions,
      analysis: validationResult.analysis,
      jdMatch: validationResult.jdMatch,
      previousQuestions: validationResult.previousQuestions,
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
          message: "模型没有返回专项训练题内容。",
        },
        { status: 500 },
      );
    }

    const questions = parseQuestionsFromContent(content);
    const responseBody: GenerateTargetedQuestionsResponse = {
      questions,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "生成专项训练题时发生未知错误。";

    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
