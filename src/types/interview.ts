export type InterviewQuestion = {
  id: string;
  question: string;
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
