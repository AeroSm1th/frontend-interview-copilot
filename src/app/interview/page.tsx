import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

export default function InterviewPage() {
  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <PageHeader
          title="模拟面试"
          description="当前页面先提供题目区、回答区和进度占位，后续再接入真实题目与提交流程。"
        />

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">当前进度</p>
              <p className="mt-1 text-base font-semibold text-zinc-900">
                第 1 / 5 题
              </p>
            </div>
            <div className="w-36 rounded-full bg-zinc-100 p-1">
              <div className="h-2 w-1/5 rounded-full bg-zinc-900" />
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-5">
            <p className="text-sm font-medium text-zinc-500">题目区域</p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">
              请介绍一下 React 中状态更新与组件渲染之间的关系。
            </h2>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <label
              htmlFor="answer-content"
              className="text-sm font-medium text-zinc-800"
            >
              回答输入区域
            </label>
            <textarea
              id="answer-content"
              placeholder="请输入你的回答"
              className="min-h-56 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
