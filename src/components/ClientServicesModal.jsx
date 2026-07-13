// Modal to manage services for a specific client
// Opened from ClientsTab — CA can add/edit/update service statuses
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const SERVICE_OPTIONS = [
  'ITR Filing',
  'GST Monthly Return',
  'GST Quarterly Return',
  'GST Annual Return',
  'Tax Audit',
  'Company Audit',
  'TDS Filing',
  'Company Registration',
  'ROC Filing',
  'MSME Registration',
  'Other',
]

const STATUS_OPTIONS = [
  'Pending Documents',
  'Under Review',
  'In Progress',
  'Filed',
  'Completed',
  'On Hold',
  'Rejected',
]

const STATUS_BADGE = {
  'Pending Documents': 'badge-yellow',
  'Under Review':      'badge-blue',
  'In Progress':       'badge-blue',
  'Filed':             'badge-green',
  'Completed':         'badge-green',
  'On Hold':           'badge-gray',
  'Rejected':          'badge-red',
}

function AddServiceForm({ firmId, clientId, onSaved }) {
  const [form, setForm] = useState({ service_name: SERVICE_OPTIONS[0], status: 'Pending Documents', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function save() {
    setSaving(true); setError('')
    const { error: err } = await supabase.from('client_services').insert({
      firm_id: firmId, client_id: clientId,
      service_name: form.service_name, status: form.status, notes: form.notes
    })
    if (err) { setError(err.message); setSaving(false); return }
    setForm({ service_name: SERVICE_OPTIONS[0], status: 'Pending Documents', notes: '' })
    onSaved()
  }

  return (
    <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Add Service</div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid-2">
        <div className="form-group">
          <label>Service</label>
          <select className="input" value={form.service_name} onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))}>
            {SERVICE_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Notes (visible to client)</label>
        <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Waiting for Form 16" />
      </div>
      <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Adding…' : '+ Add Service'}</button>
    </div>
  )
}

function ServiceRow({ service, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus]   = useState(service.status)
  const [notes, setNotes]     = useState(service.notes ?? '')
  const [saving, setSaving]   = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('client_services').update({ status, notes, updated_at: new Date().toISOString() }).eq('id', service.id)
    setSaving(false); setEditing(false); onUpdated()
  }

  async function del() {
    if (!confirm('Remove this service?')) return
    await supabase.from('client_services').delete().eq('id', service.id)
    onDeleted()
  }

  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '' }

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
      {editing ? (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 10 }}>{service.service_name}</div>
          <div className="grid-2">
            <div className="form-group">
              <label>Status</label>
              <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes for client…" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>{service.service_name}</div>
            {service.notes && <div className="text-muted text-sm" style={{ marginTop: 2 }}>{service.notes}</div>}
            <div className="text-muted text-sm" style={{ marginTop: 2 }}>Updated: {fmtDate(service.updated_at)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`badge ${STATUS_BADGE[service.status] ?? 'badge-gray'}`}>{service.status}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={del}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ClientServicesModal({ client, firmId, onClose }) {
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('client_services')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at')
    setServices(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [client.id])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div>
            <h3>Services — {client.name}</h3>
            <div className="text-muted text-sm">{client.pan || client.email || ''}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <AddServiceForm firmId={firmId} clientId={client.id} onSaved={load} />

          {loading
            ? <p className="text-muted">Loading…</p>
            : services.length === 0
              ? <div className="empty-state" style={{ padding: '20px 0' }}><p>No services added yet</p></div>
              : services.map(s => (
                  <ServiceRow key={s.id} service={s} onUpdated={load} onDeleted={load} />
                ))
          }
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
