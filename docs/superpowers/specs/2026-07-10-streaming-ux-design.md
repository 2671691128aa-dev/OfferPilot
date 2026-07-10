# SSE 流式渐进展示设计

**日期：** 2026-07-10
**状态：** 待实现
**目标：** 将 AI 交互体验从"原始 JSON 打字机"升级为"结构化字段渐进浮现"，缩短等待感知时间。

## 1. 问题

当前所有 AI 功能的流式体验相同：显示一个 mono 字体的 raw text 方块，用户看到 AI 生成的原始 JSON 字符串逐字符滚动（`{"summary":"计算机专业..."}`）。既不美观也无内容感知，等待体验差。

## 2. 方案：前端增量 JSON 解析 + 结构化渐进展示

**核心思路：** 后端零改动。前端在 `useStream` 基础上，新增 `useProgressiveJSON` hook，实时解析累积的 `rawText`，将已闭合的 JSON 字段渐进暴露给 UI。配合语义化步骤指示器和渐入动画，让用户看到简历内容在"被填写"。

### 2.1 为什么选这个方案

- **后端零改动**：现有 7 个 SSE stream endpoint 不变，SSE 协议（chunk/done/error）不变
- **通用复用**：一个 hook 适配所有页面，每个页面只配置 schema
- **可靠降级**：解析失败不影响功能，`done` 事件到达时强制填充

## 3. 架构

```
SSE chunks → rawText 累积 → useProgressiveJSON 增量解析 → 逐字段暴露 → 页面渐进展示
                                                              ↓
                                                    done 事件 → 完整 JSON 填充剩余字段 → 切换到完整交互模式
```

## 4. 核心组件

### 4.1 `useProgressiveJSON` Hook

**文件：** `frontend/src/hooks/useProgressiveJSON.ts`

在 `useStream` 基础上消费 `rawText`，用状态机逐字符扫描，跟踪 JSON 字符串边界（处理转义引号）和嵌套括号深度。当检测到顶级字段的值完整闭合时，尝试 `JSON.parse` 该字段。

**暴露接口：**

```typescript
interface ProgressiveField<T, K extends keyof T> {
  value: T[K] | null
  isComplete: boolean
  isStreaming: boolean
}

interface UseProgressiveJSONResult<T> {
  fields: { [K in keyof T]: ProgressiveField<T, K> }
  completedKeys: (keyof T)[]
  progress: number        // 0-100
  isComplete: boolean
  rawText: string
}

function useProgressiveJSON<T>(
  rawText: string,
  schema: Record<string, 'string' | 'number' | 'array' | 'object'>,
  streamStatus: StreamStatus,
): UseProgressiveJSONResult<T>
```

**每个页面配置自己的 schema：**

```typescript
// 简历生成
const resumeSchema = {
  summary: 'string',
  skills: 'array',
  projects: 'array',
  education: 'array',
  advice: 'array',
}

// 简历优化
const optimizeSchema = {
  score: 'number',
  advantages: 'array',
  problems: 'array',
  suggestions: 'array',
}

// JD 分析
const analyzeSchema = {
  matchScore: 'number',
  requiredSkills: 'array',
  advantages: 'array',
  gaps: 'array',
}
```

**解析器逻辑：**
- 维护状态机，逐字符扫描 `rawText`
- 跟踪 JSON 字符串边界（处理转义引号 `\"`）
- 跟踪嵌套括号深度（`{}`、`[]`）
- 当顶级字段的值完整闭合时，尝试 `JSON.parse`
- 每个字段独立解析，失败不影响其他字段
- `rawText` 被清空时（新请求开始），自动重置所有字段
- `done` 事件到达时，用完整 JSON 强制填充所有剩余字段

### 4.2 `StreamProgress` — 语义化步骤进度指示器

**文件：** `frontend/src/components/StreamProgress.tsx`

```typescript
interface StreamProgressProps {
  steps: Array<{ key: string; label: string }>
  completedKeys: string[]
  currentKey: string | null
  progress: number  // 0-100
}
```

- 水平排列的步骤条，每步显示图标（✓/●/○）+ 文字标签
- 已完成步骤：绿色 ✓
- 当前步骤：主色调 ● + 脉冲动画
- 等待步骤：灰色 ○
- 底部进度条，颜色从主色渐变到成功色
- 移动端（< 640px）改为垂直排列

### 4.3 `StreamSkeleton` — 骨架屏容器

**文件：** `frontend/src/components/StreamSkeleton.tsx`

```typescript
interface StreamSkeletonProps {
  children: React.ReactNode
  isRevealing: boolean
  delay?: number
}
```

