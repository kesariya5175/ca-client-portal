import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ClientServicesModal from './ClientServicesModal'
import ExportButton from './ExportButton'
import { getPlan } from '../planUtils'

const CLIENT_EXPORT_COLS = [
  { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' },
  { key: 'pan', label: 'PAN' }, { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' }, { key: 'gst', label: 'GST' },
  { key: 'status', label: 'Status' },
]

const TYPES = ['Individual', 'Company', 'Partnership', 'LLP', 'HUF', 'Trust']

function ClientModal({ firmId, client, onClose, onSaved }) {
  const isEdit = !!client
  const [form, setForm] = useState({
    name: client?.name ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    pan: client?.pan ?? '',
    gst: client?.gst ?? '',
    aadhar: client?.aadhar ?? '',
    type: client?.type ?? 'Individual',
    notes: client?.notes ?? '',
    status: client?.status ?? 'active',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    const payload = { ...form, firm_id: firmId }
    const { error: err } = isEdit
      ? await supabase.from('clients').update(payload).eq('id', client.id)
      : await supabase.from('clients').insert(payload)
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Client' : 'Add Client'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ramesh Kumar" />
            </div>
            <div className="form-group">
              <label>Client Type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="client@email.com" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="98XXXXXXXX" />
            </div>
            <div className="form-group">
              <label>PAN</label>
              <input className="input" value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input className="input" value={form.gst} onChange={e => set('gst', e.target.value.toUpperCase())} placeholder="07AAACR5055K1ZA" />
            </div>
            <div className="form-group">
              <label>Aadhar (last 4)</label>
              <input className="input" value={form.aadhar} onChange={e => set('aadhar', e.target.value)} placeholder="XXXX" maxLength={4} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Internal Notes (private)</label>
            <textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notes visible only to CA team…" style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Client'}</button>
        </div>
      </div>
    </div>
  )
}

export default function ClientsTab({ profile, isAdmin, onViewClient }) {
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)   // null | 'add' | client-object
  const [servicesModal, setServicesModal] = useState(null)  // null | client-object

  const plan = getPlan(profile.firms)
  const activeCount = clients.filter(c => c.status === 'active').length
  const atLimit = !plan.export === false && activeCount >= plan.maxClients  // reuse plan object
  const overLimit = activeCount >= plan.maxClients && plan.key === 'free'

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('firm_id', profile.firm_id)
      .order('name')
    setClients(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.firm_id])

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.pan?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  async function toggleStatus(c) {
    const newStatus = c.status === 'active' ? 'inactive' : 'active'
    await supabase.from('clients').update({ status: newStatus }).eq('id', c.id)
    load()
  }

  return (
    <div className="page">
      {servicesModal && (
        <ClientServicesModal
          client={servicesModal}
          firmId={profile.firm_id}
          onClose={() => setServicesModal(null)}
        />
      )}

      {modal && (
        <ClientModal
          firmId={profile.firm_id}
          client={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}

      <div className="page-header">
        <div>
          <h2>Clients</h2>
          <span className="text-muted text-sm">
            {activeCount} active
            {plan.key === 'free' && ` / ${plan.maxClients} (Free plan)`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {plan.export && (
            <ExportButton data={filtered} filename="clients" title="Client List" columns={CLIENT_EXPORT_COLS} />
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              if (overLimit) {
                alert(`You've reached the Free plan limit of ${plan.maxClients} active clients. Ask your super admin to upgrade to Pro for unlimited clients.`)
                return
              }
              setModal('add')
            }}
          >
            + Add Client
          </button>
        </div>
      </div>

      {overLimit && (
        <div className="alert" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', marginBottom: 16 }}>
          ⚠ You've reached the <strong>Free plan limit of {plan.maxClients} clients</strong>. Contact your super admin to upgrade to Pro for unlimited clients.
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <input className="input" placeholder="Search by name, PAN or phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        </div>

        {loading
          ? <p className="text-muted">Loading…</p>
          : filtered.length === 0
            ? <div className="empty-state"><div className="icon">👥</div><p>No clients found</p></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>PAN</th>
                      <th>Phone</th>
                      <th>GST</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id}>
                        <td>
                          <button
                            onClick={() => onViewClient?.(c.id)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                          >
                            <div style={{ fontWeight: 500, color: 'var(--brand)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{c.name}</div>
                          </button>
                          {c.email && <div className="text-muted text-sm">{c.email}</div>}
                        </td>
                        <td><span className="badge badge-blue">{c.type}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.pan || '—'}</td>
                        <td>{c.phone || '—'}</td>
                        <td style={{ fontSize: 12 }}>{c.gst || '—'}</td>
                        <td>
                          <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => setServicesModal(c)}>Services</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal(c)}>Edit</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(c)}>
                              {c.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>
    </div>
  )
}
