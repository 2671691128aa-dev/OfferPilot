interface LoadingStateProps {
  message?: string
}

export default function LoadingState({ message = 'AI 正在处理中' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p className="mt-6 text-lg font-medium text-gray-900">{message}...</p>
      <p className="mt-1 text-sm text-gray-500">请稍候，大约需要 10-20 秒</p>
    </div>
  )
}
