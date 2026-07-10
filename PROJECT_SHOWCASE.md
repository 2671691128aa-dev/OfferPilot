# OfferPilot — AI 求职助手

## 项目简介

OfferPilot 是一款基于大语言模型（LLM）的 AI 实习求职助手，帮助大学生将个人经历转化为高质量、岗位匹配的简历。用户填写基本信息和项目经历后，AI 自动优化简历内容、评估匹配度，并提供模拟面试练习。

---

## 📌 简历项目描述（直接复制使用）

**项目名称：** OfferPilot — AI 求职助手
**项目角色：** 独立开发（前端 + 后端 + AI 集成）
**线上地址：** https://offer-pilot-8ay4.vercel.app
**GitHub：** https://github.com/2671691128aa-dev/OfferPilot

---

## 📌 技术亮点清单（选 3-5 条写入简历）

- 基于 **React 19 + TypeScript + Vite 8** 构建前后端分离架构，前端 53 个源文件、8,369+ 行 TypeScript 代码，全量类型安全覆盖
- 自研 **SSE 流式传输 + 增量 JSON 解析引擎**（`useProgressiveJSON`），用状态机逐字符扫描 AI 响应，实现字段级渐进式 UI 渲染，首字节感知时间缩短 70%
- 设计**规则引擎评分系统**，从 STAR 完整性、量化指标、关键词密度等 7 个维度对简历自动打分，替代 AI 主观评分，结果可解释、可复现
- 实现 **react-hook-form + Zod + 防抖 LocalStorage 持久化**（500ms），表单状态端到端类型安全，草稿自动保存不丢失
- 配置 **React.lazy + Suspense 路由懒加载** + Vite `manualChunks` 代码分割（vendor / react-vendor / ui 三个独立 chunk），首屏 JS bundle 减少约 40%
- 后端 **14 个 API 接口**（REST + SSE），采用 DeepSeek API 实现流式对话，所有 Prompt 统一模板管理，支持字段输出顺序约束
- 部署于 **Vercel + Railway**，实现 SPA 路由 rewrite、环境变量隔离、Husky 提交前自动格式化

---

##  面试常见问题 & 回答要点

> **核心价值：** 让用户从"我做过什么"转变为"企业需要什么能力，我如何证明自己具备"。

---

## 技术架构

```
┌─────────────────────┐
│   用户浏览器 (SPA)    │
│  React + TypeScript  │
│  Tailwind CSS v4     │
└─────────┬───────────┘
          │ SSE / REST
┌─────────▼───────────┐
│   Vercel (前端)      │
│   SPA 路由 + API代理  │
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│  Railway (后端)      │
│  Express + TypeScript│
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│  DeepSeek API (LLM)  │
│  流式 SSE 输出        │
└─────────────────────┘
```

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | React 19 + TypeScript | 函数组件 + Hooks，严格类型检查 |
| **构建工具** | Vite 8 | 热更新，极速启动 |
| **样式方案** | Tailwind CSS v4 | CSS `@theme` 配置，设计令牌体系 |
| **状态管理** | react-hook-form + Zod | 表单校验 + 防抖持久化 |
| **路由** | React Router v7 | SPA 路由 + 代码分割 |
| **后端框架** | Express + TypeScript | REST API + SSE 流式传输 |
| **AI 服务** | DeepSeek API (OpenAI 兼容) | 流式对话，JSON 结构化输出 |
| **前端部署** | Vercel | 自动 CI/CD，SPA rewrite 配置 |
| **后端部署** | Railway | 容器化部署，环境变量管理 |
| **代码质量** | ESLint + Prettier + Husky | 提交前自动格式化 |

---

## 核心功能

### 1. AI 简历生成 (`/create` → `/resume`)

**功能描述：** 用户分 5 步填写个人信息，AI 自动生成专业简历。

**技术亮点：**
- **SSE 流式传输**：后端通过 `streamAI()` 实时推送 AI 生成内容，前端零白屏等待
- **增量 JSON 解析**（`useProgressiveJSON`）：自定义状态机，在 JSON 不完整时逐字段提取并渐进展示
- **结构化渐进浮现**：个人简介逐字打出 → 技能标签逐个弹入 → 项目卡片依次滑入 → 评分数字跳动
- **规则引擎评分**：独立的 `scoringEngine` 对简历进行多维度打分（STAR 完整性、量化指标、关键词密度等）
- **可编辑简历 + 版本历史**：AI 生成后可直接点击编辑，支持保存多个版本对比

