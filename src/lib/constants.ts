import type { SetupFormData } from "@/types/interview";

export const STORAGE_KEYS = {
  setupForm: "frontend-interview-copilot.setup-form",
} as const;

export const SETUP_FORM_LIMITS = {
  jdMinLength: 20,
  resumeMinLength: 50,
} as const;

export const SETUP_FORM_INITIAL_VALUES: SetupFormData = {
  jd: "",
  resume: "",
};
