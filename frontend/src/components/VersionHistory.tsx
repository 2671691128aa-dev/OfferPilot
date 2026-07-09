import { type ResumeVersion } from '../utils/storage'

interface VersionHistoryProps {
  versions: ResumeVersion[]
  activeVersionId: string | null
  onSelect: (version: ResumeVersion) => void
  onDelete: (id: string) => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts

  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`

  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function VersionHistory({
  versions,
  activeVersionId,
  onSelect,
  onDelete,
}: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">版本历史</h3>
        <p className="mt-3 text-xs text-ink-muted/60">还没有历史版本</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">版本历史</h3>
        <span className="text-xs text-ink-muted/50">{versions.length} 个版本</span>
      </div>
      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {versions.map((v) => {
          const isActive = v.id === activeVersionId
          return (
            <div
              key={v.id}
              className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 transition cursor-pointer ${
                isActive ? 'bg-primary/8 ring-1 ring-primary/15' : 'hover:bg-surface-warm'
              }`}
              onClick={() => onSelect(v)}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isActive ? 'bg-primary text-white' : 'bg-border text-ink-muted'
                }`}
              >
                {v.data.score}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-medium truncate ${isActive ? 'text-primary' : 'text-ink-light'}`}
                >
                  {v.label}
                </p>
                <p className="text-[10px] text-ink-muted/60">{formatTime(v.timestamp)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(v.id)
                }}
                className="shrink-0 rounded-lg p-1 text-ink-muted/30 opacity-0 transition group-hover:opacity-100 hover:bg-error/10 hover:text-error"
                title="删除此版本"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