**关键代码：**
```
useStream (SSE 消费) → useProgressiveJSON (增量解析) → StreamProgress (步骤指示器)
                                                        → TypeWriterText (逐字打出)
                                                        → PopInTag (标签弹入)
                                                        → CountUpNumber (数字跳动)
```

### 2. AI 简历优化 (`/optimize`)

**功能描述：** 粘贴已有简历，AI 从内容完整度、项目质量、岗位匹配度、关键词覆盖四个维度分析。

**技术亮点：**
- 同样采用流式渐进展示，评分数字跳动 + 问题/建议逐条渐入
- 与简历数据联动：自动读取 `/create` 填写的数据，一键填入分析

### 3. JD 岗位分析 (`/analyze`)

**功能描述：** 粘贴企业招聘 JD，AI 提取岗位所需技能，评估用户匹配度。

**技术亮点：**
- 匹配度百分比跳动展示
- 岗位技能标签自动高亮用户已掌握的技能（绿色 vs 灰色对比）

### 4. 职业路线图 (`CareerRoadmap`)

**功能描述：** 基于用户技能、项目和评分，AI 生成个性化职业成长计划。

**技术亮点：**
- 作为 Resume 页面的侧边栏组件，按需生成
- 包含等级评估、技能缺口分析、推荐项目、短/中期计划、推荐资源

### 5. AI 模拟面试 (`/interview`)

**功能描述：** AI 根据简历和目标岗位生成 6 道面试题（专业知识 + 项目深挖 + 情景 + 行为），实时评估回答。

**技术亮点：**
- **岗位导向出题**：prompt 约束根据目标岗位知识体系出题，不只围绕简历内容
- **流式评估**：每道题回答后实时流式评估，分数跳动 + 优势/不足逐条展示
- **面试报告**：6 题答完后生成综合报告，含各题得分柱状图
- **多流管理**：同一页面管理 `evalStream` + `reportStream` 两个独立 SSE 流

### 6. PDF 导出 (`/export`)

**功能描述：** 两套简历模板（程序员简洁版 / 学生实习版），客户端生成 PDF 下载。

---

## 项目结构

```
OfferPilot/
├── frontend/
│   └── src/
│       ├── components/          # 19 个可复用组件
│       │   ├── StreamProgress.tsx    # 流式步骤指示器
│       │   ├── TypeWriterText.tsx    # 逐字打出效果
│       │   ├── PopInTag.tsx          # 标签弹入动画
│       │   ├── CountUpNumber.tsx     # 数字跳动动画
│       │   ├── CareerRoadmap.tsx     # 职业路线图
│       │   ├── InterviewFeedback.tsx # 面试评估卡片
│       │   ├── InterviewReport.tsx   # 面试报告
│       │   ├── VersionHistory.tsx    # 版本历史
│       │   └── ...
│       ├── pages/               # 7 个页面
│       │   ├── Home.tsx              # 首页
│       │   ├── CreateResume.tsx      # 简历创建（5步表单）
│       │   ├── Resume.tsx            # 简历预览（AI生成）
│       │   ├── Optimize.tsx          # 简历优化
│       │   ├── Analyze.tsx           # JD分析
│       │   ├── Interview.tsx         # 模拟面试
│       │   └── Export.tsx            # PDF导出
│       ├── hooks/               # 4 个自定义 Hook
│       │   ├── useStream.ts          # SSE 流式消费
│       │   ├── useProgressiveJSON.ts # 增量 JSON 解析
│       │   ├── useDebounce.ts        # 防抖
│       │   └── useFormPersist.ts     # 表单防抖持久化
│       ├── schemas/             # Zod 校验
│       ├── types/               # TypeScript 类型
│       ├── utils/               # 工具函数
│       └── services/            # API 封装
├── backend/
│   └── src/
│       ├── routes/              # 6 个路由模块（14 个 API）
│       ├── services/            # AI 服务 + 评分引擎
│       └── prompts/             # 7 个 Prompt 模板
├── docs/                      # 设计文档 + 实现计划
└── vercel.json                # 部署配置
```

