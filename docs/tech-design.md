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