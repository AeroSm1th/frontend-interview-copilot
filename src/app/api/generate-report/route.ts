import { NextResponse } from "next/server";

import { createOpenAIClient } from "@/lib/openai";
import { buildGenerateReportPrompts } from "@/lib/prompts";
import { validateSetupForm } from "@/lib/validation";
import type {
  InterviewAnswer,
  InterviewQuestion,
  InterviewReport,
  SetupFormData,
} from "@/types/interview";
import type { ResumeAnalysis, ResumeJdMatch } from "@/types/resume";

type GenerateReportRequestBody = SetupFormData & {
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  analysis?: ResumeAnalysis;
  jdMatch?: ResumeJdMatch;
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

function isInterviewAnswer(value: unknown): value is InterviewAnswer {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return typeof data.questionId === "string" && typeof data.answer === "string";
}

function isInterviewReport(value: unknown): value is InterviewReport {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.score === "number" &&
    typeof data.summary === "string" &&
    Array.isArray(data.strengths) &&
    data.strengths.every((item) => typeof item === "string") &&
    data.strengths.length >= 2 &&
    Array.isArray(data.weaknesses) &&
    data.weaknesses.every((item) => typeof item === "string") &&
    data.weaknesses.length >= 2 &&
    Array.isArray(data.suggestions) &&
    data.suggestions.every((item) => typeof item === "string") &&
    data.suggestions.length >= 2
  );
}

function validateGenerateReportInput(body: Partial<GenerateReportRequestBody>) {
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

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    return {
      isValid: false as const,
      message: "缺少有效的面试题目数据。",
    };
  }

  if (!body.questions.every(isInterviewQuestion)) {
    return {
      isValid: false as const,
      message: "面试题目格式不正确。",
    };
  }

  if (!Array.isArray(body.answers)) {
    return {
      isValid: false as const,
      message: "回答数据格式不正确。",
    };
  }

  if (!body.answers.every(isInterviewAnswer)) {
    return {
      isValid: false as const,
      message: "回答数据格式不正确。",
    };
  }

  return {
    isValid: true as const,
    formData,
    questions: body.questions,
    answers: body.answers,
    analysis: isResumeAnalysis(body.analysis) ? body.analysis : undefined,
    jdMatch: isResumeJdMatch(body.jdMatch) ? body.jdMatch : undefined,
  };
}

function parseReportFromContent(content: string): InterviewReport {
  const jsonText = extractJsonText(content);

  if (!jsonText) {
    throw new Error("模型返回内容不是有效 JSON。");
  }

  const parsedValue: unknown = JSON.parse(jsonText);

  if (!isInterviewReport(parsedValue)) {
    throw new Error("模型返回的报告字段不完整或格式不正确。");
  }

  return parsedValue;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<GenerateReportRequestBody>;
    const validationResult = validateGenerateReportInput(body);

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
    const { systemPrompt, userPrompt } = buildGenerateReportPrompts({
      jd: validationResult.formData.jd,
      resume: validationResult.formData.resume,
      questions: validationResult.questions,
      answers: validationResult.answers,
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
          message: "模型没有返回报告内容。",
        },
        { status: 500 },
      );
    }

    const report = parseReportFromContent(content);

    return NextResponse.json(report);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "生成报告时发生未知错误。";

    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
