import OpenAI from 'openai'
import { scoreResume, type ScoringInput } from './scoringEngine.js'

const MODEL = 'deepseek-chat'
const MAX_RETRIES = 2

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.AI_API_KEY) {
      throw new Error('AI_API_KEY 未配置，请在 backend/.env 中填入 DeepSeek API Key')
    }
    _client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.AI_API_KEY,
    })
  }
  return _client
}

function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (match) return match[1].trim()
  return text.trim()
}

enum AIErrorType {
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  JSON_PARSE_FAILED = 'JSON_PARSE_FAILED',
  MISSING_FIELD = 'MISSING_FIELD',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
}

function classifyError(err: unknown): AIErrorType {
  if (!(err instanceof Error)) return AIErrorType.NETWORK_ERROR
  const msg = err.message
  if (msg.includes('AI_API_KEY')) return AIErrorType.CONFIG_ERROR
  if (msg.includes('返回内容为空')) return AIErrorType.EMPTY_RESPONSE
  if (msg.includes('JSON') || msg.includes('Unexpected token')) return AIErrorType.JSON_PARSE_FAILED
  if (msg.includes('缺少必要字段')) return AIErrorType.MISSING_FIELD
  return AIErrorType.NETWORK_ERROR
}

function isRetryable(errorType: AIErrorType): boolean {
  return (
    errorType === AIErrorType.EMPTY_RESPONSE ||
    errorType === AIErrorType.JSON_PARSE_FAILED ||
    errorType === AIErrorType.MISSING_FIELD
  )
}

function validateJSON(data: unknown, requiredFields: string[]): void {
  if (!data || typeof data !== 'object') {
    throw new Error('AI 返回的数据格式无效')
  }
  const obj = data as Record<string, unknown>
  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new Error(`AI 返回的数据缺少必要字段: ${field}`)
    }
  }
}

async function callAIWithRetry(
  systemPrompt: string,
  userPrompt: string,
  requiredFields: string[],
): Promise<string> {
  if (!process.env.AI_API_KEY) {
    throw new Error('AI_API_KEY 未配置，请在 backend/.env 中填入 DeepSeek API Key')
  }

  const client = getClient()
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('AI 返回内容为空')
      }

      const jsonStr = extractJSON(content)
      const parsed = JSON.parse(jsonStr)
      validateJSON(parsed, requiredFields)

      return jsonStr
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error('AI 调用异常')
      const errorType = classifyError(lastError)

      if (isRetryable(errorType) && attempt < MAX_RETRIES) {
        console.warn(
          `[AI] Attempt ${attempt + 1} failed (${errorType}): ${lastError.message}, retrying...`,
        )
        continue
      }

      throw lastError
    }
  }

  throw lastError || new Error('AI 服务多次尝试后仍失败')
}

// ─── Streaming AI Call ───

/**
 * Call DeepSeek with streaming enabled.
 * Returns an async generator that yields text chunks.
 * The caller is responsible for accumulating the full text.
 */
export async function* streamAI(
  systemPrompt: string,
  userPrompt: string,
): AsyncGenerator<string, void, unknown> {
  if (!process.env.AI_API_KEY) {
    throw new Error('AI_API_KEY 未配置，请在 backend/.env 中填入 DeepSeek API Key')
  }

  const client = getClient()
  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    stream: true,
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) {
      yield delta
    }
  }
}

// ─── Function Calling: AI generates resume, then self-corrects via scoring ───

export async function generateResumeWithTools(
  systemPrompt: string,
  userPrompt: string,
  scoringInput: {
    resumeText: string
    projects: Array<{ name: string; description: string; technology: string; role: string }>
    skills: string[]
    targetRole: string
    summary?: string
    hasEmail?: boolean
    hasEducation?: boolean
  },
): Promise<string> {
  if (!process.env.AI_API_KEY) {
    throw new Error('AI_API_KEY 未配置，请在 backend/.env 中填入 DeepSeek API Key')
  }

  const client = getClient()

  // Step 1: Generate initial draft
  const draftCompletion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  const draftContent = draftCompletion.choices[0]?.message?.content
  if (!draftContent) {
    throw new Error('AI 返回内容为空')
  }

  const draftJSON = extractJSON(draftContent)
  const draftData = JSON.parse(draftJSON)

  // Step 2: Score the draft
  const updatedInput: ScoringInput = {
    ...scoringInput,
    summary: draftData.summary || scoringInput.summary || '',
  }
  const scoreResult = scoreResume(updatedInput)

  // Step 3: If score is already good enough, return draft directly
  if (scoreResult.overallScore >= 75) {
    return draftJSON
  }

  // Step 4: Ask AI to improve based on scoring feedback
  const weakDimensions = Object.entries(scoreResult.breakdown)
    .filter(([, dim]) => dim.score < 60)
    .map(([key, dim]) => `${key}: ${dim.reasons.join('；')}`)
    .join('\n')

  const improvementPrompt = `你的简历草稿评分为 ${scoreResult.overallScore}/100，以下是薄弱环节：

${weakDimensions}

请根据以上反馈优化简历内容，特别是针对薄弱环节进行改进。
注意：不要虚构用户没有提供的经历，只优化表达方式和内容组织。

请输出优化后的 JSON：
${JSON.stringify({ summary: '', skills: [], projects: [], advice: [] })}

确保输出有效 JSON。`

  const improvementCompletion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: draftContent },
      { role: 'user', content: improvementPrompt },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  })

  const improvedContent = improvementCompletion.choices[0]?.message?.content
  if (!improvedContent) {
    return draftJSON
  }

  return extractJSON(improvedContent)
}

// ─── Non-streaming exports (kept for backward compatibility) ───

export async function generateResume(systemPrompt: string, userPrompt: string): Promise<string> {
  return callAIWithRetry(systemPrompt, userPrompt, ['summary', 'advice'])
}

export async function optimizeResume(systemPrompt: string, userPrompt: string): Promise<string> {
  return callAIWithRetry(systemPrompt, userPrompt, ['score', 'problems', 'suggestions'])
}

export async function analyzeJD(systemPrompt: string, userPrompt: string): Promise<string> {
  return callAIWithRetry(systemPrompt, userPrompt, [
    'matchScore',
    'requiredSkills',
    'advantages',
    'gaps',
  ])
}

export async function optimizeProject(systemPrompt: string, userPrompt: string): Promise<string> {
  return callAIWithRetry(systemPrompt, userPrompt, ['optimizedDescription'])
}

export async function generateInterviewQuestions(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  return callAIWithRetry(systemPrompt, userPrompt, ['questions'])
}
