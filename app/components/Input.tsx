interface InputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'url'
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  className = ''
}: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-white mb-3">
          {label}
          {required && <span className="text-pink-400 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="cosmic-input w-full px-4 py-3 text-white placeholder:text-white/50 disabled:opacity-50 disabled:cursor-not-allowed focus:scale-105 transition-all duration-300"
      />
    </div>
  )
}