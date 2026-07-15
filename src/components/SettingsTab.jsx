import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { getPlan, PLANS } from '../planUtils'

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
        <button className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>Plan</button>
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

      {activeTab === 'plan' && (
        <PlanInfo profile={profile} />
      )}
    </div>
  )
}

function PlanInfo({ profile }) {
  const plan = getPlan(profile.firms)
  const isPro = plan.key === 'pro'

  function Feature({ enabled, label }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
        <span style={{ color: enabled ? '#16a34a' : '#9ca3af', fontSize: 16 }}>{enabled ? '✓' : '✕'}</span>
        <span style={{ color: enabled ? 'var(--gray-800)' : 'var(--gray-400)', fontSize: 14 }}>{label}</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480 }}>
      {/* Current plan badge */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Current Plan</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: isPro ? '#1d4ed8' : 'var(--gray-700)' }}>
            {isPro ? '⭐ Pro' : 'Free'}
          </div>
        </div>
        <span style={{
          background: isPro ? '#dbeafe' : 'var(--gray-100)',
          color: isPro ? '#1d4ed8' : 'var(--gray-600)',
          padding: '4px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600
        }}>
          {isPro ? 'ACTIVE' : 'LIMITED'}
        </span>
      </div>

      {/* Feature comparison */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>What's included</h3>
        <Feature enabled={true}  label="Unlimited tasks & invoices" />
        <Feature enabled={true}  label="Email notifications to clients" />
        <Feature enabled={true}  label="Client portal access" />
        <Feature enabled={true}  label="Firm notices & announcements" />
        <Feature enabled={isPro} label={`Up to ${isPro ? 'unlimited' : PLANS.free.maxClients} active clients`} />
        <Feature enabled={isPro} label="Export to CSV / PDF" />

        {!isPro && (
          <div style={{ marginTop: 16, padding: 14, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: 4 }}>Upgrade to Pro</div>
            <div style={{ fontSize: 13, color: '#1e40af' }}>
              Contact your super admin to upgrade your firm to Pro for unlimited clients and export features.
            </div>
          </div>
        )}
      </div>
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
