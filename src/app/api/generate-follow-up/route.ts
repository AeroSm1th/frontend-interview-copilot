import { NextResponse } from "next/server";

import { createOpenAIClient } from "@/lib/openai";
import { buildGenerateFollowUpPrompts } from "@/lib/prompts";
import { validateSetupForm } from "@/lib/validation";
import type { InterviewQuestion, SetupFormData } from "@/types/interview";
import type { ResumeAnalysis, ResumeJdMatch } from "@/types/resume";

type QuestionChainItem = {
  questionId: string;
  question: string;
  answer: string;
  kind: "main" | "follow_up";
  followUpRound?: 1 | 2 | 3;
};

type GenerateFollowUpRequestBody = SetupFormData & {
  analysis?: ResumeAnalysis;
  jdMatch?: ResumeJdMatch;
  mainQuestionId?: string;
  mainQuestion?: string;
  currentQuestionId?: string;
  currentQuestion?: string;
  currentAnswer?: string;
  currentFollowUpRound?: number;
  questionChain?: QuestionChainItem[];
};

type GenerateFollowUpResponse = {
  followUpQuestion: InterviewQuestion | null;
};

type ParsedFollowUpContent = {
  followUpQuestion: string | null;
  followUpHint: string | null;
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

function isInterviewQuestionKind(value: unknown): value is "main" | "follow_up" {
  return value === "main" || value === "follow_up";
}

function isFollowUpRound(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function isCurrentFollowUpRound(value: unknown): value is 0 | 1 | 2 | 3 {
  return value === 0 || isFollowUpRound(value);
}

function isQuestionChainItem(value: unknown): value is QuestionChainItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (
    typeof data.questionId !== "string" ||
    typeof data.question !== "string" ||
    typeof data.answer !== "string" ||
    !isInterviewQuestionKind(data.kind)
  ) {
    return false;
  }

  if (
    "followUpRound" in data &&
    typeof data.followUpRound !== "undefined" &&
    !isFollowUpRound(data.followUpRound)
  ) {
    return false;
  }

  return true;
}

function createFollowUpQuestionId(mainQuestionId: string, nextFollowUpRound: 1 | 2 | 3) {
  return `${mainQuestionId}-follow-up-${nextFollowUpRound}`;
}

function normalizeOptionalHint(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function parseFollowUpContent(content: string): ParsedFollowUpContent {
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
    return {
      followUpQuestion: null,
      followUpHint: null,
    };
  }

  if (typeof data.followUpQuestion !== "string") {
    throw new Error("模型返回的 followUpQuestion 字段格式不正确。");
  }

  const followUpQuestion = data.followUpQuestion.trim();

  const normalizedFollowUpQuestion =
    followUpQuestion.length > 0 ? followUpQuestion : null;

  return {
    followUpQuestion: normalizedFollowUpQuestion,
    followUpHint: normalizedFollowUpQuestion
      ? normalizeOptionalHint(data.followUpHint)
      : null,
  };
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
  const currentQuestionId = body.currentQuestionId?.trim() ?? "";
  const currentQuestion = body.currentQuestion?.trim() ?? "";
  const currentAnswer = body.currentAnswer?.trim() ?? "";
  const currentFollowUpRound = body.currentFollowUpRound;
  const questionChain = Array.isArray(body.questionChain) ? body.questionChain : null;

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

  if (!currentQuestionId) {
    return {
      isValid: false as const,
      message: "缺少有效的当前题目 ID。",
    };
  }

  if (!currentQuestion) {
    return {
      isValid: false as const,
      message: "缺少有效的当前题目内容。",
    };
  }

  if (!currentAnswer) {
    return {
      isValid: false as const,
      message: "缺少有效的当前题目回答。",
    };
  }

  if (!isCurrentFollowUpRound(currentFollowUpRound)) {
    return {
      isValid: false as const,
      message: "当前追问轮次格式不正确。",
    };
  }

  if (!questionChain || questionChain.length === 0 || !questionChain.every(isQuestionChainItem)) {
    return {
      isValid: false as const,
      message: "当前主问题链数据格式不正确。",
    };
  }

  return {
    isValid: true as const,
    formData,
    mainQuestionId,
    mainQuestion,
    currentQuestionId,
    currentQuestion,
    currentAnswer,
    currentFollowUpRound,
    questionChain,
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

    if (validationResult.currentFollowUpRound >= 3) {
      const responseBody: GenerateFollowUpResponse = {
        followUpQuestion: null,
      };

      return NextResponse.json(responseBody);
    }

    const nextFollowUpRound = (
      validationResult.currentFollowUpRound + 1
    ) as 1 | 2 | 3;
    const client = createOpenAIClient();
    const { systemPrompt, userPrompt } = buildGenerateFollowUpPrompts({
      jd: validationResult.formData.jd,
      resume: validationResult.formData.resume,
      mainQuestionId: validationResult.mainQuestionId,
      mainQuestion: validationResult.mainQuestion,
      currentQuestionId: validationResult.currentQuestionId,
      currentQuestion: validationResult.currentQuestion,
      currentAnswer: validationResult.currentAnswer,
      currentFollowUpRound: validationResult.currentFollowUpRound,
      questionChain: validationResult.questionChain,
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

    const { followUpQuestion, followUpHint } = parseFollowUpContent(content);
    const responseBody: GenerateFollowUpResponse = {
      followUpQuestion: followUpQuestion
        ? {
            id: createFollowUpQuestionId(
              validationResult.mainQuestionId,
              nextFollowUpRound,
            ),
            question: followUpQuestion,
            kind: "follow_up",
            parentQuestionId: validationResult.mainQuestionId,
            followUpRound: nextFollowUpRound,
            followUpStatus: "pending",
            followUpHint,
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
