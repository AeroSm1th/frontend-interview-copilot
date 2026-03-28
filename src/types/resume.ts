export type ResumeAnalysis = {
  summary: string;
  strengths: string[];
  risks: string[];
  suggestedImprovements: string[];
  keywords: string[];
};

export type ResumeJdMatch = {
  matchScore: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  risks: string[];
  suggestions: string[];
};

export type ResumeChatRole = "user" | "assistant";

export type ResumeChatMessage = {
  id: string;
  role: ResumeChatRole;
  content: string;
  createdAt: string;
};
