import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ExportButton from './ExportButton'
import { emailTaskOverdue } from '../emailService'

const TASK_EXPORT_COLS = [
  { key: 'title', label: 'Task' }, { key: 'client_name', label: 'Client' },
  { key: 'assigned_name', label: 'Assigned To' }, { key: 'due_date', label: 'Due Date' },
  { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' },
]

const PRIORITIES = ['Low', 'Medium', 'High']
const STATUSES   = ['pending', 'in_progress', 'done']

function TaskModal({ firmId, clients, staff, task, onClose, onSaved }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    title:       task?.title       ?? '',
    description: task?.description ?? '',
    client_id:   task?.client_id   ?? (clients[0]?.id ?? ''),
    assigned_to: task?.assigned_to ?? '',
    due_date:    task?.due_date    ?? '',
    priority:    task?.priority    ?? 'Medium',
    status:      task?.status      ?? 'pending',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    const payload = { ...form, firm_id: firmId }
    const { error: err } = isEdit
      ? await supabase.from('tasks').update(payload).eq('id', task.id)
      : await supabase.from('tasks').insert(payload)
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Task' : 'Add Task'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Task Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. File ITR for Ramesh Gupta" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Client</label>
              <select className="input" value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                <option value="">— None —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <select className="input" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                <option value="">— Unassigned —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            {isEdit && (
              <div className="form-group">
                <label>Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Task'}</button>
        </div>
      </div>
    </div>
  )
}

export default function TasksTab({ profile }) {
  const [tasks, setTasks]   = useState([])
  const [clients, setClients] = useState([])
  const [staff, setStaff]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')   // 'active' | 'done' | 'all'
  const [modal, setModal]   = useState(null)

  async function load() {
    setLoading(true)
    const [tRes, cRes, sRes] = await Promise.all([
      supabase.from('tasks').select('*, clients(name), users(name)').eq('firm_id', profile.firm_id).order('due_date'),
      supabase.from('clients').select('id,name').eq('firm_id', profile.firm_id).eq('status', 'active').order('name'),
      supabase.from('users').select('id,name,email').eq('firm_id', profile.firm_id).in('role', ['admin', 'staff']),
    ])
    setTasks(tRes.data ?? [])
    setClients(cRes.data ?? [])
    setStaff(sRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.firm_id])

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'done'
    if (filter === 'done')   return t.status === 'done'
    return true
  })

  async function quickStatus(task, newStatus) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    load()
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  async function sendOverdueReminder(t) {
    const assignedUser = staff.find(s => s.id === t.assigned_to)
    if (!assignedUser?.email) { alert('No email found for assigned staff member.'); return }
    const { data: firm } = await supabase.from('firms').select('name').eq('id', profile.firm_id).single()
    await emailTaskOverdue({
      staffEmail: assignedUser.email,
      taskTitle: t.title,
      clientName: t.clients?.name ?? '—',
      dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN') : '—',
      firmName: firm?.name ?? 'Your CA Firm',
    })
    alert(`Reminder sent to ${assignedUser.email}`)
  }

  const today = new Date()
  function dueBadge(t) {
    if (t.status === 'done') return { label: 'Done', cls: 'badge-green' }
    if (!t.due_date)         return { label: t.priority, cls: t.priority === 'High' ? 'badge-red' : t.priority === 'Medium' ? 'badge-yellow' : 'badge-gray' }
    const d = new Date(t.due_date)
    if (d < today) return { label: 'Overdue', cls: 'badge-red' }
    const diff = Math.ceil((d - today) / 86400000)
    if (diff <= 2) return { label: `Due in ${diff}d`, cls: 'badge-yellow' }
    return { label: t.priority, cls: t.priority === 'High' ? 'badge-red' : 'badge-blue' }
  }

  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—' }

  return (
    <div className="page">
      {modal && (
        <TaskModal
          firmId={profile.firm_id} clients={clients} staff={staff}
          task={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}

      <div className="page-header">
        <h2>Tasks</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <ExportButton
            data={filtered.map(t => ({ ...t, client_name: t.clients?.name, assigned_name: t.users?.name }))}
            filename="tasks" title="Task List" columns={TASK_EXPORT_COLS}
          />
          <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Task</button>
        </div>
      </div>

      <div className="card">
        <div className="tabs" style={{ marginBottom: 16 }}>
          {[['active', 'Active'], ['done', 'Done'], ['all', 'All']].map(([val, label]) => (
            <button key={val} className={`tab-btn ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>

        {loading
          ? <p className="text-muted">Loading…</p>
          : filtered.length === 0
            ? <div className="empty-state"><div className="icon">✅</div><p>No tasks here</p></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Client</th>
                      <th>Assigned To</th>
                      <th>Due</th>
                      <th>Status / Priority</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => {
                      const b = dueBadge(t)
                      return (
                        <tr key={t.id} style={{ opacity: t.status === 'done' ? 0.6 : 1 }}>
                          <td>
                            <div style={{ fontWeight: 500, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                            {t.description && <div className="text-muted text-sm">{t.description.slice(0, 60)}</div>}
                          </td>
                          <td>{t.clients?.name || '—'}</td>
                          <td>{t.users?.name || <span className="text-muted">Unassigned</span>}</td>
                          <td>{fmtDate(t.due_date)}</td>
                          <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {t.status !== 'done' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => quickStatus(t, 'done')}>✓ Done</button>
                              )}
                              {t.status === 'done' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => quickStatus(t, 'pending')}>Reopen</button>
                              )}
                              {b.label === 'Overdue' && t.assigned_to && (
                                <button className="btn btn-ghost btn-sm" style={{ color: '#c05621' }} onClick={() => sendOverdueReminder(t)}>⚠ Remind</button>
                              )}
                              <button className="btn btn-ghost btn-sm" onClick={() => setModal(t)}>Edit</button>
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteTask(t.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>
    </div>
  )
}
