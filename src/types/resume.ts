export type ResumeAnalysis = {
  summary: string;
  strengths: string[];
  risks: string[];
  suggestedImprovements: string[];
  keywords: string[];
};

export type SourceSignature = {
  version: 1;
  normalizedLength: number;
  checksum: number;
};

export type ResumeAnalysisCache = {
  result: ResumeAnalysis;
  sourceSignature: SourceSignature | null;
};

export type ResumeJdMatch = {
  matchScore: number;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  risks: string[];
  suggestions: string[];
};

export type ResumeJdMatchCache = {
  result: ResumeJdMatch;
  sourceSignature:
    | {
        resume: SourceSignature;
        jd: SourceSignature;
      }
    | null;
};

export type ResumeChatRole = "user" | "assistant";

export type ResumeChatMessage = {
  id: string;
  role: ResumeChatRole;
  content: string;
  createdAt: string;
};
