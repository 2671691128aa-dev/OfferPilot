interface StreamCancelProps {
  onCancel: () => void
}

export default function StreamCancel({ onCancel }: StreamCancelProps) {
  return (
    <button
      onClick={onCancel}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-error/30 hover:text-error"
    >
      取消
    </button>
  )
}
