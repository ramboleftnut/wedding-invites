import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        className={`w-full px-4 py-2.5 rounded-lg border text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all ${
          error ? 'border-red-400 bg-red-50' : 'border-stone-300 bg-white hover:border-stone-400'
        } ${className}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Input
