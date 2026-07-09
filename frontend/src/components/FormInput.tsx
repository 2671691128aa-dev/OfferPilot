interface FormInputProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  required?: boolean
}

export default function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
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
        className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 transition focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
      />
    </div>
  )
}
