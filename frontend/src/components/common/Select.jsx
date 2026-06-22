import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AiOutlineDown, AiOutlineCheck, AiOutlineUser } from 'react-icons/ai'
import { getInitials } from '../../utils/getInitials'

const getAvatarUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const host = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase
  return `${host}${path}`
}

const Select = ({
  children,
  options = [],
  value,
  onChange,
  placeholder = 'Select option',
  label,
  className = '',
  buttonClassName = '',
  id,
  name,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const portalMenu = document.getElementById(`select-portal-${id || name || 'default'}`)
        if (portalMenu && portalMenu.contains(event.target)) {
          return
        }
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [id, name])

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      updateCoords()
      window.addEventListener('resize', updateCoords)
      window.addEventListener('scroll', updateCoords, true)
    }
    return () => {
      window.removeEventListener('resize', updateCoords)
      window.removeEventListener('scroll', updateCoords, true)
    }
  }, [isOpen])

  // Parse options from children or explicit options array
  let parsedOptions = [...options]
  if (children) {
    React.Children.forEach(children, (child) => {
      if (child && child.type === 'option') {
        parsedOptions.push({
          value: child.props.value,
          label: child.props.children,
          avatar: child.props.avatar || child.props['data-avatar'],
          name: child.props.name || child.props['data-name'],
        })
      }
    })
  }

  const optionList = parsedOptions.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  const selectedOption = optionList.find((opt) => String(opt.value) === String(value))

  const isUserDropdown = optionList.some((opt) => opt.avatar !== undefined || opt.name !== undefined)

  const renderAvatar = (avatar, name) => {
    if (!isUserDropdown) return null;

    return (
      <div className="w-5 h-5 rounded-full bg-slate-700/50 font-bold text-slate-350 text-[10px] flex items-center justify-center overflow-hidden flex-shrink-0 mr-2 border border-slate-750/30">
        {avatar ? (
          <img
            src={getAvatarUrl(avatar)}
            alt={name || 'User'}
            className="w-full h-full object-cover"
          />
        ) : name ? (
          getInitials(name) || 'U'
        ) : (
          <AiOutlineUser size={12} className="text-slate-400" />
        )}
      </div>
    );
  }

  const handleSelect = (val) => {
    setIsOpen(false)
    if (onChange) {
      onChange({ target: { name, value: val } })
    }
  }

  const dropdownMenu = (
    <div
      id={`select-portal-${id || name || 'default'}`}
      style={{
        position: 'absolute',
        top: `${coords.top + 6}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        minWidth: '120px',
      }}
      className="bg-dark-850 border border-slate-750/70 rounded-lg shadow-xl max-h-60 overflow-y-auto z-[9999] animate-fade-in p-1 space-y-0.5"
    >
      {optionList.map((opt) => {
        const isSelected = String(opt.value) === String(value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className={`w-full text-left text-xs px-2.5 py-1.5 rounded transition-colors cursor-pointer flex items-center justify-between font-medium ${
              isSelected
                ? 'bg-primary-600/20 text-white'
                : 'text-slate-350 hover:text-white hover:bg-dark-700/50'
            }`}
          >
            <div className="flex items-center min-w-0 flex-1">
              {renderAvatar(opt.avatar, opt.name)}
              <span className="whitespace-normal break-words pr-2">{opt.label}</span>
            </div>
            {isSelected && <AiOutlineCheck className="text-primary-400 flex-shrink-0" size={12} />}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {label && (
        <label className="label text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`input flex items-center justify-between text-left cursor-pointer w-full text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 ${buttonClassName || 'py-2 px-3'}`}
        id={id}
      >
        <div className="flex items-center min-w-0 flex-1">
          {selectedOption && renderAvatar(selectedOption.avatar, selectedOption.name)}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <AiOutlineDown size={10} className="text-slate-500 flex-shrink-0 ml-2" />
      </button>

      {isOpen && createPortal(dropdownMenu, document.body)}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default Select
