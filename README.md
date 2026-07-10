# 🎯 OfferPilot — AI 求职助手

> 基于大语言模型的 AI 实习求职助手，帮助大学生 5 分钟生成专业简历。

**🌐 线上 Demo：** [https://offer-pilot-8ay4.vercel.app](https://offer-pilot-8ay4.vercel.app)

---

## ✨ 功能一览

| 功能 | 说明 |
|------|------|
| 📝 **AI 简历生成** | 填写 5 步表单，AI 自动生成岗位匹配简历，流式渐进展示 |
| 🔍 **简历智能优化** | 多维度分析（内容完整度、岗位匹配度），给出评分和修改建议 |
| 💼 **JD 岗位分析** | 粘贴招聘描述，AI 提取要求并评估你的匹配度和能力差距 |
| 🎤 **AI 模拟面试** | 根据目标岗位生成针对性面试题，实时评估回答并生成综合报告 |
| 📄 **PDF 简历导出** | 两套模板（程序员简洁版 / 学生实习版），一键导出 PDF |
| 🗺️ **职业路线图** | AI 根据当前水平和目标岗位，生成个性化成长计划 |

---

## 🏗️ 技术架构

```
┌─────────────────────┐
│   用户浏览器 (SPA)    │
│  React 19 + TS       │
│  Tailwind CSS v4     │
└─────────┬───────────┘
          │ SSE / REST
┌─────────▼───────────┐
│   Vercel (前端部署)   │
│   React.lazy 代码分割 │
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│  Railway (后端部署)   │
│  Express + TS        │
│  14 个 REST + SSE API│
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│  DeepSeek API (LLM)  │
│  流式对话 + JSON 输出  │
└─────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | React 19 + TypeScript |
| **构建工具** | Vite 8 + React.lazy 代码分割 |
| **样式方案** | Tailwind CSS v4（CSS `@theme` 设计令牌） |
| **表单管理** | react-hook-form + Zod 校验 + 防抖 LocalStorage 持久化 |
| **路由** | React Router v7（懒加载 + Suspense） |
| **后端框架** | Express + TypeScript |
| **AI 服务** | DeepSeek API（OpenAI 兼容，SSE 流式输出） |
| **前端部署** | Vercel |
| **后端部署** | Railway |
| **代码质量** | ESLint + Prettier + Husky 提交前自动格式化 |

---

## 🚀 核心亮点

### 1. SSE 流式传输 + 渐进式 UI

所有 AI 功能（简历生成、优化、面试评估等）均使用 **SSE（Server-Sent Events）** 实现流式传输，告别白屏等待。

```
SSE chunks → rawText 累积 → useProgressiveJSON 增量解析 → 逐字段暴露 → 渐进展示
```

### 2. 自研增量 JSON 解析引擎

AI 返回完整 JSON，但需要边传输边展示。自研 `useProgressiveJSON` hook，用状态机逐字符扫描：
- 跟踪 JSON 字符串边界（处理 `\"` 转义）
- 跟踪嵌套括号深度（`{}` `[]`）
- 顶级字段闭合后独立 `JSON.parse`
- `done` 事件到达时强制填充（降级保障）

### 3. 规则引擎评分

独立的 `scoringEngine` 对简历进行多维度打分：
- STAR 完整性（25%）、量化指标（15%）、关键词密度（15%）
- 动作动词（10%）、内容完整度（15%）、岗位匹配（15%）、长度均衡（5%）

### 4. 防抖 LocalStorage 持久化

`useFormPersist` hook 封装 `useDebounce(500ms)`，用户停止输入 500ms 后才写入 localStorage，避免高频写入。组件卸载/提交后自动清除草稿。

---

## 📁 项目结构

```
OfferPilot/
├── frontend/
│   └── src/
│       ├── pages/           # 7 个页面（Home, Create, Resume, Optimize, Analyze, Interview, Export）
│       ├── components/      # 19 个可复用组件
│       ├── hooks/           # 4 个自定义 Hook
│       ├── services/        # API 封装
│       ├── schemas/         # Zod 校验 Schema
│       ├── types/           # TypeScript 类型定义
│       └── utils/           # 工具函数
├── backend/
│   └── src/
│       ├── routes/          # 6 个路由模块（14 个 API）
│       ├── services/        # AI 服务 + 评分引擎
│       └── prompts/         # 7 个 Prompt 模板
├── PROJECT_SHOWCASE.md      # 项目展示文档（面试用）
└── README.md                # 本文件
```

---

## ️ 本地运行

### 前置条件
- Node.js >= 18
- DeepSeek API Key（填入 `backend/.env`）

### 启动后端
```bash
cd backend
npm install
# 编辑 .env，填入 AI_API_KEY
npm run dev
```

### 启动前端
```bash
cd frontend
npm install
npm run dev
```

浏览器访问 http://localhost:5173

---

## 📊 项目数据

| 指标 | 数值 |
|------|------|
| 前端源文件 | 53 个 |
| TypeScript 代码行 | 8,369+ |
| API 接口数 | 14 个（REST + SSE） |
| 自定义 Hook 数 | 4 个 |
| 可复用组件数 | 19 个 |
| Git 提交数 | 25+ |

---

## 📜 许可证

MIT
