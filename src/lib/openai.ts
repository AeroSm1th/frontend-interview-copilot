import "server-only";

import OpenAI from "openai";

export function createOpenAIClient() {
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error("缺少 DASHSCOPE_API_KEY，无法调用阿里云百炼兼容接口。");
  }

  return new OpenAI({
    apiKey,
    baseURL:
      process.env.DASHSCOPE_BASE_URL ??
      "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });
}
