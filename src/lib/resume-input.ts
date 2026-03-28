import { RESUME_UPLOAD_LIMITS, SETUP_FORM_LIMITS } from "@/lib/constants";

export function getResumeValidationMessage(resume: string) {
  const length = resume.trim().length;

  if (length === 0) {
    return "请输入简历内容。";
  }

  if (length < SETUP_FORM_LIMITS.resumeMinLength) {
    return `简历内容至少需要 ${SETUP_FORM_LIMITS.resumeMinLength} 个字符。`;
  }

  return "";
}

export function getJdValidationMessage(jd: string) {
  const length = jd.trim().length;

  if (length === 0) {
    return "请输入岗位 JD。";
  }

  if (length < SETUP_FORM_LIMITS.jdMinLength) {
    return `岗位 JD 至少需要 ${SETUP_FORM_LIMITS.jdMinLength} 个字符。`;
  }

  return "";
}

export function isAcceptedResumeFile(file: File) {
  const normalizedFileName = file.name.toLowerCase();
  const hasAcceptedExtension = RESUME_UPLOAD_LIMITS.acceptedExtensions.some((extension) =>
    normalizedFileName.endsWith(extension),
  );
  const hasAcceptedMimeType = RESUME_UPLOAD_LIMITS.acceptedMimeTypes.some(
    (mimeType) => mimeType === file.type,
  );

  return hasAcceptedExtension || hasAcceptedMimeType;
}

export function getResumeFileValidationMessage(file: File) {
  if (!isAcceptedResumeFile(file)) {
    return "只支持上传 .md 简历文件。";
  }

  if (file.size === 0) {
    return "文件内容为空，请检查后重试。";
  }

  if (file.size > RESUME_UPLOAD_LIMITS.maxFileSizeInBytes) {
    return `文件不能超过 ${RESUME_UPLOAD_LIMITS.maxFileSizeLabel}。`;
  }

  return "";
}

export function getResumeFileReadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "读取文件失败，请重试。";
}
