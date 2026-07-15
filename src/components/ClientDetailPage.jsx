// Full client detail page — opened when CA clicks a client name
// Shows: Overview, Services, Documents, Tasks, Invoices
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ClientServicesModal from './ClientServicesModal'
import { getFinancialYears } from '../caServices'

const FY_OPTIONS = getFinancialYears()

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}
function fmtAmt(a) { return '₹' + Number(a).toLocaleString('en-IN') }

// ── Overview tab ───────────────────────────────────────────────
function OverviewTab({ client, firmId, onEdit }) {
  const [stats, setStats] = useState({ tasks: 0, pendingDocs: 0, unpaidAmt: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('client_id', client.id).neq('status', 'done'),
      supabase.from('doc_requests').select('id', { count: 'exact', head: true }).eq('client_id', client.id).eq('status', 'pending'),
      supabase.from('invoices').select('amount').eq('client_id', client.id).eq('paid', false),
    ]).then(([t, d, inv]) => {
      const unpaid = (inv.data ?? []).reduce((s, i) => s + Number(i.amount), 0)
      setStats({ tasks: t.count ?? 0, pendingDocs: d.count ?? 0, unpaidAmt: unpaid })
    })
  }, [client.id])

  const fields = [
    { label: 'Type',   value: client.type },
    { label: 'PAN',    value: client.pan,    mono: true },
    { label: 'GST',    value: client.gst,    mono: true },
    { label: 'Aadhar', value: client.aadhar ? `XXXX-XXXX-${client.aadhar}` : null },
    { label: 'Email',  value: client.email },
    { label: 'Phone',  value: client.phone },
    { label: 'Status', value: client.status },
  ]

  return (
    <div>
      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderLeft: '3px solid #f59e0b' }}>
          <div className="stat-value" style={{ color: '#d97706' }}>{stats.pendingDocs}</div>
          <div className="stat-label">Docs Pending</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #3b82f6' }}>
          <div className="stat-value" style={{ color: '#1d4ed8' }}>{stats.tasks}</div>
          <div className="stat-label">Open Tasks</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #ef4444' }}>
          <div className="stat-value" style={{ color: '#dc2626', fontSize: 18 }}>{fmtAmt(stats.unpaidAmt)}</div>
          <div className="stat-label">Unpaid Amount</div>
        </div>
      </div>

      {/* Profile fields */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 600, fontSize: 14 }}>Client Profile</h3>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏ Edit</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 24px' }}>
          {fields.map(f => f.value ? (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 14, fontFamily: f.mono ? 'monospace' : undefined, color: f.label === 'Status' && client.status === 'active' ? '#16a34a' : undefined }}>
                {f.value}
              </div>
            </div>
          ) : null)}
        </div>
        {client.notes && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Internal Notes</div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{client.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Services tab ───────────────────────────────────────────────
function ServicesTab({ client, firmId }) {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('client_services')
      .select('*').eq('client_id', client.id).eq('firm_id', firmId)
      .order('financial_year', { ascending: false }).order('service_name')
    setEnrollments(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [client.id])

  const byFY = enrollments.reduce((acc, e) => {
    const fy = e.financial_year ?? 'No FY'
    ;(acc[fy] = acc[fy] ?? []).push(e)
    return acc
  }, {})

  return (
    <div>
      {showModal && (
        <ClientServicesModal client={client} firmId={firmId} onClose={() => { setShowModal(false); load() }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Enroll Service</button>
      </div>

      {loading ? <p className="text-muted">Loading…</p>
        : enrollments.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="icon">📋</div><p>No services enrolled yet.</p></div></div>
        ) : (
          Object.entries(byFY).map(([fy, list]) => (
            <div key={fy} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingBottom: 6, borderBottom: '2px solid var(--gray-200)' }}>
                {fy}
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {list.map((e, i) => (
                  <div key={e.id} style={{ padding: '12px 16px', borderBottom: i < list.length - 1 ? '1px solid var(--gray-100)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{e.service_name}</div>
                    {e.notes && <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{e.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))
        )
      }
    </div>
  )
}

// ── Documents tab ──────────────────────────────────────────────
function DocumentsTab({ client, firmId }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    setLoading(true)
    supabase.from('doc_requests')
      .select('*, documents(id,file_name,file_url)')
      .eq('client_id', client.id).eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setRequests(data ?? []); setLoading(false) })
  }, [client.id])

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)
  const grouped  = filtered.reduce((acc, r) => {
    const key = r.service_name ? `${r.service_name}${r.financial_year ? ` · ${r.financial_year}` : ''}` : 'Other'
    ;(acc[key] = acc[key] ?? []).push(r)
    return acc
  }, {})

  const statusBadge = s => ({ pending: 'badge-yellow', uploaded: 'badge-blue', reviewed: 'badge-green' })[s] ?? 'badge-gray'

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 16 }}>
        {['all', 'pending', 'uploaded', 'reviewed'].map(f => (
          <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span style={{ marginLeft: 4, fontSize: 10, background: 'var(--gray-200)', borderRadius: 99, padding: '1px 5px' }}>{requests.filter(r => r.status === f).length}</span>}
          </button>
        ))}
      </div>
      {loading ? <p className="text-muted">Loading…</p>
        : filtered.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="icon">📁</div><p>No document requests</p></div></div>
        ) : (
          Object.entries(grouped).map(([group, reqs]) => (
            <div key={group} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, paddingBottom: 6, borderBottom: '2px solid var(--gray-200)' }}>
                {group}
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>DOCUMENT</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>DUE</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>STATUS</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>FILES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reqs.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: i < reqs.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 500, fontSize: 13 }}>{r.title}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-500)' }}>{fmtDate(r.due_date)}</td>
                        <td style={{ padding: '10px 14px' }}><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                        <td style={{ padding: '10px 14px' }}>
                          {(r.documents ?? []).map(d => (
                            <a key={d.id} href={d.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: 'var(--brand)', fontSize: 12 }}>📎 {d.file_name}</a>
                          ))}
                          {!(r.documents ?? []).length && <span className="text-muted text-sm">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )
      }
    </div>
  )
}