- 子元素通过 CSS `animation` 实现 `fade-up` 效果（opacity 0→1, translateY 8px→0, 200ms ease-out）
- 支持 `delay` 控制子元素错开出现
- 使用 `will-change: transform, opacity` GPU 加速

### 4.4 `TypeWriterText` — 文本逐字打出

**文件：** `frontend/src/components/TypeWriterText.tsx`

```typescript
interface TypeWriterTextProps {
  text: string
  speed?: number       // 每字符间隔 ms，默认 20
  className?: string
  onComplete?: () => void
}
```

- 接收完整文本，逐字符渲染
- 使用 `requestAnimationFrame` 控制渲染节奏
- 每帧渲染字符数根据文本长度动态调整
- 末尾显示闪烁光标 `▌`

### 4.5 `PopInTag` — 标签逐个 pop-in

**文件：** `frontend/src/components/PopInTag.tsx`

```typescript
interface PopInTagProps {
  items: string[]
  className?: string
  stagger?: number  // 每个标签延迟间隔 ms，默认 50
}
```

- 当 `items` 数组增长时，新增标签自动触发 pop-in 动画
- `scale(0.8) → scale(1)` 弹性效果
- 使用 `key` 区分新旧标签，只对新增做动画
- 总 stagger 时长不超过 800ms

### 4.6 `CountUpNumber` — 数字跳动

**文件：** `frontend/src/components/CountUpNumber.tsx`

```typescript
interface CountUpNumberProps {
  value: number
  duration?: number  // 动画时长 ms，默认 600
  className?: string
}
```

- 数字从 0（或旧值）动画过渡到新值
- `easeOutExpo` 缓动函数
- `value` 变化时自动触发

### 4.7 `StreamCancel` — 统一取消按钮

**文件：** `frontend/src/components/StreamCancel.tsx`

- 所有流式页面统一样式的取消按钮
- 点击后调用 `abort()`，返回输入/空闲状态

## 5. 各页面流式体验

### 5.1 简历生成页 (`/resume`)

- **骨架：** 空白简历卡片布局（姓名、学校从 localStorage 立即可用）
- **渐进填入：** 个人简介（TypeWriterText）→ 技能标签（PopInTag）→ 项目卡片（依次滑入）→ 评分（CountUpNumber）+ 建议
- **完成后：** 平滑切换为可编辑模式（EditableText），无布局跳变
- **schema：** `{ summary: 'string', skills: 'array', projects: 'array', education: 'array', advice: 'array' }`

### 5.2 简历优化页 (`/optimize`)

- **骨架：** 评分圆环 + 三个空列表区域
- **渐进填入：** 评分（CountUpNumber）→ 优势列表（逐条渐入）→ 问题列表 → 建议列表
- **schema：** `{ score: 'number', advantages: 'array', problems: 'array', suggestions: 'array' }`

### 5.3 JD 分析页 (`/analyze`)

- **骨架：** 匹配度圆环 + 技能网格 + 两个空列表
- **渐进填入：** 匹配度百分比（CountUpNumber）→ 岗位技能标签（PopInTag，已有技能绿色高亮）→ 优势列表 → 差距列表
- **schema：** `{ matchScore: 'number', requiredSkills: 'array', advantages: 'array', gaps: 'array' }`

### 5.4 职业路线图 (`CareerRoadmap`)

- **骨架：** 等级徽章 + 技能差距区 + 计划区
- **渐进填入：** 等级徽章 → 技能差距逐个 → 短期/中期计划逐段
- **schema：** `{ currentLevel: 'string', levelAnalysis: 'string', skillGaps: 'array', shortTermPlan: 'array', midTermPlan: 'array', recommendedResources: 'array' }`

### 5.5 面试评估 (`InterviewFeedback`)

- **渐进填入：** 分数（CountUpNumber）→ 优势/不足逐条 → 改进建议
- **schema：** `{ score: 'number', strengths: 'array', weaknesses: 'array', suggestedImprovement: 'string', strongExample: 'string' }`

### 5.6 面试报告 (`InterviewReport`)

- **渐进填入：** 综合评分 → 优势总结 → 改进方向 → 推荐练习话题 → 总结文字
- **schema：** `{ overallScore: 'number', topStrengths: 'array', keyImprovements: 'array', practiceTopics: 'array', summary: 'string' }`

## 6. 后端配合 — Prompt 输出顺序约束

在 prompt 中增加字段输出顺序约束，原则：**用户最关心的内容优先输出**。

