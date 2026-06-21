import React, { useState, useEffect } from 'react'
import Input from '../common/Input'
import Button from '../common/Button'
import api from '../../api/axios'

const STATUS_OPTIONS   = ['todo', 'in-progress', 'in-review', 'completed', 'blocked']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical']

const TaskForm = ({ initialData = {}, projectId, members = [], onSubmit, loading = false, onCancel }) => {
  const [form, setForm] = useState({
    title:          initialData.title             || '',
    description:    initialData.description       || '',
    status:         initialData.status            || 'todo',
    priority:       initialData.priority          || 'medium',
    assignedTo:     initialData.assignedTo?._id   || '',
    dueDate:        initialData.dueDate            ? initialData.dueDate.slice(0, 10) : '',
    estimatedHours: initialData.estimatedHours     || '',
    project:        initialData.project?._id       || projectId || '',
  })
  const [errors, setErrors] = useState({})
  const [projects, setProjects] = useState([])
  const [projectMembers, setProjectMembers] = useState(members)
  const [loadingMembers, setLoadingMembers] = useState(false)

  useEffect(() => {
    if (!projectId && !initialData.project) {
      api.get('/projects')
        .then(({ data }) => setProjects(data.projects || []))
        .catch(() => {})
    }
  }, [projectId, initialData.project])

  useEffect(() => {
    if (members && members.length > 0) {
      setProjectMembers(members)
    } else if (form.project) {
      setLoadingMembers(true)
      api.get(`/projects/${form.project}`)
        .then(({ data }) => {
          setProjectMembers(data.project?.members || [])
        })
        .catch(() => {
          setProjectMembers([])
        })
        .finally(() => {
          setLoadingMembers(false)
        })
    } else {
      setProjectMembers([])
    }
  }, [form.project, members])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Task title is required'
    if (!form.project) newErrors.project = 'Project is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = { ...form }
    if (!payload.assignedTo)     delete payload.assignedTo
    if (!payload.estimatedHours) delete payload.estimatedHours
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="task-form">
      {!projectId && !initialData._id && (
        <div>
          <label className="label">Project *</label>
          <select name="project" value={form.project} onChange={handleChange} className="input" id="task-project-select" required>
            <option value="">Select Project</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          {errors.project && <p className="text-red-500 text-xs mt-1">{errors.project}</p>}
        </div>
      )}
      <Input id="task-title" label="Task Title *" name="title"
             value={form.title} onChange={handleChange} placeholder="e.g. Implement login page" error={errors.title} />
      <div>
        <label className="label">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Describe the task..." rows={3} className="input resize-none" id="task-description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="input" id="task-status">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange} className="input" id="task-priority">
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Assign To {loadingMembers && <span className="text-xs text-slate-500 font-normal">(loading...)</span>}</label>
          <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="input" id="task-assigned-to">
            <option value="">Unassigned</option>
            {projectMembers.map((m) => (
              <option key={m.user?._id || m.user} value={m.user?._id || m.user}>{m.user?.name || 'Unknown'}</option>
            ))}
          </select>
        </div>
        <Input id="task-due-date" label="Due Date" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
      </div>
      <Input id="task-hours" label="Estimated Hours" name="estimatedHours" type="number"
             min="0" value={form.estimatedHours} onChange={handleChange} placeholder="e.g. 8" />
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" loading={loading}>
          {initialData._id ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}

export default TaskForm
