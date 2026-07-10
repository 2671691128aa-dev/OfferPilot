### Task 5: Backend Prompt Order Constraints

**Files:**
- Modify: `backend/src/prompts/resumePrompt.ts:67-80` (add order instruction to JSON output format)
- Modify: `backend/src/prompts/optimizePrompt.ts:27-33` (add order instruction)
- Modify: `backend/src/prompts/jdPrompt.ts:28-34` (add order instruction)
- Modify: `backend/src/prompts/interviewPrompt.ts:109-116` (eval — add order instruction)
- Modify: `backend/src/prompts/interviewPrompt.ts:160-168` (report — add order instruction)
- Modify: `backend/src/prompts/careerRoadmapPrompt.ts:71-92` (add order instruction)

- [ ] **Step 1: Add field order hint to `resumePrompt.ts`**

In `buildResumePrompt`, find the `outputFormat` string (around line 67) and add a line before the JSON template:

Change:
```typescript
  const outputFormat = `
请输出以下 JSON 格式（不要包含其他文字）：
{
  "summary": "个人简介，1-3句话，突出技术能力和目标",
```

To:
```typescript
  const outputFormat = `
请严格按以下顺序输出 JSON 字段（先输出 summary，再输出 skills，再输出 projects，最后输出 advice），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "summary": "个人简介，1-3句话，突出技术能力和目标",
```

- [ ] **Step 2: Add field order hint to `optimizePrompt.ts`**

In `buildOptimizePrompt`, find the JSON template (around line 28) and add:

Change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 简历整体评分(0-100的整数),
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 score，再输出 advantages，再输出 problems，最后输出 suggestions），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 简历整体评分(0-100的整数),
```

- [ ] **Step 3: Add field order hint to `jdPrompt.ts`**

Change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "matchScore": 匹配度百分比(0-100的整数),
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 matchScore，再输出 requiredSkills，再输出 advantages，最后输出 gaps），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "matchScore": 匹配度百分比(0-100的整数),
```

- [ ] **Step 4: Add field order hint to `interviewPrompt.ts` — eval function**

In `buildAnswerEvalPrompt`, change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 评分(0-100整数),
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 score，再输出 strengths，再输出 weaknesses，再输出 suggestedImprovement，最后输出 strongExample），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "score": 评分(0-100整数),
```

- [ ] **Step 5: Add field order hint to `interviewPrompt.ts` — report function**

In `buildInterviewReportPrompt`, change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "overallScore": 综合评分(0-100整数),
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 overallScore，再输出 topStrengths，再输出 keyImprovements，再输出 practiceTopics，最后输出 summary），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "overallScore": 综合评分(0-100整数),
```

- [ ] **Step 6: Add field order hint to `careerRoadmapPrompt.ts`**

Change:
```typescript
请输出以下 JSON 格式（不要包含其他文字）：
{
  "currentLevel": "入门/初级/中级（根据技能数量、项目质量、评分综合判断）",
```

To:
```typescript
请严格按以下顺序输出 JSON 字段（先输出 currentLevel，再输出 levelAnalysis，再输出 skillGaps，再输出 projectSuggestions，再输出 shortTermPlan，再输出 midTermPlan，最后输出 recommendedResources），不要改变字段顺序：

请输出以下 JSON 格式（不要包含其他文字）：
{
  "currentLevel": "入门/初级/中级（根据技能数量、项目质量、评分综合判断）",
```

- [ ] **Step 7: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add backend/src/prompts/
git commit -m "feat: add field output order hints to all AI prompts for progressive reveal"
```

---

