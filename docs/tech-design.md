# Tech Design

## 1. 技术选型
- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI SDK
- 浏览器 localStorage

## 2. 当前路由结构
- `/`：首页与产品介绍
- `/resume`：输入页
- `/analysis`：分析与面试准备页
- `/interview`：问答页
- `/report`：复盘页
- `/history`：本地历史列表页
- `/history/[id]`：本地历史详情页
- `/setup`：兼容过渡入口

对外统一口径：

当前正式主链路为 `/resume -> /analysis -> /interview -> /report`。

其中 `/history` 和 `/history/[id]` 是正式存在的本地历史查看能力，但不属于主链路步骤；`/setup` 仅用于兼容旧状态迁移，已退出正式主流程。

## 3. 页面职责划分

### `/resume`
- 输入和编辑简历草稿
- 输入目标岗位 JD
- 支持 `.md` 简历导入
- 保存 `resumeDraft` 与 `resumeJdDraft`
- 不负责简历分析、聊天或开始面试以后的流程

### `/analysis`
- 读取 `/resume` 已保存的 source material
- 发起 AI 简历分析
- 发起 AI JD 匹配分析
- 提供简历聊天能力
- 负责开始模拟面试，并写入后续流程需要的上下文

### `/interview`
- 承接分析阶段准备好的题目与上下文
- 负责逐题作答
- 负责在主问题下推进最多 3 轮连续动态追问
- 保存当前问答进度

### `/report`
- 读取当前问答结果
- 生成 AI 复盘报告
- 结合主问题与追问链进行评估
- 成功后写入本地历史记录

### `/history` 与 `/history/[id]`
- 展示已完成练习的本地历史快照
- 历史详情页查看报告、题目、回答、JD 与简历快照
- 题目与回答按线性顺序保留主问题及其后续追问链
- 不与当前进行中的会话状态混用

### `/setup`
- 从旧版 `setupForm` 状态兼容迁移到新的 `resumeDraft` / `resumeJdDraft`
- 自动跳转到 `/analysis`
- 不是当前正式输入页

## 4. WorkspaceShell
`WorkspaceShell` 挂在根布局中，是当前工作区的全局导航壳层，负责：
- 为非首页路由提供统一导航结构
- 展示当前主链路步骤状态
- 在桌面端为分析页预留右侧 sidebar slot

设计约束：
- `WorkspaceShell` 是全局壳层，但 sidebar slot 只在 `/analysis` 可用
- `/setup` 在导航步骤上归入 Analysis，但不会作为正式输入页对外描述
- 其他页面仍处于同一个工作区导航中，但不会渲染聊天侧边栏

## 5. 聊天侧边栏设计
简历聊天由 `/analysis` 页面通过 `AnalysisChatController` 接入，聊天面板遵循以下边界：
- 只在 `/analysis` 激活
- 依赖当前有效的简历内容和简历分析结果
- 桌面端通过 `WorkspaceShell` 提供的 sidebar slot 渲染
- 移动端以 sheet 形式打开
- 不作为全局聊天入口，也不在 `/interview`、`/report`、`/history` 中复用

## 6. 主流程与本地缓存关系

### 6.1 输入阶段
- `resumeDraft`：当前简历草稿，来源于 `/resume`
- `resumeJdDraft`：当前岗位 JD 草稿，来源于 `/resume`

这两个状态是后续 `/analysis` 的输入来源，也是当前正式主链路的起点。

### 6.2 分析阶段
- `resumeAnalysis`：当前简历分析缓存，对应当前 `resumeDraft`
- `resumeJdMatch`：当前 JD 匹配缓存，对应当前 `resumeDraft` + `resumeJdDraft`
- `resumeChat`：当前简历聊天记录，仅服务 `/analysis`

职责边界：
- `resumeAnalysis` 和 `resumeJdMatch` 用于复用当前 source material 的分析结果
- `resumeChat` 依赖当前简历内容与分析上下文，不应被描述为全局聊天系统
- 当上游输入变化时，相关分析/聊天上下文会按当前实现失效并重新生成

### 6.3 面试阶段
- `setupForm`：兼容桥接状态，用于把开始面试时的 `resume` 和 `jd` 传递给 `/interview` 与 `/report`
- `interviewSession`：当前面试题目、答案和进行中的题目索引

