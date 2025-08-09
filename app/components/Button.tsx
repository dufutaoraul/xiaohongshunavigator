interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  className?: string
}

export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary',
  disabled = false,
  className = ''
}: ButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent'
  
  const variantClasses = {
    primary: 'cosmic-button text-white',
    secondary: 'glass-effect text-white hover:bg-white/20 border border-white/30',
    outline: 'border border-white/40 text-white hover:bg-white/10 hover:border-white/60'
  }
  
  const disabledClasses = 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none'
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ''} ${className}`}
    >
      {children}
    </button>
  )
}