// ── Tasks tab ──────────────────────────────────────────────────
function TasksTab({ client, firmId }) {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.from('tasks')
      .select('*, users(name)')
      .eq('client_id', client.id).eq('firm_id', firmId)
      .order('due_date', { ascending: true })
      .then(({ data }) => { setTasks(data ?? []); setLoading(false) })
  }, [client.id])

  const priorityColor = p => ({ High: '#dc2626', Medium: '#d97706', Low: '#6b7280' })[p] ?? '#6b7280'
  const statusBadge   = s => ({ pending: 'badge-yellow', in_progress: 'badge-blue', done: 'badge-green' })[s] ?? 'badge-gray'

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {loading ? <p className="text-muted" style={{ padding: 16 }}>Loading…</p>
        : tasks.length === 0 ? (
          <div className="empty-state"><div className="icon">✅</div><p>No tasks for this client</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['TASK', 'ASSIGNED TO', 'DUE DATE', 'PRIORITY', 'STATUS'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={t.id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500, fontSize: 13 }}>{t.title}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--gray-500)' }}>{t.users?.name ?? '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-500)' }}>{fmtDate(t.due_date)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: priorityColor(t.priority) }}>{t.priority}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}><span className={`badge ${statusBadge(t.status)}`}>{t.status?.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  )
}

