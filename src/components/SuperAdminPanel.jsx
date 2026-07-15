import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-admin`

async function callAdmin(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  })
  return res.json()
}

// ── Create Firm Modal ────────────────────────────────────────
function CreateFirmModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ firmName: '', adminName: '', adminEmail: '', adminPassword: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    if (!form.firmName || !form.adminName || !form.adminEmail || !form.adminPassword) {
      setError('All fields are required'); return
    }
    if (form.adminPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    setSaving(true); setError('')
    const res = await callAdmin('create_firm', form)
    if (res.error) { setError(res.error); setSaving(false); return }
    onCreated(form)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Add New CA Firm</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Firm Name *</label>
              <input className="input" value={form.firmName} onChange={e => set('firmName', e.target.value)} placeholder="e.g. Sharma & Associates" />
            </div>
            <div className="form-group">
              <label>Admin Name *</label>
              <input className="input" value={form.adminName} onChange={e => set('adminName', e.target.value)} placeholder="CA Full Name" />
            </div>
            <div className="form-group">
              <label>Admin Email *</label>
              <input className="input" type="email" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} placeholder="ca@firm.com" />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input className="input" type="password" value={form.adminPassword} onChange={e => set('adminPassword', e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create Firm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Reset Password Modal ─────────────────────────────────────
function ResetPasswordModal({ firm, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!email || !password) { setError('All fields required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setSaving(true); setError('')
    const res = await callAdmin('reset_password', { adminEmail: email, newPassword: password })
    if (res.error) { setError(res.error); setSaving(false); return }
    setSuccess(true)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Reset Password — {firm.name}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {success ? (
            <div>
              <div className="alert" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }}>
                Password reset successfully.
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onClose}>Done</button>
            </div>
          ) : (
            <form onSubmit={submit}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Admin Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@firm.com" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Panel ───────────────────────────────────────────────
export default function SuperAdminPanel() {
  const [firms, setFirms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'create' | { type: 'reset', firm }
  const [successMsg, setSuccessMsg] = useState('')

  async function loadFirms() {
    setLoading(true)
    const res = await callAdmin('list_firms')
    setFirms(res.firms ?? [])
    setLoading(false)
  }

  useEffect(() => { loadFirms() }, [])

  async function toggleFirm(firm) {
    const newDisabled = !firm.disabled
    await callAdmin('toggle_firm', { firmId: firm.id, disabled: newDisabled })
    setFirms(fs => fs.map(f => f.id === firm.id ? { ...f, disabled: newDisabled } : f))
  }

  async function togglePlan(firm) {
    const newPlan = firm.plan === 'pro' ? 'free' : 'pro'
    if (!confirm(`Switch ${firm.name} to ${newPlan.toUpperCase()} plan?`)) return
    await callAdmin('toggle_plan', { firmId: firm.id, plan: newPlan })
    setFirms(fs => fs.map(f => f.id === firm.id ? { ...f, plan: newPlan } : f))
  }

  function handleCreated(formData) {
    setModal(null)
    setSuccessMsg(`✓ Firm "${formData.firmName}" created. Login: ${formData.adminEmail} / ${formData.adminPassword}`)
    loadFirms()
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Super Admin</h2>
          <p className="text-muted" style={{ marginTop: 4 }}>Manage all CA firms on the platform</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>+ Add Firm</button>
      </div>

      {successMsg && (
        <div className="alert" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', marginBottom: 16, fontFamily: 'monospace', fontSize: 13 }}>
          {successMsg}
          <button style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }} onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p className="text-muted" style={{ padding: 24 }}>Loading firms…</p>
        ) : firms.length === 0 ? (
          <p className="text-muted" style={{ padding: 24 }}>No firms yet. Click "Add Firm" to onboard your first CA firm.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>FIRM NAME</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>PLAN</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>CREATED</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {firms.map((firm, i) => (
                <tr key={firm.id} style={{ borderBottom: i < firms.length - 1 ? '1px solid var(--gray-100)' : 'none', opacity: firm.disabled ? 0.5 : 1 }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{firm.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: firm.plan === 'pro' ? '#dbeafe' : 'var(--gray-100)', color: firm.plan === 'pro' ? '#1d4ed8' : 'var(--gray-600)', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      {firm.plan?.toUpperCase() ?? 'FREE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: firm.disabled ? '#dc2626' : '#16a34a', fontWeight: 500, fontSize: 13 }}>
                      {firm.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--gray-500)', fontSize: 13 }}>
                    {new Date(firm.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type: 'reset', firm })}>
                        Reset Password
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: firm.plan === 'pro' ? '#92400e' : '#1d4ed8' }}
                        onClick={() => togglePlan(firm)}
                      >
                        {firm.plan === 'pro' ? '↓ Downgrade' : '↑ Upgrade to Pro'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: firm.disabled ? '#16a34a' : '#dc2626' }}
                        onClick={() => toggleFirm(firm)}
                      >
                        {firm.disabled ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'create' && (
        <CreateFirmModal onClose={() => setModal(null)} onCreated={handleCreated} />
      )}
      {modal?.type === 'reset' && (
        <ResetPasswordModal firm={modal.firm} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
