import {
  INTERVIEW_HISTORY_MAX_ITEMS,
  INTERVIEW_SESSION_INITIAL_VALUES,
  SETUP_FORM_INITIAL_VALUES,
  STORAGE_KEYS,
} from "@/lib/constants";
import type {
  ResumeAnalysis,
  ResumeAnalysisCache,
  ResumeChatMessage,
  ResumeJdMatch,
  ResumeJdMatchCache,
  SourceSignature,
} from "@/types/resume";
import type {
  InterviewAnswer,
  InterviewHistoryItem,
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

function isInterviewQuestionKind(value: unknown) {
  return value === "main" || value === "follow_up";
}

function isFollowUpRound(value: unknown) {
  return value === 1 || value === 2 || value === 3;
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
    "followUpRound" in data &&
    typeof data.followUpRound !== "undefined" &&
    !isFollowUpRound(data.followUpRound)
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

  if (
    "followUpHint" in data &&
    typeof data.followUpHint !== "undefined" &&
    data.followUpHint !== null &&
    typeof data.followUpHint !== "string"
  ) {
    return false;
  }

  return true;
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

function isInterviewHistoryItem(value: unknown): value is InterviewHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.id === "string" &&
    typeof data.createdAt === "string" &&
    isSetupFormData(data.setup) &&
    Array.isArray(data.questions) &&
    data.questions.every(isInterviewQuestion) &&
    Array.isArray(data.answers) &&
    data.answers.every(isInterviewAnswer) &&
    isInterviewReport(data.report)
  );
}

function isInterviewHistory(value: unknown): value is InterviewHistoryItem[] {
  return Array.isArray(value) && value.every(isInterviewHistoryItem);
}

function isResumeAnalysis(value: unknown): value is ResumeAnalysis {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.summary === "string" &&
    Array.isArray(data.strengths) &&
    data.strengths.every((item) => typeof item === "string") &&
    Array.isArray(data.risks) &&
    data.risks.every((item) => typeof item === "string") &&
    Array.isArray(data.suggestedImprovements) &&
    data.suggestedImprovements.every((item) => typeof item === "string") &&
    Array.isArray(data.keywords) &&
    data.keywords.every((item) => typeof item === "string")
  );
}

function isSourceSignature(value: unknown): value is SourceSignature {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    data.version === 1 &&
    typeof data.normalizedLength === "number" &&
    Number.isInteger(data.normalizedLength) &&
    data.normalizedLength >= 0 &&
    typeof data.checksum === "number" &&
    Number.isInteger(data.checksum) &&
    data.checksum >= 0
  );
}

function isResumeAnalysisCache(value: unknown): value is ResumeAnalysisCache {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    isResumeAnalysis(data.result) &&
    (data.sourceSignature === null || isSourceSignature(data.sourceSignature))
  );
}

function isResumeJdMatch(value: unknown): value is ResumeJdMatch {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.matchScore === "number" &&
    typeof data.summary === "string" &&
    Array.isArray(data.matchedSkills) &&
    data.matchedSkills.every((item) => typeof item === "string") &&
    Array.isArray(data.missingSkills) &&
    data.missingSkills.every((item) => typeof item === "string") &&
    Array.isArray(data.risks) &&
    data.risks.every((item) => typeof item === "string") &&
    Array.isArray(data.suggestions) &&
    data.suggestions.every((item) => typeof item === "string")
  );
}

function isResumeJdMatchCache(value: unknown): value is ResumeJdMatchCache {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  if (!isResumeJdMatch(data.result)) {
    return false;
  }

  if (data.sourceSignature === null) {
    return true;
  }

  if (!data.sourceSignature || typeof data.sourceSignature !== "object") {
    return false;
  }

  const sourceSignature = data.sourceSignature as Record<string, unknown>;

  return (
    isSourceSignature(sourceSignature.resume) &&
    isSourceSignature(sourceSignature.jd)
  );
}

function isResumeChatMessage(value: unknown): value is ResumeChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.id === "string" &&
    (data.role === "user" || data.role === "assistant") &&
    typeof data.content === "string" &&
    typeof data.createdAt === "string"
  );
}

function isResumeChatMessages(value: unknown): value is ResumeChatMessage[] {
  return Array.isArray(value) && value.every(isResumeChatMessage);
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

export function readInterviewHistory(): InterviewHistoryItem[] {
  if (!isBrowser()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.interviewHistory);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (isInterviewHistory(parsedValue)) {
      return parsedValue;
    }
  } catch {
    return [];
  }

  return [];
}

