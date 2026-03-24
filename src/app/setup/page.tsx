import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

export default function SetupPage() {
  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <PageHeader
          title="填写目标岗位信息"
          description="先输入岗位 JD 和简历内容，后续版本会在这里触发题目生成。当前仅展示页面结构。"
        />

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-3">
              <label
                htmlFor="job-description"
                className="text-sm font-medium text-zinc-800"
              >
                目标岗位 JD
              </label>
              <textarea
                id="job-description"
                placeholder="请粘贴岗位描述内容"
                className="min-h-40 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>

            <div className="space-y-3">
              <label
                htmlFor="resume-content"
                className="text-sm font-medium text-zinc-800"
              >
                简历内容
              </label>
              <textarea
                id="resume-content"
                placeholder="请粘贴你的简历内容"
                className="min-h-48 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