职责边界：
- `setupForm` 是流程兼容状态，不是新的正式输入来源
- `interviewSession` 只表示当前正在进行或刚完成的一轮问答
- 动态追问链仍然保存在同一个 `interviewSession` 中，不单独拆分树结构

### 6.4 报告与历史阶段
- `interviewReport`：当前会话对应的复盘报告缓存
- `interviewHistory`：历史快照列表，每条记录包含 setup、questions、answers、report

职责边界：
- `interviewReport` 服务当前结果页展示与重进页面后的读取
- `interviewHistory` 用于沉淀已经生成成功的本地历史记录
- 历史详情读取的是快照，不依赖当前活跃会话

## 7. 动态追问链设计

### 7.1 单一事实来源
- 当前问答数据仍以 `questions[] + answers[]` 作为单一事实来源
- 不引入树结构问答，不单独维护追问树或分支节点
- 追问链通过在线性 `questions[]` 中按实际发生顺序插入题目来表达

### 7.2 InterviewQuestion 轻量扩展
`InterviewQuestion` 在当前实现中通过轻量字段扩展来表达主问题与追问链：
- `kind`：标记当前题是 `main` 还是 `follow_up`
- `parentQuestionId`：始终指向所属主问题 id，不指向上一跳追问
- `followUpRound`：仅 `follow_up` 使用，表示第几轮追问，当前只允许 `1 | 2 | 3`
- `followUpStatus`：表示当前题后续是否已经决定继续生成下一轮追问
- `followUpHint`：用于界面展示的简短追问提示

约束：
- 主问题不填写 `followUpRound`
- `InterviewAnswer` 结构不变，仍然只保存 `questionId + answer`

### 7.3 generate-follow-up 接口
- `/api/generate-follow-up` 当前基于“当前主问题链”工作，而不是只看单次主问题回答
- 接口输入会带上 `mainQuestionId`、当前题信息、当前轮次以及 `questionChain`
- `questionChain` 只包含当前主问题及其已经发生的追问链，不包含整轮面试历史
- 接口输出仍保持 `followUpQuestion: InterviewQuestion | null`
- 当当前轮次已达到第 3 轮时，接口直接返回 `null`

### 7.4 /interview 推进规则
当前问答推进遵循统一规则：
- 主问题回答后，可决定是否进入追问 1
- 追问 1 回答后，可决定是否进入追问 2
- 追问 2 回答后，可决定是否进入追问 3
- 追问 3 回答后必须停止，并进入下一主问题
- 0 / 1 / 2 / 3 轮都可能发生
- 空答案仍允许直接进入下一题
- 追问生成失败时不会阻塞主流程，会直接继续后续题目与报告链路

### 7.5 /report 与 /history/[id] 兼容方式
- `/report` 继续直接消费完整的 `questions[] + answers[]`
- 报告 prompt 会把主问题及其后续 0 到 3 道连续追问视为同一条表现链进行评估
- `/history/[id]` 继续按原始线性顺序展示题目与回答
- 历史详情通过 `parentQuestionId` 映射所属主问题，通过 `followUpRound` 展示当前是第几轮追问

## 8. 状态流概览
1. 用户在 `/resume` 保存 `resumeDraft` 和 `resumeJdDraft`
2. `/analysis` 读取草稿并生成 `resumeAnalysis`、`resumeJdMatch`、`resumeChat`
3. 用户在 `/analysis` 开始模拟面试，写入 `setupForm` 和 `interviewSession`
4. `/interview` 逐题更新 `interviewSession`，并按需要在线性 `questions[]` 中插入追问 1 / 2 / 3
5. `/report` 基于当前上下文生成 `interviewReport`
6. 报告生成成功后，写入 `interviewHistory`

## 9. 当前能力边界
- 支持 `.md` 简历导入，不支持 PDF 上传与解析
- 支持本地历史查看，不支持云同步
- 不支持导出报告
- 不支持多用户与账号系统
- 不支持无限追问
- 不支持树结构问答
- 不提供全局聊天能力
- 不应把兼容用 `/setup` 描述为正式主流程页面
- 不应把 mock 或 fallback 逻辑描述为产品主能力
