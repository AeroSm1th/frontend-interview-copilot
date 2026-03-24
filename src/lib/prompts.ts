import "server-only";

type GenerateQuestionsPromptInput = {
  jd: string;
  resume: string;
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
