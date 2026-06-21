import React from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <AiOutlineLoading3Quarters
      className={`animate-spin text-primary-400 ${sizes[size]} ${className}`}
    />
  )
}

export const FullPageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-dark-900/80 z-50">
    <Spinner size="lg" />
  </div>
)

export default Spinner
