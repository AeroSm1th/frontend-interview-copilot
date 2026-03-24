import { SETUP_FORM_LIMITS } from "@/lib/constants";
import type {
  SetupFormData,
  SetupFormErrors,
  SetupFormValidationResult,
} from "@/types/interview";

export function validateSetupForm(
  values: SetupFormData,
): SetupFormValidationResult {
  const errors: SetupFormErrors = {};
  const jdLength = values.jd.trim().length;
  const resumeLength = values.resume.trim().length;

  if (jdLength === 0) {
    errors.jd = "请输入目标岗位 JD。";
  } else if (jdLength < SETUP_FORM_LIMITS.jdMinLength) {
    errors.jd = `JD 至少需要 ${SETUP_FORM_LIMITS.jdMinLength} 个字符。`;
  }

  if (resumeLength === 0) {
    errors.resume = "请输入简历内容。";
  } else if (resumeLength < SETUP_FORM_LIMITS.resumeMinLength) {
    errors.resume = `简历内容至少需要 ${SETUP_FORM_LIMITS.resumeMinLength} 个字符。`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
