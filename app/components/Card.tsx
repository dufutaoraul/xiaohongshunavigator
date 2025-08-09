interface CardProps {
  children: React.ReactNode
  title?: string
  className?: string
  icon?: string
}

export default function Card({ children, title, className = '', icon }: CardProps) {
  return (
    <div className={`glass-effect p-8 fade-in-up floating-card ${className}`}>
      {title && (
        <div className="flex items-center mb-6">
          {icon && <span className="text-2xl mr-3 breathing-glow">{icon}</span>}
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
      )}
      <div className="text-white/90">
        {children}
      </div>
    </div>
  )
}