import type { InterviewSession, SetupFormData } from "@/types/interview";

export const STORAGE_KEYS = {
  setupForm: "frontend-interview-copilot.setup-form",
  interviewSession: "frontend-interview-copilot.interview-session",
} as const;

export const SETUP_FORM_LIMITS = {
  jdMinLength: 20,
  resumeMinLength: 50,
} as const;

export const SETUP_FORM_INITIAL_VALUES: SetupFormData = {
  jd: "",
  resume: "",
};

export const INTERVIEW_SESSION_INITIAL_VALUES: InterviewSession = {
  currentQuestionIndex: 0,
  answers: {},
};
