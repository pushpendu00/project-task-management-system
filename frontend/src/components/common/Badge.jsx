import React from 'react'

const STATUS_CLASSES = {
  todo:          'badge-todo',
  'in-progress': 'badge-in-progress',
  'in-review':   'badge-in-review',
  done:          'badge-done',
}
const PRIORITY_CLASSES = {
  low:      'badge-low',
  medium:   'badge-medium',
  high:     'badge-high',
  critical: 'badge-critical',
}

const Badge = ({ type = 'status', value, className = '' }) => {
  const classMap = type === 'priority' ? PRIORITY_CLASSES : STATUS_CLASSES
  const cls      = classMap[value] || 'badge bg-slate-700 text-slate-300'
  return (
    <span className={`${cls} ${className}`}>
      {value?.replace(/-/g, ' ')}
    </span>
  )
}

export default Badge
