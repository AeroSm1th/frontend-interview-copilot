"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  readResumeDraft,
  readResumeJdDraft,
  readSetupForm,
  saveResumeDraft,
  saveResumeJdDraft,
} from "@/lib/storage";

export default function SetupPage() {
  const router = useRouter();

  useEffect(() => {
    const setupForm = readSetupForm();
    const resumeDraft = readResumeDraft();
    const jdDraft = readResumeJdDraft();

    if (!resumeDraft.trim() && setupForm.resume.trim()) {
      saveResumeDraft(setupForm.resume);
    }

    if (!jdDraft.trim() && setupForm.jd.trim()) {
      saveResumeJdDraft(setupForm.jd);
    }

    router.replace("/analysis");
  }, [router]);

  return null;
}
