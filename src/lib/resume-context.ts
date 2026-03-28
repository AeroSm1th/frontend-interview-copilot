import {
  areSourceSignaturesEqual,
  createSourceSignature,
} from "@/lib/source-signature";
import {
  readResumeAnalysisCache,
  readResumeDraft,
  readResumeJdDraft,
  readResumeJdMatchCache,
} from "@/lib/storage";
import type { ResumeAnalysis, ResumeJdMatch } from "@/types/resume";

type GetReusableResumeContextInput = {
  resume: string;
  jd: string;
};

type ReusableResumeContext = {
  reusableAnalysis?: ResumeAnalysis;
  reusableJdMatch?: ResumeJdMatch;
};

export function getReusableResumeContext({
  resume,
  jd,
}: GetReusableResumeContextInput): ReusableResumeContext {
  const currentResumeSignature = createSourceSignature(resume);
  const currentJdSignature = createSourceSignature(jd);
  const currentResumeDraft = readResumeDraft();
  const currentResumeAnalysisCache = readResumeAnalysisCache();
  const currentResumeJdDraft = readResumeJdDraft();
  const currentResumeJdMatchCache = readResumeJdMatchCache();

  const reusableAnalysis =
    currentResumeAnalysisCache?.sourceSignature
      ? areSourceSignaturesEqual(
          currentResumeAnalysisCache.sourceSignature,
          currentResumeSignature,
        )
        ? currentResumeAnalysisCache.result
        : undefined
      : resume === currentResumeDraft && currentResumeAnalysisCache
        ? currentResumeAnalysisCache.result
        : undefined;

  const reusableJdMatch =
    currentResumeJdMatchCache?.sourceSignature
      ? areSourceSignaturesEqual(
          currentResumeJdMatchCache.sourceSignature.resume,
          currentResumeSignature,
        ) &&
        areSourceSignaturesEqual(
          currentResumeJdMatchCache.sourceSignature.jd,
          currentJdSignature,
        )
        ? currentResumeJdMatchCache.result
        : undefined
      : resume === currentResumeDraft &&
          jd === currentResumeJdDraft &&
          currentResumeJdMatchCache
        ? currentResumeJdMatchCache.result
        : undefined;

  return {
    reusableAnalysis,
    reusableJdMatch,
  };
}
