import { SETUP_FORM_INITIAL_VALUES, STORAGE_KEYS } from "@/lib/constants";
import type { SetupFormData } from "@/types/interview";

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
