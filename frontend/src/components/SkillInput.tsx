import { useState } from 'react'

interface SkillInputProps {
  skills: string[]
  onChange: (skills: string[]) => void
}

export default function SkillInput({ skills, onChange }: SkillInputProps) {
  const [input, setInput] = useState('')

  const addSkill = () => {
    const trimmed = input.trim()
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed])
      setInput('')
    }
  }

  const removeSkill = (skill: string) => {
    onChange(skills.filter((s) => s !== skill))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-ink-light">技能</label>
      <p className="mt-1 text-xs text-ink-muted">输入技能后按 Enter 或点击添加</p>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例如：React、TypeScript、Git"
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 transition focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
        />
        <button
          type="button"
          onClick={addSkill}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          添加
        </button>
      </div>

      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3.5 py-1.5 text-sm font-medium text-primary"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="rounded-full p-0.5 text-primary/50 transition hover:bg-primary/10 hover:text-primary"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
