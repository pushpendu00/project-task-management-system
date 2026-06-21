import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AiOutlineUserAdd, AiOutlineSearch, AiOutlineEdit, AiOutlineCloseCircle, AiOutlineCheckCircle } from 'react-icons/ai'
import api from '../../api/axios'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'

const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  
  // Form fields
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    isActive: true
  })
  const [formLoading, setFormLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/users')
      setUsers(data.users || [])
    } catch (error) {
      toast.error('Failed to load users list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInputChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSelectChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value }))
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'member',
      isActive: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '', // blank password unless changing
      role: user.role,
      isActive: user.isActive
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Please enter name and email')
      return
    }

    try {
      setFormLoading(true)
      if (editingUser) {
        // Edit User
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          isActive: form.isActive
        }
        if (form.password) payload.password = form.password;

        const { data } = await api.put(`/users/${editingUser._id}`, payload)
        toast.success('User updated successfully')
        setUsers(prev => prev.map(u => u._id === editingUser._id ? data.user : u))
      } else {
        // Create User
        const { data } = await api.post('/users', form)
        toast.success('User created successfully')
        setUsers(prev => [data.user, ...prev])
      }
      setIsModalOpen(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user')
    } finally {
      setFormLoading(false)
    }
  }

  const toggleDeactivate = async (user) => {
    const confirmMsg = user.isActive
      ? `Are you sure you want to deactivate ${user.name}?`
      : `Are you sure you want to reactivate ${user.name}?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      if (user.isActive) {
        // Deactivate (DELETE endpoint deactivates user)
        await api.delete(`/users/${user._id}`)
        toast.success('User deactivated successfully')
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: false } : u))
      } else {
        // Reactivate (PUT update status to true)
        const { data } = await api.put(`/users/${user._id}`, { isActive: true })
        toast.success('User reactivated successfully')
        setUsers(prev => prev.map(u => u._id === user._id ? data.user : u))
      }
    } catch (error) {
      toast.error('Failed to change user status')
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="text-slate-400 text-sm mt-1">Add users, manage roles, and review account activity.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} id="add-user-btn">
          <AiOutlineUserAdd size={18} /> New User
        </Button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-sm">
        <AiOutlineSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          id="user-search-input"
          type="text"
          placeholder="Search teammates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Teammates Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 font-medium">
          {search ? 'No matching teammates found.' : 'No users registered yet.'}
        </div>
      ) : (
        <div className="card overflow-hidden border border-slate-700/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-800 border-b border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Teammate</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-dark-800/20 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-700 font-bold text-slate-200 text-sm flex items-center justify-center flex-shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 capitalize">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin' ? 'bg-primary-950/40 text-primary-400 border border-primary-800/40' :
                        u.role === 'manager' ? 'bg-purple-950/40 text-purple-400 border border-purple-800/40' :
                        'bg-blue-950/40 text-blue-400 border border-blue-800/40'
                      }`}>
                        {u.role === 'member' ? 'employee' : u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        u.isActive ? 'text-green-400' : 'text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded hover:bg-dark-700/50 text-slate-400 hover:text-white transition-colors"
                          title="Edit role/status"
                        >
                          <AiOutlineEdit size={16} />
                        </button>
                        <button
                          onClick={() => toggleDeactivate(u)}
                          className={`p-1.5 rounded hover:bg-dark-700/50 transition-colors ${
                            u.isActive ? 'text-slate-500 hover:text-red-400' : 'text-slate-500 hover:text-green-400'
                          }`}
                          title={u.isActive ? 'Deactivate User' : 'Reactivate User'}
                        >
                          {u.isActive ? <AiOutlineCloseCircle size={16} /> : <AiOutlineCheckCircle size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit Teammate' : 'Register Teammate'}>
        <form onSubmit={handleSubmit} className="space-y-4" id="teammate-form">
          <Input
            id="user-name"
            label="Name *"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            placeholder="e.g. John Doe"
            required
          />
          <Input
            id="user-email"
            label="Email Address *"
            name="email"
            type="email"
            value={form.email}
            onChange={handleInputChange}
            placeholder="john.doe@workspace.com"
            required
          />
          <Input
            id="user-password"
            label={editingUser ? 'Change Password (Leave blank to keep current)' : 'Password (Required) *'}
            name="password"
            type="password"
            value={form.password}
            onChange={handleInputChange}
            placeholder="•••••••• (Min 6 chars)"
            required={!editingUser}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">System Role</label>
              <select name="role" value={form.role} onChange={handleInputChange} className="input" id="user-role-select">
                <option value="member">Employee</option>
                <option value="manager">Project Manager</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
            {editingUser && (
              <div>
                <label className="label">Status</label>
                <select name="isActive" value={String(form.isActive)} onChange={handleSelectChange} className="input" id="user-status-select">
                  <option value="true">Active</option>
                  <option value="false">Deactivated</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formLoading} id="teammate-submit-btn">
              {editingUser ? 'Save Changes' : 'Register User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default UsersPage
