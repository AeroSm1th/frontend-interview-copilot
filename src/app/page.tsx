import Link from "next/link";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

const capabilitySections = [
  {
    eyebrow: "Resume Review",
    title: "先把简历和岗位信息看明白",
    description:
      "支持简历文本输入、.md 导入、AI 简历分析、JD 匹配和简历聊天，帮助你先整理表达和岗位贴合度。",
    items: ["简历输入与 .md 导入", "AI 简历分析", "JD 匹配分析", "围绕简历继续追问"],
  },
  {
    eyebrow: "Mock Interview",
    title: "再进入一轮轻量前端模拟面试",
    description:
      "基于目标 JD 和简历内容生成 5 道前端题，保留当前会话进度，让整条链路更接近真实准备场景。",
    items: ["基于 JD + Resume 生成题目", "固定 5 道前端题", "逐题作答", "本地保存面试进度"],
  },
  {
    eyebrow: "Report & History",
    title: "最后用复盘和历史记录沉淀结果",
    description:
      "系统会生成综合评分、总结、优势、薄弱点与建议，并把完整快照保存在当前浏览器里便于回看。",
    items: ["AI 复盘报告", "综合评分", "优势 / 薄弱点 / 建议", "本地历史与详情页"],
  },
] as const;

const flowSteps = [
  {
    title: "Resume",
    description: "整理简历内容，导入或输入文本，先看 AI 分析与 JD 匹配。",
  },
  {
    title: "Setup",
    description: "确认目标岗位 JD 和简历信息，准备开始本轮模拟面试。",
  },
  {
    title: "Interview",
    description: "按题目顺序逐题作答，完成一轮简洁但完整的前端问答。",
  },
  {
    title: "Report",
    description: "查看综合评分、总结和后续改进建议，明确下一步准备方向。",
  },
  {
    title: "History",
    description: "把每轮完整快照保存在本地，方便回看不同练习记录。",
  },
] as const;

const quickLinks = [
  {
    title: "开始模拟面试",
    description: "直接进入设置页，基于岗位 JD 和简历生成 5 道前端题。",
    href: "/setup",
    actionLabel: "进入 /setup",
    accentClass: "bg-zinc-900 text-white border-zinc-900",
    actionClass: "text-white/90",
  },
  {
    title: "先优化简历",
    description: "先做简历分析、JD 匹配和简历聊天，再把内容带入模拟面试。",
    href: "/resume",
    actionLabel: "进入 /resume",
    accentClass: "bg-white text-zinc-900 border-zinc-200",
    actionClass: "text-zinc-500",
  },
  {
    title: "查看历史记录",
    description: "打开本地历史列表和详情页，回看之前每一轮模拟面试的结果。",
    href: "/history",
    actionLabel: "进入 /history",
    accentClass: "bg-white text-zinc-900 border-zinc-200",
    actionClass: "text-zinc-500",
  },
] as const;

export default function Home() {
  return (
    <PageContainer>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.08),_transparent_48%)]" />

          <div className="relative flex flex-col gap-8">
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1 text-sm font-medium text-zinc-600">
                AI Frontend Interview Copilot
              </span>
              <span className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-1 text-sm font-medium text-zinc-500">
                Resume Review + Mock Interview + Local History
              </span>
            </div>

            <PageHeader
              title="一个面向前端求职准备的 AI 面试陪练与简历辅助产品"
              description="你可以先分析简历、做 JD 匹配和简历聊天，再进入模拟面试，最后查看 AI 复盘报告与本地历史记录。首页只负责介绍产品和提供入口，不改变现有业务流程。"
              align="center"
            />

            <div className="grid gap-3 lg:grid-cols-3">
              <article className="rounded-2xl border border-zinc-200 bg-white/80 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Resume Review
                </p>
                <p className="mt-3 text-lg font-semibold text-zinc-900">
                  从简历分析开始，而不是直接盲练
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  先用简历分析、JD 匹配和简历聊天找到表达缺口，再把内容带入正式模拟。
                </p>
              </article>

              <article className="rounded-2xl border border-zinc-200 bg-zinc-900 p-5 text-white">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
                  Mock Interview
                </p>
                <p className="mt-3 text-lg font-semibold">
                  基于岗位和简历生成一轮真实感更强的前端题目
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  当前版本聚焦 5 道前端题，保持流程轻量，但足够完成一轮可展示的练习闭环。
                </p>
              </article>

              <article className="rounded-2xl border border-zinc-200 bg-white/80 p-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Report & History
                </p>
                <p className="mt-3 text-lg font-semibold text-zinc-900">
                  用评分、总结和历史详情沉淀每次练习结果
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  复盘结果和完整历史快照保存在当前浏览器，适合本地回看和连续练习。
                </p>
              </article>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/setup"
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                开始模拟面试
              </Link>
              <Link
                href="/resume"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                先优化简历
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                查看历史记录
              </Link>
            </div>

            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-4 text-center text-sm text-zinc-500">
              当前版本使用浏览器本地存储，无登录、无云同步，重点展示完整的前端求职练习链路。
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              核心能力概览
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              首页先讲清楚产品价值，再把用户带到现有功能里
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-zinc-600">
              这次首页升级不新增业务能力，只把已经完成的主要页面和产品链路更清晰地组织出来，方便展示和投递。
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {capabilitySections.map((section) => (
              <article
                key={section.eyebrow}
                className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5"
              >
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  {section.eyebrow}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-zinc-900">
                  {section.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  {section.description}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              使用流程
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              一条简洁但完整的求职练习路径
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-zinc-600">
              从准备材料到复盘沉淀，首页直接把核心步骤讲清楚，用户第一次打开也能知道从哪里开始。
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {flowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5"
              >
                <p className="text-sm font-medium text-zinc-500">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-zinc-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              快速入口
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              直接进入你现在最需要的那一步
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-zinc-600">
              首页只提供导航与介绍，不接管业务逻辑。所有入口都直连已经存在的页面和流程。
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group rounded-2xl border p-5 shadow-sm transition-transform hover:-translate-y-0.5 ${link.accentClass}`}
              >
                <div className="flex h-full flex-col justify-between gap-5">
                  <div>
                    <h3 className="text-lg font-semibold">{link.title}</h3>
                    <p
                      className={`mt-2 text-sm leading-7 ${
                        link.href === "/setup" ? "text-zinc-300" : "text-zinc-600"
                      }`}
                    >
                      {link.description}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${link.actionClass}`}>
                    {link.actionLabel}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
