import { NextResponse } from "next/server";

import { createOpenAIClient } from "@/lib/openai";
import { buildGenerateQuestionsPrompts } from "@/lib/prompts";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewQuestion, SetupFormData } from "@/types/interview";
import type { ResumeAnalysis, ResumeJdMatch } from "@/types/resume";

type GenerateQuestionsResponse = {
  questions: InterviewQuestion[];
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

export async function POST(request: Request) {
  try {
    const parsedBody = (await request.json()) as unknown;
    const body =
      parsedBody && typeof parsedBody === "object"
        ? (parsedBody as Record<string, unknown>)
        : {};
    const formData: SetupFormData = {
      jd: typeof body.jd === "string" ? body.jd : "",
      resume: typeof body.resume === "string" ? body.resume : "",
    };
    const analysis = isResumeAnalysis(body.analysis) ? body.analysis : undefined;
    const jdMatch = isResumeJdMatch(body.jdMatch) ? body.jdMatch : undefined;
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
    const { systemPrompt, userPrompt } = buildGenerateQuestionsPrompts({
      ...formData,
      analysis,
      jdMatch,
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
