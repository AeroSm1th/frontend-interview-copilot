export type InterviewQuestion = {
  id: string;
  question: string;
  kind?: "main" | "follow_up";
  parentQuestionId?: string | null;
  followUpRound?: 1 | 2 | 3;
  followUpStatus?: "pending" | "generated" | "skipped";
  followUpHint?: string | null;
};

export type InterviewMode = "standard" | "targeted_practice";

export type InterviewTargetedContext = {
  source: "report";
  focusWeaknesses: string[];
  focusSuggestions: string[];
};

export type SetupFormData = {
  jd: string;
  resume: string;
};

export type SetupFormField = keyof SetupFormData;

export type SetupFormErrors = Partial<Record<SetupFormField, string>>;

export type SetupFormValidationResult = {
  isValid: boolean;
  errors: SetupFormErrors;
};

export type InterviewAnswer = {
  questionId: string;
  answer: string;
};

export type InterviewSession = {
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: InterviewAnswer[];
  mode?: InterviewMode;
  targetedContext?: InterviewTargetedContext | null;
};

export type InterviewReport = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
};

export type InterviewHistoryItem = {
  id: string;
  createdAt: string;
  setup: SetupFormData;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  report: InterviewReport;
  mode?: InterviewMode;
  targetedContext?: InterviewTargetedContext | null;
};
