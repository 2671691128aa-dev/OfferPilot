import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { loadResumeData } from '../utils/storage'
import {
  fetchInterviewQuestions,
  STREAM_ENDPOINTS,
  type InterviewQuestion,
  type InterviewAnswer,
  type InterviewFeedback,
  type InterviewReport,
} from '../services/api'
import { useStream } from '../hooks/useStream'
import { useProgressiveJSON } from '../hooks/useProgressiveJSON'
import InterviewQuestionCard from '../components/InterviewQuestion'
import InterviewFeedbackCard, { InterviewFeedbackStreaming } from '../components/InterviewFeedback'
import InterviewReportCard from '../components/InterviewReport'
import StreamProgress from '../components/StreamProgress'
import CountUpNumber from '../components/CountUpNumber'

type InterviewPhase = 'setup' | 'loading' | 'questioning' | 'report' | 'error'

export default function Interview() {
  const data = loadResumeData()
  const hasProfile = data.profile.name.trim() !== ''

  const [phase, setPhase] = useState<InterviewPhase>('setup')
  const [targetRole, setTargetRole] = useState(data.targetRole || '')
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<InterviewAnswer[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [report, setReport] = useState<InterviewReport | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Streams
  const evalStream = useStream<InterviewFeedback>(STREAM_ENDPOINTS.interviewEvaluate)
  const reportStream = useStream<InterviewReport>(STREAM_ENDPOINTS.interviewReport)

  // Report progressive streaming
  const reportSteps = [
    { key: 'overallScore', label: '综合评分' },
    { key: 'topStrengths', label: '核心优势' },
    { key: 'keyImprovements', label: '改进方向' },
    { key: 'practiceTopics', label: '练习话题' },
    { key: 'summary', label: '总结' },
  ]
  const reportProgressive = useProgressiveJSON<InterviewReport>(
    reportStream.rawText,
    {
      overallScore: 'number',
      topStrengths: 'array',
      keyImprovements: 'array',
      practiceTopics: 'array',
      summary: 'string',
    },
    reportStream.status,
  )

  const handleStart = useCallback(async () => {
    if (!targetRole.trim()) {
      setErrorMsg('请选择或输入目标岗位')
      return
    }

    setPhase('loading')
    setErrorMsg('')

    try {
      const result = await fetchInterviewQuestions(targetRole, {
        skills: data.skills,
        projects: data.projects,
        summary: '',
      })
      setQuestions(result.questions)
      setAnswers([])
      setCurrentQ(0)
      setCurrentInput('')
      setPhase('questioning')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '生成面试题失败')
      setPhase('error')
    }
  }, [targetRole, data])

  const handleSubmitAnswer = useCallback(() => {
    if (!currentInput.trim() || currentQ >= questions.length) return

    const question = questions[currentQ]

    // Add the answer to the list
    const newAnswer: InterviewAnswer = {
      questionId: question.id,
      question: question.question,
      category: question.category,
      userAnswer: currentInput,
      feedback: null,
    }

    setAnswers((prev) => [...prev, newAnswer])

    // Start evaluation stream
    evalStream.start({
      question: question.question,
      expectedTopics: question.expectedTopics,
      userAnswer: currentInput,
      targetRole,
    })
  }, [currentInput, currentQ, questions, targetRole, evalStream])

  // When eval stream finishes, save feedback and move to next question
  const handleNextQuestion = useCallback(() => {
    // Save feedback from eval stream
    if (evalStream.data) {
      setAnswers((prev) => {
        const updated = [...prev]
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            feedback: evalStream.data,
          }
        }
        return updated
      })
    }

    // Reset eval stream so previous feedback doesn't linger
    evalStream.reset()

    const nextQ = currentQ + 1
    if (nextQ >= questions.length) {
      // All questions answered — generate report
      const finalAnswers = answers.map((a, i) => ({
        questionId: a.questionId,
        score: i < answers.length - 1 ? (a.feedback?.score ?? 0) : (evalStream.data?.score ?? 0),
      }))

      // Include the last answer if it hasn't been added yet
      if (finalAnswers.length < questions.length) {
        const lastAnswer = answers[answers.length - 1]
        if (lastAnswer) {
          finalAnswers.push({
            questionId: lastAnswer.questionId,
            score: evalStream.data?.score ?? 0,
          })
        }
      }

      reportStream.start({
        targetRole,
        questions: questions.map((q) => ({ id: q.id, category: q.category, question: q.question })),
        answers: finalAnswers,
      })
      setPhase('report')
    } else {
      setCurrentQ(nextQ)
      setCurrentInput('')
    }
  }, [currentQ, questions, answers, evalStream.data, reportStream, targetRole])

  const handleRetake = useCallback(() => {
    setPhase('setup')
    setQuestions([])
    setAnswers([])
    setCurrentQ(0)
    setCurrentInput('')
    setReport(null)
    setErrorMsg('')
  }, [])

  // Watch for eval stream completion
  const isEvalStreaming = evalStream.status === 'streaming'
  const isReportStreaming = reportStream.status === 'streaming'

  // Save report when report stream finishes
  if (reportStream.status === 'done' && reportStream.data && !report) {
    setReport(reportStream.data)
  }

  // ─── No profile data ───
  if (!hasProfile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-border">
          <svg
            className="h-8 w-8 text-ink-muted"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.416-.388m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.416-.388m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-xl font-bold text-ink">还没有个人信息</h2>
        <p className="mt-2 text-sm text-ink-muted">请先填写个人信息和技能后再开始模拟面试。</p>
        <Link
          to="/create"
          className="btn-shine mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          去填写信息
        </Link>
      </div>
    )
  }

  // ─── Setup phase ───
  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">模拟面试</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">AI 模拟面试</h1>
          <p className="mt-2 text-ink-muted">
            基于你的简历内容，AI 为你生成针对性的面试题目并实时评估回答。
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-border/20 sm:p-8">
          <div className="space-y-6">
            {/* 目标岗位 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">目标岗位</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="例如：前端开发实习"
                className="w-full rounded-xl border border-border bg-surface-warm/30 px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 transition-all duration-200 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15 focus:outline-none"
              />
              {data.targetRole && (
                <p className="mt-1.5 text-xs text-ink-muted">
                  已自动填入你的目标岗位：
                  <span className="font-medium text-primary">{data.targetRole}</span>
                </p>
              )}
            </div>

            {/* 题型说明 */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="card-hover-lift rounded-xl border border-border bg-surface-warm/30 p-4 text-center">
                <div className="text-2xl">💻</div>
                <p className="mt-1 text-xs font-semibold text-ink">专业知识题</p>
                <p className="text-[10px] text-ink-muted">考察岗位核心知识</p>
              </div>
              <div className="card-hover-lift rounded-xl border border-border bg-surface-warm/30 p-4 text-center">
                <div className="text-2xl">📁</div>
                <p className="mt-1 text-xs font-semibold text-ink">项目深挖题</p>
                <p className="text-[10px] text-ink-muted">深挖项目细节</p>
              </div>
              <div className="card-hover-lift rounded-xl border border-border bg-surface-warm/30 p-4 text-center">
                <div className="text-2xl">🤝</div>
                <p className="mt-1 text-xs font-semibold text-ink">行为题</p>
                <p className="text-[10px] text-ink-muted">考察软技能</p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-2.5 text-sm text-error">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleStart}
              className="btn-shine w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
            >
              开始模拟面试
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading phase ───
  if (phase === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto flex h-12 w-12 animate-spin items-center justify-center rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-ink">AI 正在根据你的简历生成面试题...</p>
        <p className="mt-1 text-xs text-ink-muted">请稍候</p>
      </div>
    )
  }

  // ─── Error phase ───
  if (phase === 'error') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <svg
            className="h-8 w-8 text-error"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-xl font-bold text-ink">{errorMsg || '出了点问题'}</h2>
        <button
          onClick={() => setPhase('setup')}
          className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          重新开始
        </button>
      </div>
    )
  }

  // ─── Report phase ───
  if (phase === 'report') {
    if (isReportStreaming) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">面试报告</h1>

          <div className="mt-6">
            <StreamProgress
              steps={reportSteps}
              completedKeys={reportProgressive.completedKeys as string[]}
              currentKey={reportProgressive.currentKey}
              progress={reportProgressive.progress}
            />
          </div>

          <div className="space-y-6">
            {/* Overall score */}
            {reportProgressive.fields.overallScore?.value != null && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-light text-3xl font-extrabold text-white shadow-lg">
                  <CountUpNumber value={reportProgressive.fields.overallScore.value} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-ink">
                  {reportProgressive.fields.overallScore.value >= 90
                    ? '优秀'
                    : reportProgressive.fields.overallScore.value >= 75
                      ? '良好'
                      : reportProgressive.fields.overallScore.value >= 60
                        ? '一般'
                        : '待改进'}
                </h2>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid gap-6 sm:grid-cols-2">
              {reportProgressive.fields.topStrengths?.value &&
                reportProgressive.fields.topStrengths.value.length > 0 && (
                  <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-success">
                      核心优势
                    </h3>
                    <ul className="space-y-2">
                      {reportProgressive.fields.topStrengths.value.map((s, i) => (
                        <li
                          key={i}
                          className="animate-fade-up flex gap-2 text-sm text-ink-light"
                          style={{ animationDelay: `${i * 80}ms` }}
                        >
                          <span className="mt-0.5 shrink-0 text-success">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              {reportProgressive.fields.keyImprovements?.value &&
                reportProgressive.fields.keyImprovements.value.length > 0 && (
                  <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-error">
                      改进方向
                    </h3>
                    <ul className="space-y-2">
                      {reportProgressive.fields.keyImprovements.value.map((item, i) => (
                        <li
                          key={i}
                          className="animate-fade-up flex gap-2 text-sm text-ink-light"
                          style={{ animationDelay: `${i * 80}ms` }}
                        >
                          <span className="mt-0.5 shrink-0 text-error">→</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* Practice topics */}
            {reportProgressive.fields.practiceTopics?.value &&
              reportProgressive.fields.practiceTopics.value.length > 0 && (
                <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    推荐练习话题
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {reportProgressive.fields.practiceTopics.value.map((topic, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Summary */}
            {reportProgressive.fields.summary?.value && (
              <div className="animate-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  面试总结
                </h3>
                <p className="text-sm leading-relaxed text-ink-light">
                  {reportProgressive.fields.summary.value}
                </p>
              </div>
            )}

            {/* Skeleton */}
            {reportProgressive.fields.overallScore?.value == null && (
              <div className="animate-pulse rounded-2xl border border-border bg-card p-8 text-center">
                <div className="mx-auto h-20 w-20 rounded-3xl bg-border/40" />
                <div className="mx-auto mt-4 h-4 w-24 rounded bg-border/40" />
              </div>
            )}
          </div>
        </div>
      )
    }

    if (reportStream.status === 'error') {
      return (
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h2 className="text-xl font-bold text-ink">报告生成失败</h2>
          <p className="mt-2 text-sm text-ink-muted">{reportStream.errorMsg}</p>
          <button
            onClick={handleRetake}
            className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            重新面试
          </button>
        </div>
      )
    }

    if (report) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">面试报告</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">面试总结</h1>
          </div>
          <InterviewReportCard report={report} questions={questions} onRetake={handleRetake} />
        </div>
      )
    }

    return null
  }

  // ─── Questioning phase ───
  const question = questions[currentQ]
  if (!question) return null

  const showFeedback = evalStream.status === 'done' || evalStream.status === 'streaming'
  const hasFeedback = evalStream.status === 'done' && evalStream.data

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">模拟面试</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
          AI 模拟面试
          <span className="ml-3 text-base font-normal text-ink-muted">
            第 {currentQ + 1} / {questions.length} 题
          </span>
        </h1>
      </div>
      <div className="card-hover-lift rounded-2xl border border-border/80 bg-card shadow-lg shadow-border/20">
        <div className="p-6">
          <InterviewQuestionCard
            question={question}
            questionNumber={currentQ + 1}
            totalQuestions={questions.length}
            answer={currentInput}
            onAnswerChange={setCurrentInput}
            onSubmit={handleSubmitAnswer}
          />
        </div>
      </div>

      {/* Feedback section */}
      {showFeedback && (
        <div className="mt-6">
          {isEvalStreaming && (
            <InterviewFeedbackStreaming
              rawText={evalStream.rawText}
              streamStatus={evalStream.status}
            />
          )}
          {hasFeedback && (
            <div className="space-y-4">
              <InterviewFeedbackCard feedback={evalStream.data!} isStreaming={false} rawText="" />
              <button
                onClick={handleNextQuestion}
                className="btn-shine inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
              >
                {currentQ + 1 >= questions.length ? (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                      />
                    </svg>
                    查看面试报告
                  </>
                ) : (
                  <>
                    下一题
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Answer history (collapsed) */}
      {answers.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-xs font-medium text-ink-muted hover:text-ink">
            查看已回答的题目 ({answers.length})
          </summary>
          <div className="mt-3 space-y-3">
            {answers.map((a, i) => (
              <div key={i} className="rounded-lg border border-border-light p-3">
                <p className="text-xs font-medium text-ink">
                  Q{i + 1}. {a.question}
                </p>
                <p className="mt-1 text-xs text-ink-muted line-clamp-2">{a.userAnswer}</p>
                {a.feedback && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.feedback.score >= 80
                          ? 'bg-success/10 text-success'
                          : a.feedback.score >= 60
                            ? 'bg-accent/10 text-accent'
                            : 'bg-error/10 text-error'
                      }`}
                    >
                      {a.feedback.score}分
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