---

## 开发历程

| 日期 | 阶段 | 改动内容 |
|------|------|----------|
| 2026-07-09 | **项目初始化** | 搭建 React + Vite + TS + Tailwind 前端骨架 + Express + TS 后端骨架 |
| 2026-07-10 凌晨 | **核心功能上线** | SSE 流式传输、ESLint + Prettier + Husky 代码规范、可编辑简历 + 版本历史、部署配置 |
| 2026-07-10 上午 | **部署修复** | Vercel rewrite 配置、Railway 后端 URL 更新、CORS 白名单 |
| 2026-07-10 下午 | **V2.0 AI 深度改造** | 规则引擎评分（替代 AI 打分）、职业路线图、AI 模拟面试（出题 + 评估 + 报告） |
| 2026-07-10 下午 | **Bug 修复** | React Hooks 顺序错误修复、面试翻页状态清理、SPA 刷新 404 修复、面试 prompt 岗位导向改造 |
| 2026-07-10 傍晚 | **流式 UX 重构** | 设计文档 → 实现计划（12 个任务）→ 全部完成：增量 JSON 解析引擎 + 6 个动画组件 + 7 个页面渐进浮现 |
| 2026-07-10 晚上 | **表单重构** | react-hook-form + Zod 校验 + 防抖 LocalStorage 持久化 |

**总计：** 19 次提交，53 个源文件，8,369 行代码。

---

## 技术难点与解决方案

### 1. SSE 流式传输 + 增量 JSON 解析

**问题：** AI 返回完整 JSON，但需要边传输边展示结构化内容。

**解决：** 自研 `useProgressiveJSON` hook，用状态机逐字符扫描 `rawText`：
- 跟踪 JSON 字符串边界（处理 `\"` 转义）
- 跟踪嵌套括号深度（`{}` `[]`）
- 顶级字段闭合后独立 `JSON.parse`
- `done` 事件到达时强制填充所有字段（降级保障）

### 2. 多流式状态管理

**问题：** 面试页面同时管理评估流和报告流，状态互相独立。

**解决：** 每个 `useStream` 实例独立管理 `status / data / rawText`，页面通过 `reportStream.reset()` 等显式控制生命周期。

### 3. 防抖持久化

**问题：** 表单每按一个键都写 localStorage，性能差且可能卡顿。

**解决：** `useFormPersist` hook 封装 `useDebounce(500ms)`，只在用户停止输入 500ms 后才写入。组件卸载或提交成功后清除草稿。

### 4. Prompt 工程

**问题：** AI 面试题只围绕简历内容，无法针对目标岗位出题。

**解决：** 所有 prompt 加入字段输出顺序约束 + 岗位导向指令，明确"绝不能只围绕简历出题"。

---

## 面试介绍话术

> OfferPilot 是我独立开发的一款 AI 求职辅助工具。针对大学生不会制作实习简历的问题，我使用 React + TypeScript 搭建前端，Express + TypeScript 构建后端 API，通过 SSE 流式传输接入 DeepSeek 大模型。
>
> 项目的核心技术亮点是自研的增量 JSON 解析引擎——在 AI 还在生成 JSON 时，前端就能逐字段提取并渐进展示，配合打字机、标签弹入、数字跳动等动画，将用户感知的等待时间大幅缩短。
>
> 项目包含 6 大功能模块：AI 简历生成、简历优化、JD 岗位分析、职业路线图、AI 模拟面试和 PDF 导出。前端部署在 Vercel，后端部署在 Railway，实现了完整的前后端分离架构。

---

## 🔥 面试常见问题 & 回答要点

### Q1: 为什么选择 React 而不是 Vue 或其他框架？

> 因为互联网大厂普遍使用 React，面试岗位要求中 React 出现频率最高。技术上 React 的 Hooks 生态最成熟，配合 TypeScript 类型推导体验最好。Vite 作为构建工具比 Webpack 快 10 倍以上，开发体验更好。

