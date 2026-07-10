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
import InterviewQuestionCard from '../components/InterviewQuestion'
import InterviewFeedbackCard from '../components/InterviewFeedback'
import InterviewReportCard from '../components/InterviewReport'

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
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">AI 模拟面试</h1>
        <p className="mt-2 text-sm text-ink-muted">
          基于你的简历内容，AI 为你生成针对性的面试题目并实时评估回答。
        </p>

        <div className="mt-8 space-y-6">
          {/* Target role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">目标岗位</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="例如：前端开发实习"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
            />
            {data.targetRole && (
              <p className="mt-1.5 text-xs text-ink-muted">
                已自动填入你的目标岗位：{data.targetRole}
              </p>
            )}
          </div>

          {/* Info cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl">💻</div>
              <p className="mt-1 text-xs font-medium text-ink">技术题</p>
              <p className="text-[10px] text-ink-muted">考察技术理解深度</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl">📁</div>
              <p className="mt-1 text-xs font-medium text-ink">项目题</p>
              <p className="text-[10px] text-ink-muted">深挖项目细节</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl">🤝</div>
              <p className="mt-1 text-xs font-medium text-ink">行为题</p>
              <p className="text-[10px] text-ink-muted">考察软技能</p>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-2.5 text-sm text-error">
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
          <div className="mt-6 rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-3 w-3">
                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
              </div>
              <span className="text-sm font-medium text-ink">AI 正在生成面试报告...</span>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-lg bg-ink/[0.03] p-4 font-mono text-xs leading-relaxed text-ink-muted whitespace-pre-wrap">
              {reportStream.rawText || '连接中...'}
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary" />
            </div>
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
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">面试报告</h1>
          <div className="mt-6">
            <InterviewReportCard report={report} questions={questions} onRetake={handleRetake} />
          </div>
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
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">AI 模拟面试</h1>
      <div className="mt-6">
        <InterviewQuestionCard
          question={question}
          questionNumber={currentQ + 1}
          totalQuestions={questions.length}
          answer={currentInput}
          onAnswerChange={setCurrentInput}
          onSubmit={handleSubmitAnswer}
          isSubmitting={isEvalStreaming}
        />
      </div>

      {/* Feedback section */}
      {showFeedback && (
        <div className="mt-6">
          {isEvalStreaming && (
            <InterviewFeedbackCard
              feedback={evalStream.data!}
              isStreaming={true}
              rawText={evalStream.rawText}
            />
          )}
          {hasFeedback && (
            <div className="space-y-4">
              <InterviewFeedbackCard feedback={evalStream.data!} isStreaming={false} rawText="" />
              <button
                onClick={handleNextQuestion}
                className="btn-shine w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark"
              >
                {currentQ + 1 >= questions.length ? '查看面试报告' : '下一题'}
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
