# Tech Design

## 技术选型
- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI API
- localStorage

## 页面结构
- `/` 首页
- `/setup` 输入页
- `/interview` 面试页
- `/report` 报告页

## 数据结构草案

### InterviewQuestion
```ts
type InterviewQuestion = {
  id: string;
  question: string;
};

### InterviewAnswer
```ts
type InterviewAnswer = {
  questionId: string;
  answer: string;
};

### InterviewReport
```ts
type InterviewReport = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
};

## 状态流
- 用户输入 JD + 简历
- 请求 AI 生成题目
- 保存题目到前端状态
- 用户逐题回答
- 提交全部回答
- 请求 AI 生成报告
- 展示报告页

## 存储方案
- 使用 localStorage 暂存：
 - JD
 - 简历内容
 - 题目列表
 - 回答内容
 - 最终报告