// ── Invoices tab ───────────────────────────────────────────────
function InvoicesTab({ client, firmId }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.from('invoices')
      .select('*').eq('client_id', client.id).eq('firm_id', firmId)
      .order('date', { ascending: false })
      .then(({ data }) => { setInvoices(data ?? []); setLoading(false) })
  }, [client.id])

  const total   = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const unpaid  = invoices.filter(i => !i.paid).reduce((s, i) => s + Number(i.amount), 0)

  return (
    <div>
      {invoices.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--brand)' }}>
            <div className="stat-value">{fmtAmt(total)}</div>
            <div className="stat-label">Total Billed</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #ef4444' }}>
            <div className="stat-value" style={{ color: '#dc2626' }}>{fmtAmt(unpaid)}</div>
            <div className="stat-label">Unpaid</div>
          </div>
        </div>
      )}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <p className="text-muted" style={{ padding: 16 }}>Loading…</p>
          : invoices.length === 0 ? (
            <div className="empty-state"><div className="icon">💰</div><p>No invoices for this client</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  {['DATE', 'DESCRIPTION', 'AMOUNT', 'STATUS'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{fmtDate(inv.date)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{inv.description}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{fmtAmt(inv.amount)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`badge ${inv.paid ? 'badge-green' : 'badge-red'}`}>{inv.paid ? 'Paid' : 'Unpaid'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}

// ── Edit modal (inline, reused from ClientsTab) ────────────────
const TYPES = ['Individual', 'Company', 'Partnership', 'LLP', 'HUF', 'Trust']

function EditClientModal({ client, firmId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: client.name ?? '', email: client.email ?? '', phone: client.phone ?? '',
    pan: client.pan ?? '', gst: client.gst ?? '', aadhar: client.aadhar ?? '',
    type: client.type ?? 'Individual', notes: client.notes ?? '', status: client.status ?? 'active',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('clients').update(form).eq('id', client.id)
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Edit Client — {client.name}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="grid-2">
            <div className="form-group"><label>Full Name *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label>Client Type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Email</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label>PAN</label><input className="input" value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase())} maxLength={10} /></div>
            <div className="form-group"><label>GST Number</label><input className="input" value={form.gst} onChange={e => set('gst', e.target.value.toUpperCase())} /></div>
            <div className="form-group"><label>Aadhar (last 4)</label><input className="input" value={form.aadhar} onChange={e => set('aadhar', e.target.value)} maxLength={4} /></div>
            <div className="form-group"><label>Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Internal Notes</label><textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ClientDetailPage ──────────────────────────────────────
export default function ClientDetailPage({ clientId, firmId, profile, onBack }) {
  const [client, setClient]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setTab]   = useState('overview')
  const [editModal, setEditModal] = useState(false)

  async function loadClient() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').eq('id', clientId).single()
    setClient(data)
    setLoading(false)
  }

  useEffect(() => { loadClient() }, [clientId])

  if (loading) return <div className="page"><p className="text-muted">Loading…</p></div>
  if (!client)  return <div className="page"><p className="text-muted">Client not found.</p><button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button></div>

  const TABS = [
    { key: 'overview',   label: 'Overview'  },
    { key: 'services',   label: 'Services'  },
    { key: 'documents',  label: 'Documents' },
    { key: 'tasks',      label: 'Tasks'     },
    { key: 'invoices',   label: 'Invoices'  },
  ]

  return (
    <div className="page">
      {editModal && (
        <EditClientModal
          client={client}
          firmId={firmId}
          onClose={() => setEditModal(false)}
          onSaved={() => { setEditModal(false); loadClient() }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          style={{ flexShrink: 0 }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
            }}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{client.name}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge badge-blue">{client.type}</span>
                <span className={`badge ${client.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{client.status}</span>
                {client.pan && <span style={{ fontSize: 12, color: 'var(--gray-500)', fontFamily: 'monospace' }}>PAN: {client.pan}</span>}
                {client.phone && <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>📞 {client.phone}</span>}
                {client.email && <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>✉ {client.email}</span>}
              </div>
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(true)}>✏ Edit</button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'  && <OverviewTab  client={client} firmId={firmId} onEdit={() => setEditModal(true)} />}
      {activeTab === 'services'  && <ServicesTab  client={client} firmId={firmId} />}
      {activeTab === 'documents' && <DocumentsTab client={client} firmId={firmId} />}
      {activeTab === 'tasks'     && <TasksTab     client={client} firmId={firmId} />}
      {activeTab === 'invoices'  && <InvoicesTab  client={client} firmId={firmId} />}
    </div>
  )
}
