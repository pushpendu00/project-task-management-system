import React, { useState, useEffect } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'
import api from '../../api/axios'
import Select from '../common/Select'

const STATUS_OPTIONS   = ['planning', 'active', 'on-hold', 'completed', 'cancelled', 'archived']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical']

const ProjectForm = ({ initialData = {}, onSubmit, loading = false, onCancel }) => {
  const [form, setForm] = useState({
    name:            initialData.name            || '',
    description:     initialData.description     || '',
    status:          initialData.status          || 'planning',
    priority:        initialData.priority        || 'medium',
    startDate:       initialData.startDate       ? initialData.startDate.slice(0, 10) : '',
    endDate:         initialData.endDate         ? initialData.endDate.slice(0, 10)   : '',
    tags:            initialData.tags?.join(', ') || '',
    assignedManager: initialData.assignedManager?._id || initialData.assignedManager || '',
  })
  const [managers, setManagers] = useState([])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    api.get('/users')
      .then(({ data }) => {
        setManagers(data.users?.filter(u => u.role === 'manager' && u.isActive) || [])
      })
      .catch(() => {})
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Project name is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    }
    if (!payload.assignedManager) delete payload.assignedManager
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="project-form">
      <Input id="project-name" label="Project Name *" name="name"
             value={form.name} onChange={handleChange} placeholder="e.g. E-Commerce Platform" error={errors.name} />
      <div>
        <label className="label">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Describe the project..." rows={3}
                  className="input resize-none" id="project-description" />
      </div>
      
      {/* Project Manager Selection */}
      <div>
        <Select
          label="Assigned Project Manager"
          name="assignedManager"
          value={form.assignedManager}
          onChange={handleChange}
          className="w-full"
          buttonClassName="py-2.5 px-3 bg-dark-900 border border-slate-700 rounded-lg text-slate-200 text-xs w-full text-left"
          id="project-manager-select"
        >
          <option value="">Unassigned</option>
          {managers.map((m) => (
            <option key={m._id} value={m._id} avatar={m.avatar} name={m.name}>{m.name} ({m.email})</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full"
            buttonClassName="py-2.5 px-3 bg-dark-900 border border-slate-700 rounded-lg text-slate-200 text-xs w-full text-left"
            id="project-status"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
          </Select>
        </div>
        <div>
          <Select
            label="Priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full"
            buttonClassName="py-2.5 px-3 bg-dark-900 border border-slate-700 rounded-lg text-slate-200 text-xs w-full text-left"
            id="project-priority"
          >
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input id="project-start" label="Start Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
        <Input id="project-end"   label="End Date"   name="endDate"   type="date" value={form.endDate}   onChange={handleChange} />
      </div>
      <Input id="project-tags" label="Tags (comma separated)" name="tags"
             value={form.tags} onChange={handleChange} placeholder="e.g. frontend, api" />
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" loading={loading}>
          {initialData._id ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}

export default ProjectForm
