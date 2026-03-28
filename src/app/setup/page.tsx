"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
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

  return (
    <PageContainer className="flex items-center">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <PageHeader
          title="正在迁移到新的分析工作台"
          description="`/setup` 已经退出正式主流程。系统会尽量把你当前浏览器中的简历和 JD 草稿带到 /analysis，并从那里继续开始模拟面试。"
        />
        <div className="rounded-2xl bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
          正在跳转到 /analysis...
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/analysis"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            立即前往 /analysis
          </Link>
          <Link
            href="/resume"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            返回 /resume
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
