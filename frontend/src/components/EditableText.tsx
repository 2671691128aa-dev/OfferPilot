import { useState, useEffect } from 'react'

interface EditableTextProps {
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  className?: string
}

/**
 * 可编辑文本组件
 *
 * 点击文本进入编辑模式，显示保存/取消按钮。
 * 支持单行 input 和多行 textarea 两种模式。
 */
export default function EditableText({
  value,
  onChange,
  multiline = false,
  className = '',
}: EditableTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const save = () => {
    onChange(draft)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={className}>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={3}
            className="w-full rounded-xl border border-primary/30 bg-card px-3 py-2 text-sm text-ink focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-primary/30 bg-card px-3 py-2 text-sm text-ink focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
          />
        )}
        <div className="mt-2 flex gap-2">
          <button
            onClick={save}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white transition hover:bg-primary-dark"
          >
            保存
          </button>
          <button
            onClick={cancel}
            className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-ink-muted transition hover:bg-card"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${className} group relative cursor-pointer`}
      onClick={() => setEditing(true)}
      title="点击编辑"
    >
      {multiline ? (
        <p className="text-sm leading-relaxed text-ink-light">{value}</p>
      ) : (
        <span className="text-sm text-ink-light">{value}</span>
      )}
      <span className="absolute -right-1 -top-1 hidden rounded-lg bg-primary/10 p-1 text-primary group-hover:block">
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
          />
        </svg>
      </span>
    </div>
  )
}
