# OfferPilot — AI 求职助手

## 项目简介

OfferPilot 是一款基于大语言模型（LLM）的 AI 实习求职助手，帮助大学生将个人经历转化为高质量、岗位匹配的简历。用户填写基本信息和项目经历后，AI 自动优化简历内容、评估匹配度，并提供模拟面试练习。

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
