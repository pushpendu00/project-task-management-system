import React from 'react'

const STATUS_CLASSES = {
  // Task statuses
  todo: 'badge-todo',
  'in-progress': 'badge-in-progress',
  'in-review': 'badge-in-review',
  completed: 'badge-done',
  blocked: 'badge-critical',

  // Project statuses
  planning: 'badge-planning',
  active: 'badge-active',
  'on-hold': 'badge-on-hold',
  cancelled: 'badge-critical',
  archived: 'badge-todo',
}
const PRIORITY_CLASSES = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  critical: 'badge-critical',
}

const Badge = ({ type = 'status', value, className = '' }) => {
  const classMap = type === 'priority' ? PRIORITY_CLASSES : STATUS_CLASSES
  const cls = classMap[value] || 'badge bg-slate-700 text-slate-300'
  return (
    <span className={`${cls} ${className} px-1.5 py-0.5 text-xs font-semibold rounded-full tracking-wide`}>
      {value?.replace(/-/g, ' ')}
    </span>
  )
}

export default Badge
