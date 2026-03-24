import {
  INTERVIEW_SESSION_INITIAL_VALUES,
  SETUP_FORM_INITIAL_VALUES,
  STORAGE_KEYS,
} from "@/lib/constants";
import type {
  InterviewAnswer,
  InterviewQuestion,
  InterviewReport,
  InterviewSession,
  SetupFormData,
} from "@/types/interview";

function isBrowser() {
  return typeof window !== "undefined";
}

function isSetupFormData(value: unknown): value is SetupFormData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return typeof data.jd === "string" && typeof data.resume === "string";
}

function isInterviewQuestion(value: unknown): value is InterviewQuestion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return typeof data.id === "string" && typeof data.question === "string";
}

function isInterviewAnswer(value: unknown): value is InterviewAnswer {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return typeof data.questionId === "string" && typeof data.answer === "string";
}

function isInterviewSession(value: unknown): value is InterviewSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (
    typeof data.currentQuestionIndex !== "number" ||
    !Number.isInteger(data.currentQuestionIndex) ||
    data.currentQuestionIndex < 0
  ) {
    return false;
  }

  if (!Array.isArray(data.questions) || !data.questions.every(isInterviewQuestion)) {
    return false;
  }

  if (!Array.isArray(data.answers) || !data.answers.every(isInterviewAnswer)) {
    return false;
  }

  return true;
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
    Array.isArray(data.weaknesses) &&
    data.weaknesses.every((item) => typeof item === "string") &&
    Array.isArray(data.suggestions) &&
    data.suggestions.every((item) => typeof item === "string")
  );
}

function normalizeLegacyInterviewSession(value: unknown): InterviewSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Record<string, unknown>;

  if (
    typeof data.currentQuestionIndex !== "number" ||
    !Number.isInteger(data.currentQuestionIndex) ||
    data.currentQuestionIndex < 0
  ) {
    return null;
  }

  if (!data.answers || typeof data.answers !== "object" || Array.isArray(data.answers)) {
    return null;
  }

  const answers = Object.entries(data.answers).reduce<InterviewAnswer[]>(
    (result, [questionId, answer]) => {
      if (typeof answer === "string") {
        result.push({
          questionId,
          answer,
        });
      }

      return result;
    },
    [],
  );

  return {
    questions: [],
    currentQuestionIndex: data.currentQuestionIndex,
    answers,
  };
}

export function readSetupForm(): SetupFormData {
  if (!isBrowser()) {
    return SETUP_FORM_INITIAL_VALUES;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.setupForm);

  if (!rawValue) {
    return SETUP_FORM_INITIAL_VALUES;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (isSetupFormData(parsedValue)) {
      return parsedValue;
    }
  } catch {
    return SETUP_FORM_INITIAL_VALUES;
  }

  return SETUP_FORM_INITIAL_VALUES;
}

export function saveSetupForm(values: SetupFormData) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.setupForm, JSON.stringify(values));
}

export function clearSetupForm() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.setupForm);
}

export function readInterviewSession(): InterviewSession {
  if (!isBrowser()) {
    return INTERVIEW_SESSION_INITIAL_VALUES;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.interviewSession);

  if (!rawValue) {
    return INTERVIEW_SESSION_INITIAL_VALUES;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (isInterviewSession(parsedValue)) {
      return parsedValue;
    }

    const normalizedLegacySession = normalizeLegacyInterviewSession(parsedValue);

    if (normalizedLegacySession) {
      return normalizedLegacySession;
    }
  } catch {
    return INTERVIEW_SESSION_INITIAL_VALUES;
  }

  return INTERVIEW_SESSION_INITIAL_VALUES;
}

export function saveInterviewSession(values: InterviewSession) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.interviewSession,
    JSON.stringify(values),
  );
}

export function clearInterviewSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.interviewSession);
}

export function readInterviewReport(): InterviewReport | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.interviewReport);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (isInterviewReport(parsedValue)) {
      return parsedValue;
    }
  } catch {
    return null;
  }

  return null;
}

export function saveInterviewReport(values: InterviewReport) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.interviewReport,
    JSON.stringify(values),
  );
}

export function clearInterviewReport() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.interviewReport);
}
