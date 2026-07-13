import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const SERVICE_DEFAULTS = ['ITR Filing', 'GST Monthly Return', 'GST Quarterly Return', 'Tax Audit', 'Company Audit', 'TDS Filing', 'Company Registration', 'Other']

function UserModal({ firmId, user, onClose, onSaved }) {
  const isEdit = !!user
  const [form, setForm] = useState({
    name:  user?.name  ?? '',
    email: user?.email ?? '',
    role:  user?.role  ?? 'staff',
    password: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function save() {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required'); return }
    if (!isEdit && !form.password) { setError('Password is required for new users'); return }
    setSaving(true); setError('')

    if (!isEdit) {
      // Create auth user first via Supabase Admin (simplified: use signUp for now)
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if (authErr) { setError(authErr.message); setSaving(false); return }

      const { error: dbErr } = await supabase.from('users').insert({
        firm_id: firmId, name: form.name, email: form.email,
        role: form.role, auth_id: authData.user?.id
      })
      if (dbErr) { setError(dbErr.message); setSaving(false); return }
    } else {
      const { error: dbErr } = await supabase.from('users').update({ name: form.name, role: form.role }).eq('id', user.id)
      if (dbErr) { setError(dbErr.message); setSaving(false); return }
    }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit User' : 'Add Team Member / Client'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Full Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" disabled={isEdit} />
          </div>
          {!isEdit && (
            <div className="form-group">
              <label>Password *</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
            </div>
          )}
          <div className="form-group">
            <label>Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="admin">Admin (CA / Firm Owner)</option>
              <option value="staff">Staff (Article Clerk / Employee)</option>
              <option value="client">Client (End Client — limited access)</option>
            </select>
          </div>
          {form.role === 'client' && (
            <div className="alert" style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}>
              Client users will see only their own documents, service status, and notices.
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsTab({ profile }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [activeTab, setActiveTab] = useState('team')

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').eq('firm_id', profile.firm_id).order('role').order('name')
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [profile.firm_id])

  const roleBadge = r => ({ admin: 'badge-red', staff: 'badge-blue', client: 'badge-green' })[r] ?? 'badge-gray'

  return (
    <div className="page">
      {modal && (
        <UserModal
          firmId={profile.firm_id}
          user={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadUsers() }}
        />
      )}

      <div className="page-header"><h2>Settings</h2></div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>Team & Users</button>
        <button className={`tab-btn ${activeTab === 'firm' ? 'active' : ''}`} onClick={() => setActiveTab('firm')}>Firm Profile</button>
      </div>

      {activeTab === 'team' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600 }}>Users</h3>
            <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add User</button>
          </div>

          {loading
            ? <p className="text-muted">Loading…</p>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td className="text-muted">{u.email}</td>
                        <td><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                        <td>
                          {u.id !== profile.id && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}>Edit</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {activeTab === 'firm' && (
        <div className="card">
          <FirmSettings profile={profile} />
        </div>
      )}
    </div>
  )
}

function FirmSettings({ profile }) {
  const [name, setName]     = useState(profile.firms?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')

  async function save() {
    setSaving(true); setMsg('')
    await supabase.from('firms').update({ name }).eq('id', profile.firm_id)
    setMsg('Saved!'); setSaving(false)
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <>
      <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Firm Profile</h3>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="form-group" style={{ maxWidth: 360 }}>
        <label>Firm / CA Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your CA Firm Name" />
      </div>
      <div className="form-group" style={{ maxWidth: 360 }}>
        <label>Plan</label>
        <input className="input" value={profile.firms?.plan === 'pro' ? 'Pro' : 'Free'} disabled />
      </div>
      <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
    </>
  )
}
