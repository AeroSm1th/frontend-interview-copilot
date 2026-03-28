export type InterviewQuestion = {
  id: string;
  question: string;
  kind?: "main" | "follow_up";
  parentQuestionId?: string | null;
  followUpRound?: 1 | 2 | 3;
  followUpStatus?: "pending" | "generated" | "skipped";
  followUpHint?: string | null;
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
};
