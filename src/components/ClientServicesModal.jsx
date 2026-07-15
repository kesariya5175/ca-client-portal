// ClientServicesModal — CA enrolls services a client has opted for
// Opens from ClientsTab. Each enrollment = service + financial year.
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { CA_SERVICES, getFinancialYears } from '../caServices'

const FY_OPTIONS = getFinancialYears()

// Flat list of service names grouped for the <select>
function ServiceSelect({ value, onChange }) {
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">— Select Service —</option>
      {CA_SERVICES.map(cat => (
        <optgroup key={cat.category} label={cat.category}>
          {cat.services.map(svc => (
            <option key={svc.name} value={svc.name}>{svc.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

function AddEnrollmentForm({ firmId, clientId, existing, onSaved }) {
  const [serviceName, setServiceName] = useState('')
  const [fy, setFy]                   = useState('')          // blank = no FY
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  async function save() {
    if (!serviceName) { setError('Please select a service'); return }
    // Prevent duplicate enrollment for same service+FY combo
    const dup = existing.some(e => e.service_name === serviceName && (e.financial_year ?? '') === fy)
    if (dup) { setError(`${serviceName}${fy ? ` for ${fy}` : ''} is already enrolled`); return }

    setSaving(true); setError('')
    const { error: err } = await supabase.from('client_services').insert({
      firm_id: firmId,
      client_id: clientId,
      service_name: serviceName,
      financial_year: fy || null,
      notes,
    })
    if (err) { setError(err.message); setSaving(false); return }
    setServiceName(''); setFy(''); setNotes(''); setSaving(false)
    onSaved()
  }

  return (
    <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 16, marginBottom: 20, border: '1px solid var(--gray-200)' }}>
      <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Enroll New Service</div>
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="form-group">
        <label>Service *</label>
        <ServiceSelect value={serviceName} onChange={setServiceName} />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label>Financial Year <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
          <select className="input" value={fy} onChange={e => setFy(e.target.value)}>
            <option value="">— Not specified —</option>
            {FY_OPTIONS.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Notes (optional)</label>
          <input
            className="input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Opted for full-service package"
          />
        </div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !serviceName}>
        {saving ? 'Enrolling…' : '+ Enroll Service'}
      </button>
    </div>
  )
}

function EnrollmentRow({ enrollment, onUpdated, onDeleted }) {
  const [editing, setEditing]   = useState(false)
  const [fy, setFy]             = useState(enrollment.financial_year ?? '')
  const [notes, setNotes]       = useState(enrollment.notes ?? '')
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('client_services').update({
      financial_year: fy || null,
      notes,
    }).eq('id', enrollment.id)
    setSaving(false); setEditing(false); onUpdated()
  }

  async function del() {
    if (!confirm(`Remove ${enrollment.service_name}?`)) return
    setDeleting(true)
    await supabase.from('client_services').delete().eq('id', enrollment.id)
    onDeleted()
  }

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  }

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
      {editing ? (
        <div>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10 }}>{enrollment.service_name}</div>
          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div className="form-group">
              <label>Financial Year</label>
              <select className="input" value={fy} onChange={e => setFy(e.target.value)}>
                <option value="">— Not specified —</option>
                {FY_OPTIONS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFy(enrollment.financial_year ?? ''); setNotes(enrollment.notes ?? ''); setEditing(false) }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{enrollment.service_name}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              {enrollment.financial_year ? (
                <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                  {enrollment.financial_year}
                </span>
              ) : (
                <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>No FY set</span>
              )}
              {notes && <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>{notes}</span>}
              <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>Enrolled: {fmtDate(enrollment.created_at)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={del} disabled={deleting}>
              {deleting ? '…' : '✕'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ClientServicesModal({ client, firmId, onClose }) {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('client_services')
      .select('*')
      .eq('client_id', client.id)
      .eq('firm_id', firmId)
      .order('financial_year', { ascending: false })
      .order('service_name')
    setEnrollments(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [client.id])

  // Group enrollments by FY for display
  const byFY = enrollments.reduce((acc, e) => {
    const fy = e.financial_year ?? 'No FY'
    ;(acc[fy] = acc[fy] ?? []).push(e)
    return acc
  }, {})

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div>
            <h3>Services — {client.name}</h3>
            <div className="text-muted text-sm">
              {client.pan ? `PAN: ${client.pan}` : client.email ?? ''}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <AddEnrollmentForm
            firmId={firmId}
            clientId={client.id}
            existing={enrollments}
            onSaved={load}
          />

          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: 'var(--gray-700)' }}>
            Enrolled Services ({enrollments.length})
          </div>

          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : enrollments.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="icon">📋</div>
              <p>No services enrolled yet. Use the form above to add services this client has opted for.</p>
            </div>
          ) : (
            Object.entries(byFY).map(([fy, list]) => (
              <div key={fy} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--gray-500)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: 4, paddingBottom: 4,
                  borderBottom: '2px solid var(--gray-200)',
                }}>
                  {fy}
                </div>
                {list.map(e => (
                  <EnrollmentRow key={e.id} enrollment={e} onUpdated={load} onDeleted={load} />
                ))}
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>
            💡 Go to Documents tab to request documents for each service
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