| Prompt 文件 | 函数 | 字段输出顺序 |
|---|---|---|
| `resumePrompt.ts` | `buildResumePrompt` | summary → skills → projects → advice |
| `optimizePrompt.ts` | `buildOptimizePrompt` | score → advantages → problems → suggestions |
| `jdPrompt.ts` | `buildJDPrompt` | matchScore → requiredSkills → advantages → gaps |
| `careerRoadmapPrompt.ts` | `buildCareerRoadmapPrompt` | currentLevel → levelAnalysis → skillGaps → shortTermPlan → midTermPlan → recommendedResources |
| `interviewPrompt.ts` | `buildAnswerEvalPrompt` | score → strengths → weaknesses → suggestedImprovement → strongExample |
| `interviewPrompt.ts` | `buildInterviewReportPrompt` | overallScore → topStrengths → keyImprovements → practiceTopics → summary |
| `projectPrompt.ts` | `buildProjectOptimizePrompt` | 单字段，无需排序 |

**不改动的后端部分：**
- SSE 协议不变（chunk/done/error 三种事件）
- `streamAI()` 函数不变
- 所有后端路由文件不变
- `scoreResume()` 规则引擎评分在 `done` 事件中填充（不参与流式）
- 非流式端点保留不动

## 7. 页面改造模式

每个页面的改造统一模式：

```typescript
// Before
const { status, data, rawText, errorMsg, start, abort } = useStream<T>(url)
// streaming → <StreamingIndicator rawText={rawText} />

// After
const { status, data, rawText, errorMsg, start, abort } = useStream<T>(url)
const progressive = useProgressiveJSON<T>(rawText, schema, status)
// streaming → <流式结构化布局> 消费 progressive.fields
// done → 切换到完整结构化布局（无视觉跳变）
```

删除各页面重复的 `StreamingIndicator` 组件，替换为流式结构化布局。

## 8. 文件清单

### 新增文件

```
frontend/src/
├── hooks/
│   └── useProgressiveJSON.ts
├── components/
│   ├── StreamProgress.tsx
│   ├── StreamSkeleton.tsx
│   ├── TypeWriterText.tsx
│   ├── PopInTag.tsx
│   ├── CountUpNumber.tsx
│   └── StreamCancel.tsx
```

### 修改文件

```
frontend/src/
├── pages/Resume.tsx                # 流式模式替换 StreamingIndicator
├── pages/Optimize.tsx              # 同上
├── pages/Analyze.tsx               # 同上
├── components/CareerRoadmap.tsx    # 流式模式替换 raw text
├── components/InterviewFeedback.tsx # 流式模式

backend/src/prompts/
├── resumePrompt.ts                 # 加字段输出顺序约束
├── optimizePrompt.ts               # 同上
├── jdPrompt.ts                     # 同上
├── interviewPrompt.ts              # eval + report 两个函数
└── projectPrompt.ts                # 可选（单字段）
```

## 9. Edge Cases & 降级

### 9.1 增量解析失败

- 每个字段独立 `JSON.parse`，失败不影响其他字段
- 连续 3 次 parse 失败的字段标记为 `stalled`，UI 显示骨架占位
- `done` 事件到达时，用完整 JSON 强制填充所有字段
- 如果 `done` 的 JSON 也无效，走 `ErrorState` 错误流程

### 9.2 网络中断

- `useStream` 已处理网络错误，status 变为 `'error'`
- 已展示字段保留（降低不透明度到 0.5）
- 未完成区域显示 `ErrorState`，提供重试按钮
- 重试时清空所有流式状态

### 9.3 AI 不遵守字段顺序

- 解析器按"谁先闭合谁先展示"工作，不硬依赖顺序
- 步骤指示器的"当前步骤"跟随 `completedKeys` 最新值
- 跳过的字段由 `done` 事件填充

### 9.4 流式到完整的切换

- 流式和完成模式使用**完全相同的组件和样式**
- 切换时只移除动画属性（`will-change`、`animation`），不改变布局
- 简历页：流式模式内容只读 → 完成后变为可编辑（EditableText）
- CSS `transition: all 200ms` 消除布局跳变

### 9.5 快速连续请求

- `useStream.start()` 已内置 abort 前一个请求
- `useProgressiveJSON` 在 `rawText` 清空时自动重置
- 步骤指示器回到第一步

### 9.6 `prefers-reduced-motion`

- 检测用户系统设置，禁用所有动画
- 直接显示已完成的内容，不做渐进效果

## 10. 动画性能

- 所有动画使用 CSS `transform` + `opacity`（GPU 加速，不触发重排）
- `will-change: transform, opacity` 提前优化
- `requestAnimationFrame` 替代 `setInterval`
- 流式结束后移除所有动画属性
- `PopInTag` 总 stagger 时长不超过 800ms
- `TypeWriterText` 每帧字符数根据文本长度动态调整

## 11. 取消按钮

所有流式页面增加取消按钮，点击后调用 `abort()`，返回输入/空闲状态。统一使用 `StreamCancel` 组件。
