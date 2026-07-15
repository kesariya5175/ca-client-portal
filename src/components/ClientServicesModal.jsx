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
  const [fy, setFy]                   = useState(FY_OPTIONS[0])
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  async function save() {
    if (!serviceName) { setError('Please select a service'); return }
    // Prevent duplicate enrollment for same service+FY
    const dup = existing.some(e => e.service_name === serviceName && e.financial_year === fy)
    if (dup) { setError(`${serviceName} for ${fy} is already enrolled`); return }

    setSaving(true); setError('')
    const { error: err } = await supabase.from('client_services').insert({
      firm_id: firmId,
      client_id: clientId,
      service_name: serviceName,
      financial_year: fy,
      notes,
    })
    if (err) { setError(err.message); setSaving(false); return }
    setServiceName(''); setNotes(''); setSaving(false)
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
          <label>Financial Year</label>
          <select className="input" value={fy} onChange={e => setFy(e.target.value)}>
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

function EnrollmentRow({ enrollment, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  async function del() {
    if (!confirm(`Remove ${enrollment.service_name} (${enrollment.financial_year})?`)) return
    setDeleting(true)
    await supabase.from('client_services').delete().eq('id', enrollment.id)
    onDeleted()
  }

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--gray-100)', gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{enrollment.service_name}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{
            background: '#eff6ff', color: '#1e40af',
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          }}>
            {enrollment.financial_year}
          </span>
          {enrollment.notes && (
            <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>{enrollment.notes}</span>
          )}
          <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>
            Enrolled: {fmtDate(enrollment.created_at)}
          </span>
        </div>
      </div>
      <button
        className="btn btn-ghost btn-sm"
        style={{ color: 'var(--danger)', flexShrink: 0 }}
        onClick={del}
        disabled={deleting}
      >
        {deleting ? '…' : '✕ Remove'}
      </button>
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
                  <EnrollmentRow key={e.id} enrollment={e} onDeleted={load} />
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
