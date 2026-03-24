export type InterviewQuestion = {
  id: string;
  question: string;
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

export type InterviewReport = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
};