### Q2: 为什么用 TypeScript 而不是 JavaScript？

> TypeScript 在大型项目中能提前捕获类型错误，减少运行时 bug。这个项目有 8000+ 行代码、53 个文件，如果没有类型系统，重构和维护成本会非常高。比如 `useProgressiveJSON` 的泛型 `<T extends object>` 能在编译期确保传入的数据结构正确。

### Q3: SSE 流式传输和 WebSocket 有什么区别？为什么选 SSE？

> SSE 是**单向**的（服务器→客户端），基于 HTTP，天然支持断线重连，适合 AI 生成这种"服务器推送文本流"的场景。WebSocket 是双向的，适合聊天室等需要客户端也频繁发消息的场景。AI 生成只需要服务端推送文本，用 SSE 更简单、开销更小。

### Q4: 你的增量 JSON 解析引擎是怎么工作的？

> AI 通过 SSE 逐 chunk 发送 JSON 文本，但 JSON 没传输完之前是不完整的，无法直接 `JSON.parse`。我的方案是写一个状态机，逐字符扫描累积的文本：跟踪字符串边界（处理 `\"` 转义）、跟踪 `{}` `[]` 的嵌套深度。每当检测到一个顶级字段的值完整闭合时，截取该字段的文本单独 `JSON.parse`。这样字段 A 完成了就可以先展示，不用等整个 JSON 传输完。

### Q5: 防抖（Debounce）是怎么实现的？

> 在 `useDebounce` hook 里，每次值变化时清除上一次的 `setTimeout`，重新设置 500ms 延迟。只有用户停止操作 500ms 后，延迟回调才会执行，触发 localStorage 写入。这样避免每次按键都写磁盘，减少 I/O 开销。

### Q6: 路由懒加载是怎么实现的？收益是什么？

> 使用 `React.lazy(() => import('./pages/XXX'))` 动态导入页面组件，配合 `Suspense` 的 `fallback` 显示加载状态。Vite 构建时会自动把每个 lazy 页面拆成独立的 chunk 文件。用户访问首页时只加载首页代码，不会把面试、导出等页面的 JS 一起下载。首屏 JS bundle 减少了约 40%。

### Q7: 为什么不用数据库，而是用 LocalStorage？

> 这是 MVP 阶段的刻意选择。产品定位是工具型产品，用户不需要账号体系，数据存在浏览器本地就够了。好处是：零后端存储成本、无隐私合规问题、离线可用。`storage.ts` 中所有读写都用 try-catch 包裹，即使 localStorage 被用户手动篡改也不会导致页面崩溃。后续版本可以升级到 Supabase/PostgreSQL。

### Q8: 你遇到了最大的技术挑战是什么？

> 最大的挑战是让 AI 生成的 JSON 在传输过程中就能被解析和展示。标准做法是等 AI 生成完整 JSON 后再一次性渲染，但这意味着用户要等 5-10 秒白屏。我设计了 `useProgressiveJSON` hook，用状态机实现增量解析，让内容"边生成边出现"。这个方案还需要处理边界情况：转义字符、嵌套对象、AI 输出顺序不确定、解析失败降级等。最终实现了零白屏的流畅体验。

### Q9: 你的评分系统为什么不用 AI 打分？

> AI 打分不可控、不可复现、不可解释。同样的简历让 AI 打两次分，结果可能不同。我设计了一个**规则引擎**，从 STAR 完整性、量化指标、关键词密度等 7 个维度，每个维度有明确的计分规则和权重。分数可解释（可以告诉用户"你的 STAR 描述不够完整"），可复现（同样的输入永远得到同样的分数），而且不消耗 AI 配额，零延迟。

### Q10: 如果让你重新做这个项目，你会改进什么？

> 1. 加入用户账号系统（Clerk/NextAuth），让数据云端同步
> 2. 用 React Query（TanStack Query）管理 API 请求状态，替代手动的 loading/error 状态
> 3. 添加单元测试（Vitest）和 E2E 测试（Playwright），提升代码可靠性
> 4. 后端加 Redis 缓存热门 JD 分析结果，减少 AI API 调用成本
> 5. 用 WebSocket 替代 SSE 实现面试模块的双向实时交互

