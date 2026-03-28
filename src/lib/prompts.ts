import "server-only";

import type { InterviewAnswer, InterviewQuestion } from "@/types/interview";
import type { ResumeAnalysis, ResumeChatMessage } from "@/types/resume";

type GenerateQuestionsPromptInput = {
  jd: string;
  resume: string;
};

type GenerateReportPromptInput = {
  jd: string;
  resume: string;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
};

type AnalyzeResumePromptInput = {
  resume: string;
};

type ResumeChatPromptInput = {
  resume: string;
  analysis: ResumeAnalysis;
  question: string;
  messages?: ResumeChatMessage[];
};

type ResumeJdMatchPromptInput = {
  resume: string;
  jd: string;
  analysis?: ResumeAnalysis | null;
};

export function buildGenerateQuestionsPrompts({
  jd,
  resume,
}: GenerateQuestionsPromptInput) {
  const systemPrompt = `你是一名负责前端实习生模拟面试的面试官。

你的任务是根据用户提供的岗位 JD 和简历内容，生成 5 道适合前端实习或校招场景的中文面试题。

要求：
1. 必须参考 JD 和简历内容。
2. 题目难度偏前端实习/校招，不要过难。
3. 题目要覆盖基础知识、项目经历、工程实践。
4. 不要生成重复题目。
5. 只返回 JSON，不要返回 markdown，不要添加额外解释。
6. JSON 格式必须严格如下：
{
  "questions": [
    { "id": "q1", "question": "..." },
    { "id": "q2", "question": "..." },
    { "id": "q3", "question": "..." },
    { "id": "q4", "question": "..." },
    { "id": "q5", "question": "..." }
  ]
}`;

  const userPrompt = `请基于下面信息生成面试题。

岗位 JD：
${jd}

简历内容：
${resume}`;

  return {
    systemPrompt,
    userPrompt,
  };
}

export function buildGenerateReportPrompts({
  jd,
  resume,
  questions,
  answers,
}: GenerateReportPromptInput) {
  const systemPrompt = `你是一名负责前端实习生和校招生模拟面试复盘的面试官。

你的任务是根据岗位 JD、简历内容、面试题目和用户回答，输出一份简洁、具体、可执行的中文面试报告。

要求：
1. 评估视角以“前端实习/校招面试”为准。
2. 给出总分、总结、优势、薄弱点、建议。
3. strengths、weaknesses、suggestions 各至少 2 条。
4. 结论要具体，尽量结合回答质量、完整度、项目表达和工程实践意识。
5. 只返回 JSON，不要返回 markdown，不要添加额外解释。
6. JSON 格式必须严格如下：
{
  "score": 0,
  "summary": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."]
}`;

  const userPrompt = `请基于下面信息生成面试复盘报告。

岗位 JD：
${jd}

简历内容：
${resume}

面试题目：
${JSON.stringify(questions, null, 2)}

用户回答：
${JSON.stringify(answers, null, 2)}`;

  return {
    systemPrompt,
    userPrompt,
  };
}

export function buildAnalyzeResumePrompts({
  resume,
}: AnalyzeResumePromptInput) {
  const systemPrompt = `你是一名前端实习生和校招生求职场景下的简历分析助手。

你的任务是根据用户提供的简历文本，输出一份简洁、具体、可执行的中文简历分析结果。

要求：
1. 分析视角必须以“前端实习/校招岗位”为准。
2. 输出总结、优势、风险点、改进建议、关键词。
3. strengths、risks、suggestedImprovements 各至少 2 条。
4. 关键词应提炼核心技术栈、项目亮点或岗位匹配点。
5. 结论要避免空话，尽量指出可以直接修改简历或补充表达的方向。
6. 只返回 JSON，不要返回 markdown，不要添加额外解释。
7. JSON 格式必须严格如下：
{
  "summary": "...",
  "strengths": ["...", "..."],
  "risks": ["...", "..."],
  "suggestedImprovements": ["...", "..."],
  "keywords": ["...", "..."]
}`;

  const userPrompt = `请分析下面这份简历文本，并给出结构化建议。

简历文本：
${resume}`;

  return {
    systemPrompt,
    userPrompt,
  };
}

export function buildResumeChatPrompts({
  resume,
  analysis,
  question,
  messages = [],
}: ResumeChatPromptInput) {
  const recentMessages = messages.slice(-6);
  const recentMessagesText =
    recentMessages.length > 0
      ? recentMessages
          .map((message) =>
            `${message.role === "user" ? "用户" : "助手"}：${message.content}`,
          )
          .join("\n\n")
      : "无";

  const systemPrompt = `你是一名前端实习生和校招生求职场景下的简历问答助手。

你的任务是基于用户提供的简历文本、已有简历分析结果和当前问题，给出简洁、具体、可执行的中文回答。

要求：
1. 回答视角必须以“前端实习/校招岗位”为准。
2. 回答必须优先参考简历文本和已有分析结果，不要脱离上下文。
3. 不要编造简历中没有的信息；如果信息不足，要明确说明。
4. 语气要自然、直接，尽量给出能立刻使用的表达建议或修改建议。
5. 不要输出大段 Markdown 标题，不要添加无关寒暄。
6. 如果用户询问项目亮点、自我介绍、风险点、追问准备等，请尽量结合简历内容给出示例表达。`;

  const userPrompt = `请基于下面信息回答用户问题。

简历文本：
${resume}

已有简历分析结果：
${JSON.stringify(analysis, null, 2)}

最近对话：
${recentMessagesText}

当前问题：
${question}`;

  return {
    systemPrompt,
    userPrompt,
  };
}

export function buildResumeJdMatchPrompts({
  resume,
  jd,
  analysis,
}: ResumeJdMatchPromptInput) {
  const analysisText = analysis ? JSON.stringify(analysis, null, 2) : "无";

  const systemPrompt = `你是一名前端实习生和校招生求职场景下的岗位匹配分析助手。

你的任务是根据用户提供的简历文本、可选的简历分析结果和岗位 JD，评估这份简历与目标岗位的匹配情况。

要求：
1. 评估视角必须以“前端实习/校招岗位”为准。
2. 回答必须严格基于简历文本、已有分析结果和岗位 JD，不要编造简历中没有的信息。
3. 输出必须为 JSON，不要返回 markdown，不要添加额外解释。
4. matchScore 使用 0 到 100 的整数。
5. matchedSkills、missingSkills、risks、suggestions 应尽量具体，便于用户快速修改简历表达。
6. 文风要简洁、具体、可执行。
7. JSON 格式必须严格如下：
{
  "matchScore": 0,
  "summary": "...",
  "matchedSkills": ["...", "..."],
  "missingSkills": ["...", "..."],
  "risks": ["...", "..."],
  "suggestions": ["...", "..."]
}`;

  const userPrompt = `请基于下面信息分析这份简历与岗位 JD 的匹配情况。

简历文本：
${resume}

已有简历分析结果：
${analysisText}

岗位 JD：
${jd}`;

  return {
    systemPrompt,
    userPrompt,
  };
}
