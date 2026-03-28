import type { InterviewSession, SetupFormData } from "@/types/interview";

export const STORAGE_KEYS = {
  setupForm: "frontend-interview-copilot.setup-form",
  interviewSession: "frontend-interview-copilot.interview-session",
  interviewReport: "frontend-interview-copilot.interview-report",
  resumeDraft: "frontend-interview-copilot.resume-draft",
  resumeAnalysis: "frontend-interview-copilot.resume-analysis",
  resumeChat: "frontend-interview-copilot.resume-chat",
} as const;

export const SETUP_FORM_LIMITS = {
  jdMinLength: 20,
  resumeMinLength: 50,
} as const;

export const RESUME_UPLOAD_LIMITS = {
  acceptedExtensions: [".md"],
  acceptedMimeTypes: ["text/markdown", "text/x-markdown"],
  maxFileSizeInBytes: 1024 * 1024,
  maxFileSizeLabel: "1MB",
} as const;

export const SETUP_FORM_INITIAL_VALUES: SetupFormData = {
  jd: "",
  resume: "",
};

export const INTERVIEW_SESSION_INITIAL_VALUES: InterviewSession = {
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
};
