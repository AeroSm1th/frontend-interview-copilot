import Link from "next/link";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

export default function Home() {
  return (
    <PageContainer className="flex items-center">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center rounded-3xl border border-zinc-200 bg-white px-8 py-16 text-center shadow-sm">
        <span className="mb-4 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1 text-sm font-medium text-zinc-600">
          Frontend Interview Copilot
        </span>
        <PageHeader
          title="用一轮轻量模拟面试，快速定位前端准备方向"
          description="输入目标岗位 JD 和简历内容，完成模拟问答后查看复盘报告。当前页面仅搭建基础骨架。"
          align="center"
        />
        <Link
          href="/setup"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          进入设置页
        </Link>
      </section>
    </PageContainer>
  );
}