export function readInterviewHistoryItemById(id: string): InterviewHistoryItem | null {
  if (!isBrowser() || !id) {
    return null;
  }

  try {
    return readInterviewHistory().find((item) => item.id === id) ?? null;
  } catch {
    return null;
  }
}

function saveInterviewHistory(values: InterviewHistoryItem[]) {
  if (!isBrowser()) {
    return;
  }

  if (values.length === 0) {
    window.localStorage.removeItem(STORAGE_KEYS.interviewHistory);
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.interviewHistory,
    JSON.stringify(values),
  );
}

export function appendInterviewHistory(value: InterviewHistoryItem) {
  if (!isBrowser()) {
    return;
  }

  try {
    const nextHistory = [value, ...readInterviewHistory().filter((item) => item.id !== value.id)]
      .slice(0, INTERVIEW_HISTORY_MAX_ITEMS);

    saveInterviewHistory(nextHistory);
  } catch {
    return;
  }
}

export function deleteInterviewHistoryItem(id: string) {
  if (!isBrowser()) {
    return;
  }

  try {
    const nextHistory = readInterviewHistory().filter((item) => item.id !== id);

    saveInterviewHistory(nextHistory);
  } catch {
    return;
  }
}

export function clearInterviewHistory() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.interviewHistory);
}

export function readResumeDraft(): string {
  if (!isBrowser()) {
    return "";
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.resumeDraft);

  return typeof rawValue === "string" ? rawValue : "";
}

export function saveResumeDraft(value: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.resumeDraft, value);
}

export function clearResumeDraft() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.resumeDraft);
}

export function readResumeAnalysisCache(): ResumeAnalysisCache | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.resumeAnalysis);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (isResumeAnalysisCache(parsedValue)) {
      return parsedValue;
    }

    if (
      parsedValue &&
      typeof parsedValue === "object" &&
      "result" in parsedValue &&
      isResumeAnalysis(parsedValue.result)
    ) {
      return {
        result: parsedValue.result,
        sourceSignature: null,
      };
    }

    if (isResumeAnalysis(parsedValue)) {
      return {
        result: parsedValue,
        sourceSignature: null,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function readResumeAnalysis(): ResumeAnalysis | null {
  return readResumeAnalysisCache()?.result ?? null;
}

export function saveResumeAnalysisCache(values: ResumeAnalysisCache) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEYS.resumeAnalysis,
    JSON.stringify(values),
  );
}

export function saveResumeAnalysis(values: ResumeAnalysis) {
  saveResumeAnalysisCache({
    result: values,
    sourceSignature: null,
  });
}

export function clearResumeAnalysis() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.resumeAnalysis);
}

export function readResumeChatMessages(): ResumeChatMessage[] {
  if (!isBrowser()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.resumeChat);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (isResumeChatMessages(parsedValue)) {
      return parsedValue;
    }
  } catch {
    return [];
  }

  return [];
}

export function saveResumeChatMessages(values: ResumeChatMessage[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.resumeChat, JSON.stringify(values));
}

export function clearResumeChatMessages() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.resumeChat);
}

export function readResumeJdDraft(): string {
  if (!isBrowser()) {
    return "";
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.resumeJdDraft);

  return typeof rawValue === "string" ? rawValue : "";
}

export function saveResumeJdDraft(value: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.resumeJdDraft, value);
}

export function clearResumeJdDraft() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.resumeJdDraft);
}

export function readResumeJdMatchCache(): ResumeJdMatchCache | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.resumeJdMatch);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (isResumeJdMatchCache(parsedValue)) {
      return parsedValue;
    }

    if (
      parsedValue &&
      typeof parsedValue === "object" &&
      "result" in parsedValue &&
      isResumeJdMatch(parsedValue.result)
    ) {
      return {
        result: parsedValue.result,
        sourceSignature: null,
      };
    }

    if (isResumeJdMatch(parsedValue)) {
      return {
        result: parsedValue,
        sourceSignature: null,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function readResumeJdMatch(): ResumeJdMatch | null {
  return readResumeJdMatchCache()?.result ?? null;
}

export function saveResumeJdMatchCache(value: ResumeJdMatchCache) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.resumeJdMatch, JSON.stringify(value));
}

export function saveResumeJdMatch(value: ResumeJdMatch) {
  saveResumeJdMatchCache({
    result: value,
    sourceSignature: null,
  });
}

export function clearResumeJdMatch() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.resumeJdMatch);
}
