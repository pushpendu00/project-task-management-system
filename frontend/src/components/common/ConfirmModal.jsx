import React from 'react'
import Modal from './Modal'
import Button from './Button'
import { FiAlertTriangle } from 'react-icons/fi'

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
}) => {
  const colorMap = {
    danger: {
      icon: 'text-red-400 bg-red-500/10 border border-red-500/20',
      btn: 'danger',
    },
    warning: {
      icon: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
      btn: 'primary',
    },
    info: {
      icon: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
      btn: 'primary',
    },
  }

  const currentType = colorMap[type] || colorMap.danger

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center md:text-left md:flex-row md:items-start gap-4 py-2">
        <div className={`flex-shrink-0 p-3 rounded-xl ${currentType.icon}`}>
          <FiAlertTriangle size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {message}
          </p>
          <p className="text-xs text-slate-500">
            This action can affect project resources or user permissions. Please double check before confirming.
          </p>
        </div>
      </div>
      <div className="flex justify-center md:justify-end gap-3 mt-6 pt-4 border-t border-slate-700/50">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={currentType.btn} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmModal
