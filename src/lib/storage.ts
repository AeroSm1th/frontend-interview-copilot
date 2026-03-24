import {
  INTERVIEW_SESSION_INITIAL_VALUES,
  SETUP_FORM_INITIAL_VALUES,
  STORAGE_KEYS,
} from "@/lib/constants";
import type { InterviewSession, SetupFormData } from "@/types/interview";

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

  if (!data.answers || typeof data.answers !== "object") {
    return false;
  }

  return Object.values(data.answers).every((answer) => typeof answer === "string");
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
