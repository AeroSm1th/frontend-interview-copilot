import type {
  InterviewQuestion,
  InterviewReport,
  InterviewSession,
  SetupFormData,
} from "@/types/interview";

export const MOCK_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: "react-component",
    question:
      "请介绍一下 React 函数组件和类组件的主要区别，以及为什么现在更常使用函数组件。",
  },
  {
    id: "js-closure",
    question: "什么是 JavaScript 闭包？请结合一个你能想到的前端场景说明它的用途。",
  },
  {
    id: "css-layout",
    question:
      "如果要实现一个常见的两栏布局，左侧固定宽度、右侧自适应，你会有哪些实现方式？",
  },
  {
    id: "browser-rendering",
    question:
      "从浏览器输入一个 URL 到页面显示出来，中间大致会经历哪些关键过程？",
  },
  {
    id: "project-experience",
    question:
      "请挑一个你做过的前端项目，说明你负责了什么、遇到了什么问题，以及你是怎么解决的。",
  },
];

function clampScore(score: number) {
  return Math.max(0, Math.min(score, 100));
}

export function generateMockInterviewReport(
  session: InterviewSession,
  setupForm: SetupFormData,
): InterviewReport {
  const answers = Object.values(session.answers);
  const answeredCount = answers.filter((answer) => Boolean(answer.trim())).length;
  const totalAnswerLength = answers.reduce(
    (total, answer) => total + answer.trim().length,
    0,
  );
  const unansweredCount = MOCK_INTERVIEW_QUESTIONS.length - answeredCount;
  const averageAnswerLength =
    answeredCount === 0 ? 0 : Math.round(totalAnswerLength / answeredCount);
  const score = clampScore(
    48 +
      answeredCount * 8 +
      Math.min(Math.floor(totalAnswerLength / 40), 24) +
      (setupForm.resume.trim().length >= 120 ? 4 : 0),
  );

  const summary =
    answeredCount === 0
      ? "你已经完成了本次 mock 面试流程，但当前回答内容较少，建议下一轮尽量把每道题的思路展开。"
      : answeredCount >= 4 && averageAnswerLength >= 60
        ? "整体表现比较稳定，回答覆盖度较高，已经具备较好的前端实习面试表达基础。"
        : "你已经完成了一轮基础 mock 面试，当前更适合继续加强回答展开度和案例表达。";

  const strengths = [
    answeredCount >= 4
      ? "题目完成度较高，说明你能够持续推进整轮面试。"
      : "已经开始建立完整的模拟面试流程，这是很好的准备动作。",
    totalAnswerLength >= 300
      ? "回答字数相对充足，说明你愿意主动展开思路。"
      : "回答风格较简洁，便于后续针对性补强重点内容。",
    setupForm.resume.trim().length >= 120
      ? "简历信息较完整，有利于后续围绕项目经历继续深挖表达。"
      : "当前输入信息比较轻量，后续可以继续补充项目细节来提升练习质量。",
  ];

  const weaknesses = [
    unansweredCount > 0
      ? `还有 ${unansweredCount} 道题没有形成有效回答，可以继续补齐完整度。`
      : "所有题目都已覆盖，下一步可以重点优化回答质量与表达结构。",
    averageAnswerLength < 50
      ? "单题回答普遍偏短，容易在真实面试中显得论述不够完整。"
      : "回答已经有一定展开度，但还可以继续增强细节与案例支撑。",
    totalAnswerLength < 250
      ? "整体输出量偏少，说明项目细节和知识点表达还有提升空间。"
      : "整体输出量不错，但可以进一步压缩无关内容、突出重点。"
  ];

  const suggestions = [
    unansweredCount > 0
      ? "下一轮先保证 5 道题都至少给出完整的一版回答。"
      : "下一轮可以给每道题加入更清晰的开头、展开和总结结构。",
    "尽量把项目经历和技术点绑定起来，用具体场景说明你的思考过程。",
    averageAnswerLength < 60
      ? "每道题至少补充到 3 个要点，避免只停留在定义层面。"
      : "在回答较完整的基础上，继续打磨表达顺序和关键词总结。 ",
  ];

  return {
    score,
    summary,
    strengths,
    weaknesses,
    suggestions,
  };
}
