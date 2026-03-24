import type { InterviewQuestion } from "@/types/interview";

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
