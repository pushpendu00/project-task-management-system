import React, { forwardRef } from 'react'

const Input = forwardRef(({ label, error, id, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="label">{label}</label>}
      <input
        id={id}
        ref={ref}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
