interface FormInputProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  error?: string
}

export default function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error,
}: FormInputProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-light">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`mt-1.5 w-full rounded-xl border bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 transition-all duration-200 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
            : 'border-border focus:border-primary focus:ring-primary/15'
        }`}
      />
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  )
}
