// DocumentsTab — redesigned with new flow:
// CA: Select Client → Select Service → Checklist → Send Request + Reminder settings
// Client: View & upload their requested documents
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { emailDocumentRequest, emailDocumentReminder } from '../emailService'
import { getServiceDocuments, getFinancialYears } from '../caServices'

const FY_OPTIONS = getFinancialYears()

// ── Upload modal (client view) ─────────────────────────────────
function UploadModal({ request, onClose, onSaved }) {
  const [file, setFile]     = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function upload() {
    if (!file) { setError('Please select a file'); return }
    setSaving(true); setError('')
    const ext = file.name.split('.').pop()
    const path = `${request.firm_id}/${request.client_id}/${request.id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file)
    if (uploadErr) { setError(uploadErr.message); setSaving(false); return }
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)
    const { error: dbErr } = await supabase.from('documents').insert({
      firm_id: request.firm_id, client_id: request.client_id,
      request_id: request.id, file_name: file.name, file_url: publicUrl, status: 'uploaded',
    })
    if (dbErr) { setError(dbErr.message); setSaving(false); return }
    await supabase.from('doc_requests').update({ status: 'uploaded' }).eq('id', request.id)
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Upload Document</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <p style={{ marginBottom: 14, color: 'var(--gray-600)', fontSize: 13 }}>
            Uploading for: <strong>{request.title}</strong>
            {request.service_name && <span style={{ color: 'var(--gray-400)' }}> · {request.service_name} · {request.financial_year}</span>}
          </p>
          <div className="form-group">
            <label>Select File (PDF, JPG, PNG — max 10 MB)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])}
              style={{ display: 'block', marginTop: 6, fontSize: 13 }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={upload} disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Document Request Modal (CA: selects checklist items) ───────
function DocRequestModal({ firmId, client, service, onClose, onSaved }) {
  const [standardDocs, setStandardDocs] = useState([])
  const [customDocs, setCustomDocs]     = useState([])
  const [selected, setSelected]         = useState(new Set())
  const [dueDate, setDueDate]           = useState('')
  const [autoReminder, setAutoReminder] = useState(false)
  const [reminderDays, setReminderDays] = useState(3)
  const [newDoc, setNewDoc]             = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [createdLinks, setCreatedLinks] = useState(null)  // null = not sent yet
  const [firmNameSent, setFirmNameSent] = useState('')

  useEffect(() => {
    const std = getServiceDocuments(service.service_name)
    setStandardDocs(std)
    // Pre-select all standard docs
    setSelected(new Set(std))

    // Load firm custom docs for this service
    supabase.from('firm_custom_documents')
      .select('*')
      .eq('firm_id', firmId)
      .eq('service_name', service.service_name)
      .order('created_at')
      .then(({ data }) => setCustomDocs((data ?? []).map(d => d.document_name)))
  }, [firmId, service.service_name])

  function toggle(doc) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(doc) ? next.delete(doc) : next.add(doc)
      return next
    })
  }

  async function addCustomDoc() {
    const name = newDoc.trim()
    if (!name) return
    // Save to firm_custom_documents so it persists for future requests
    await supabase.from('firm_custom_documents').insert({
      firm_id: firmId,
      service_name: service.service_name,
      document_name: name,
    })
    setCustomDocs(prev => [...prev, name])
    setSelected(prev => new Set([...prev, name]))
    setNewDoc('')
  }

  async function sendRequests() {
    if (selected.size === 0) { setError('Select at least one document'); return }
    setSaving(true); setError('')

    // Load firm name for email
    const { data: firm } = await supabase.from('firms').select('name').eq('id', firmId).single()
    const firmName = firm?.name ?? 'Your CA Firm'

    // Create one doc_request per selected document
    const rows = [...selected].map(doc => ({
      firm_id: firmId,
      client_id: client.id,
      title: doc,
      category: service.service_name,
      service_name: service.service_name,
      financial_year: service.financial_year,
      due_date: dueDate || null,
      status: 'pending',
      auto_reminder: autoReminder,
      reminder_days: autoReminder ? reminderDays : 0,
    }))

    const { data: inserted, error: err } = await supabase
      .from('doc_requests').insert(rows).select('id,title')
    if (err) { setError(err.message); setSaving(false); return }

    // Build per-document upload links using the request ID
    const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://ca-client-portal-yr7e.vercel.app'
    const docLinks = (inserted ?? []).map(r => ({
      title: r.title,
      uploadUrl: `${APP_URL}/?upload=${r.id}`,
    }))

    // Send email with individual links
    if (client.email) {
      emailDocumentRequest({
        clientEmail: client.email,
        clientName: client.name,
        firmName,
        serviceName: service.service_name,
        financialYear: service.financial_year,
        documents: docLinks,
      }).catch(() => {})
    }

    setCreatedLinks(docLinks)
    setFirmNameSent(firmName)
    setSaving(false)
  }

  const allDocs = [...standardDocs, ...customDocs]

  // ── WhatsApp helper ─────────────────────────────────────────
  function openWhatsApp(links) {
    if (!client.phone) return
    const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://ca-client-portal-yr7e.vercel.app'
    const phone = client.phone.replace(/\D/g, '')
    const waPhone = phone.startsWith('91') ? phone : `91${phone}`
    const docLines = links.map((d, i) =>
      `${i + 1}. ${d.title}\n   📎 ${d.uploadUrl}`
    ).join('\n\n')
    const msg = `Hello ${client.name},\n\n${firmNameSent} has requested the following document(s)${service.service_name ? ` for *${service.service_name}*${service.financial_year ? ` (${service.financial_year})` : ''}` : ''}:\n\n${docLines}\n\n👆 Click each link to upload the document directly — *no login required*.\n\nThank you,\n${firmNameSent}`
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ── Success state after sending ─────────────────────────────
  if (createdLinks) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 560 }}>
          <div className="modal-header">
            <h3>✅ Requests Sent!</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => { onSaved() }}>✕</button>
          </div>
          <div className="modal-body">
            <p style={{ marginBottom: 16, color: 'var(--gray-600)', fontSize: 13 }}>
              {createdLinks.length} document request{createdLinks.length > 1 ? 's' : ''} created for <strong>{client.name}</strong>.
              {client.email ? ' Email has been sent.' : ' No email on file — share the links below manually.'}
            </p>

            {/* Notify via WhatsApp */}
            {client.phone && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Notify via WhatsApp</div>
                <button
                  className="btn btn-whatsapp"
                  onClick={() => openWhatsApp(createdLinks)}
                  style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
                >
                  📱 Send on WhatsApp ({client.phone})
                </button>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                  Opens WhatsApp with a pre-filled message containing all upload links.
                </div>
              </div>
            )}
            {!client.phone && (
              <div className="alert" style={{ background: '#fef3c7', color: '#92400e', marginBottom: 16 }}>
                No phone number on file for this client — add it in the client profile to enable WhatsApp.
              </div>
            )}

            {/* Document links */}
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Upload Links (share manually if needed)</div>
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: 8, overflow: 'hidden' }}>
              {createdLinks.map((d, i) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  borderBottom: i < createdLinks.length - 1 ? '1px solid var(--gray-100)' : 'none',
                }}>
                  <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{d.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                      {d.uploadUrl}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigator.clipboard?.writeText(d.uploadUrl)}
                      style={{ flexShrink: 0 }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={() => { onSaved() }}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div>
            <h3>Request Documents</h3>
            <div className="text-muted text-sm">
              {client.name} · {service.service_name} · {service.financial_year}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

          {/* Document checklist */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                Document Checklist
                <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>
                  ({selected.size} of {allDocs.length} selected)
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set(allDocs))}>All</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>None</button>
              </div>
            </div>

            {/* Standard documents */}
            {standardDocs.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Standard Documents
                </div>
                {standardDocs.map((doc, i) => (
                  <label key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: '1px solid var(--gray-100)', cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={selected.has(doc)}
                      onChange={() => toggle(doc)}
                      style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13 }}>{doc}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Custom documents */}
            {customDocs.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Custom Documents
                </div>
                {customDocs.map((doc, i) => (
                  <label key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: '1px solid var(--gray-100)', cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={selected.has(doc)}
                      onChange={() => toggle(doc)}
                      style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13 }}>{doc}</span>
                    <span style={{ fontSize: 10, color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '1px 6px', borderRadius: 3 }}>custom</span>
                  </label>
                ))}
              </div>
            )}

            {/* Add custom document */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                className="input"
                value={newDoc}
                onChange={e => setNewDoc(e.target.value)}
                placeholder="Add document not in list…"
                onKeyDown={e => e.key === 'Enter' && addCustomDoc()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-ghost btn-sm" onClick={addCustomDoc} disabled={!newDoc.trim()}>
                + Add
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
              Added documents are saved to your firm's list for future use.
            </div>
          </div>

          {/* Settings */}
          <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 16 }}>
            <div className="grid-2">
              <div className="form-group">
                <label>Due Date (optional)</label>
                <input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>

            {/* Reminder settings */}
            <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: 14, border: '1px solid var(--gray-200)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>⏰ Reminder Settings</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: autoReminder ? 10 : 0 }}>
                <input
                  type="checkbox"
                  checked={autoReminder}
                  onChange={e => setAutoReminder(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>Auto-remind client if document is still pending</span>
              </label>
              {autoReminder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 26 }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Send reminder every</span>
                  <select
                    className="input"
                    value={reminderDays}
                    onChange={e => setReminderDays(Number(e.target.value))}
                    style={{ width: 80 }}
                  >
                    {[1, 2, 3, 5, 7, 10, 14, 30].map(d => (
                      <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>until document is received</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={sendRequests} disabled={saving || selected.size === 0}>
            {saving ? 'Sending…' : `Send ${selected.size} Request${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Reminder settings editor for existing request ──────────────
function ReminderEditor({ request, onSaved }) {
  const [open, setOpen]             = useState(false)
  const [autoReminder, setAuto]     = useState(request.auto_reminder ?? false)
  const [reminderDays, setDays]     = useState(request.reminder_days ?? 3)
  const [saving, setSaving]         = useState(false)
  const [sending, setSending]       = useState(false)

  async function saveSettings() {
    setSaving(true)
    await supabase.from('doc_requests').update({
      auto_reminder: autoReminder,
      reminder_days: autoReminder ? reminderDays : 0,
    }).eq('id', request.id)
    setSaving(false); setOpen(false); onSaved()
  }

  async function sendNow() {
    setSending(true)
    const { data: client } = await supabase.from('clients').select('name,email').eq('id', request.client_id).single()
    const { data: firm }   = await supabase.from('firms').select('name').eq('id', request.firm_id).single()
    if (client?.email) {
      await emailDocumentReminder({
        clientEmail: client.email,
        clientName: client.name,
        documentName: request.title,
        serviceName: request.service_name,
        financialYear: request.financial_year,
        firmName: firm?.name ?? 'Your CA Firm',
      }).catch(() => {})
      await supabase.from('doc_requests').update({ last_reminder_sent: new Date().toISOString() }).eq('id', request.id)
      onSaved()
    }
    setSending(false)
  }

  if (!open) {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={sendNow}
          disabled={sending}
          title="Send manual reminder to client"
        >
          {sending ? '…' : '📧 Remind'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen(true)}
          title="Reminder settings"
          style={{ color: request.auto_reminder ? 'var(--brand)' : undefined }}
        >
          {request.auto_reminder ? `⏰ ${request.reminder_days}d` : '⏰'}
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'absolute', right: 0, top: 32, zIndex: 20,
      background: '#fff', border: '1px solid var(--gray-200)',
      borderRadius: 8, padding: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      minWidth: 260,
    }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Reminder Settings</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
        <input type="checkbox" checked={autoReminder} onChange={e => setAuto(e.target.checked)} style={{ width: 15, height: 15 }} />
        <span style={{ fontSize: 13 }}>Auto-remind client</span>
      </label>
      {autoReminder && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginLeft: 23 }}>
          <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Every</span>
          <select className="input" value={reminderDays} onChange={e => setDays(Number(e.target.value))} style={{ width: 70 }}>
            {[1, 2, 3, 5, 7, 10, 14, 30].map(d => <option key={d} value={d}>{d}d</option>)}
          </select>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary btn-sm" onClick={saveSettings} disabled={saving}>{saving ? '…' : 'Save'}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  )
}

// ── Main DocumentsTab ──────────────────────────────────────────
export default function DocumentsTab({ profile, onViewClient }) {
  const isClient = profile.role === 'client'
  const [clients, setClients]           = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [enrollments, setEnrollments]   = useState([])
  const [requests, setRequests]         = useState([])
  const [loading, setLoading]           = useState(false)
  const [filter, setFilter]             = useState('all')
  const [modal, setModal]               = useState(null) // { type: 'request', service } | { type: 'upload', request }

  // ── Load clients on mount (CA only)
  useEffect(() => {
    if (!isClient) {
      supabase.from('clients').select('id,name,email,pan')
        .eq('firm_id', profile.firm_id).eq('status', 'active').order('name')
        .then(({ data }) => setClients(data ?? []))
    }
  }, [profile.firm_id, isClient])

  // ── Load enrollments when client selected
  useEffect(() => {
    if (!selectedClient) { setEnrollments([]); return }
    supabase.from('client_services').select('*')
      .eq('firm_id', profile.firm_id)
      .eq('client_id', selectedClient.id)
      .order('financial_year', { ascending: false })
      .order('service_name')
      .then(({ data }) => setEnrollments(data ?? []))
  }, [selectedClient, profile.firm_id])

  // ── Load document requests
  const loadRequests = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('doc_requests')
      .select('*, clients(name,email), documents(id,file_name,file_url,status,created_at)')
      .eq('firm_id', profile.firm_id)
      .order('created_at', { ascending: false })
    if (isClient) q = q.eq('client_id', profile.client_id)
    if (!isClient && selectedClient) q = q.eq('client_id', selectedClient.id)
    const { data } = await q
    setRequests(data ?? [])
    setLoading(false)

    // Check auto-reminders (CA only) — send if overdue
    if (!isClient && data) {
      const now = new Date()
      for (const req of data) {
        if (req.status !== 'pending') continue
        if (!req.auto_reminder || !req.reminder_days) continue
        const lastSent = req.last_reminder_sent ? new Date(req.last_reminder_sent) : new Date(req.created_at)
        const daysSince = (now - lastSent) / 86400000
        if (daysSince >= req.reminder_days && req.clients?.email) {
          const { data: firm } = await supabase.from('firms').select('name').eq('id', profile.firm_id).single()
          emailDocumentReminder({
            clientEmail: req.clients.email,
            clientName: req.clients.name,
            documentName: req.title,
            serviceName: req.service_name,
            financialYear: req.financial_year,
            firmName: firm?.name ?? 'Your CA Firm',
          }).catch(() => {})
          supabase.from('doc_requests').update({ last_reminder_sent: now.toISOString() }).eq('id', req.id).then(() => {})
        }
      }
    }
  }, [profile.firm_id, isClient, profile.client_id, selectedClient])

  useEffect(() => { loadRequests() }, [loadRequests])

  async function markReviewed(req) {
    await supabase.from('doc_requests').update({ status: 'reviewed' }).eq('id', req.id)
    loadRequests()
  }

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)

  // Group filtered requests by service+FY for display
  const grouped = filtered.reduce((acc, r) => {
    const key = r.service_name ? `${r.service_name} · ${r.financial_year ?? ''}` : 'Other'
    ;(acc[key] = acc[key] ?? []).push(r)
    return acc
  }, {})

  function statusBadge(s) {
    const map = { pending: 'badge-yellow', uploaded: 'badge-blue', reviewed: 'badge-green' }
    return map[s] ?? 'badge-gray'
  }

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  }

  // ─────────────────────────────────────────────────────────────
  // CLIENT VIEW
  // ─────────────────────────────────────────────────────────────
  if (isClient) {
    return (
      <div className="page">
        {modal?.type === 'upload' && (
          <UploadModal request={modal.request} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadRequests() }} />
        )}
        <div className="page-header"><h2>My Documents</h2></div>
        <div className="card">
          <div className="tabs" style={{ marginBottom: 16 }}>
            {['all', 'pending', 'uploaded', 'reviewed'].map(f => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">📁</div><p>No document requests</p></div>
          ) : (
            Object.entries(grouped).map(([group, reqs]) => (
              <div key={group} style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand)', marginBottom: 8, paddingBottom: 6, borderBottom: '2px solid var(--gray-200)' }}>
                  {group}
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Document</th><th>Due Date</th><th>Status</th><th>Files</th><th></th></tr>
                    </thead>
                    <tbody>
                      {reqs.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 500 }}>{r.title}</td>
                          <td>{fmtDate(r.due_date)}</td>
                          <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                          <td>
                            {(r.documents ?? []).map(d => (
                              <a key={d.id} href={d.file_url} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'block', color: 'var(--brand)', fontSize: 12 }}>📎 {d.file_name}</a>
                            ))}
                            {(r.documents ?? []).length === 0 && <span className="text-muted text-sm">No files</span>}
                          </td>
                          <td>
                            {r.status === 'pending' && (
                              <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'upload', request: r })}>Upload</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // CA / STAFF VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {modal?.type === 'request' && (
        <DocRequestModal
          firmId={profile.firm_id}
          client={selectedClient}
          service={modal.service}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadRequests() }}
        />
      )}
      {modal?.type === 'upload' && (
        <UploadModal request={modal.request} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadRequests() }} />
      )}

      <div className="page-header"><h2>Documents</h2></div>

      {/* Step 1 — Select Client */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: 'var(--gray-700)' }}>
          Step 1 — Select Client
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="input"
            value={selectedClient?.id ?? ''}
            onChange={e => {
              const c = clients.find(c => c.id === e.target.value) ?? null
              setSelectedClient(c)
              setFilter('all')
            }}
            style={{ maxWidth: 300 }}
          >
            <option value="">— Select Client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedClient && (
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {selectedClient.pan ? `PAN: ${selectedClient.pan}` : selectedClient.email ?? ''}
            </span>
          )}
        </div>
      </div>

      {/* Step 2 — Select Service & Request Documents */}
      {selectedClient && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: 'var(--gray-700)' }}>
            Step 2 — Request Documents by Service
          </div>
          {enrollments.length === 0 ? (
            <div style={{ color: 'var(--gray-500)', fontSize: 13, padding: '8px 0' }}>
              No services enrolled for this client. Go to <strong>Clients → Services</strong> to enroll services first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {enrollments.map(svc => (
                <button
                  key={svc.id}
                  className="btn btn-ghost"
                  onClick={() => setModal({ type: 'request', service: svc })}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 14px', textAlign: 'left' }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{svc.service_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                    {svc.financial_year} · Click to request docs
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests list */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-700)' }}>
            {selectedClient ? `Document Requests — ${selectedClient.name}` : 'All Document Requests'}
          </div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['all', 'pending', 'uploaded', 'reviewed'].map(f => (
              <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span style={{ marginLeft: 4, fontSize: 10, background: 'var(--gray-200)', borderRadius: 99, padding: '1px 5px' }}>
                    {requests.filter(r => r.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📁</div>
            <p>{selectedClient ? 'No document requests for this client' : 'Select a client above to view their document requests'}</p>
          </div>
        ) : (
          Object.entries(grouped).map(([group, reqs]) => (
            <div key={group} style={{ marginBottom: 24 }}>
              <div style={{
                fontWeight: 700, fontSize: 12, color: 'var(--brand)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                marginBottom: 8, paddingBottom: 6, borderBottom: '2px solid var(--gray-200)',
              }}>
                {group}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {!selectedClient && <th>Client</th>}
                      <th>Document</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Files</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reqs.map(r => (
                      <tr key={r.id}>
                        {!selectedClient && (
                        <td>
                          <button onClick={() => onViewClient?.(r.client_id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 500, color: 'var(--brand)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                            {r.clients?.name}
                          </button>
                        </td>
                      )}
                        <td style={{ fontWeight: 500 }}>{r.title}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.due_date)}</td>
                        <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                        <td>
                          {(r.documents ?? []).map(d => (
                            <a key={d.id} href={d.file_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', color: 'var(--brand)', fontSize: 12 }}>📎 {d.file_name}</a>
                          ))}
                          {(r.documents ?? []).length === 0 && <span className="text-muted text-sm">No files</span>}
                        </td>
                        <td style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {r.status === 'uploaded' && (
                              <button className="btn btn-ghost btn-sm" onClick={() => markReviewed(r)}>✓ Reviewed</button>
                            )}
                            {r.status === 'pending' && (
                              <ReminderEditor request={r} onSaved={loadRequests} />
                            )}
                            {r.last_reminder_sent && r.status === 'pending' && (
                              <span style={{ fontSize: 10, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                                Last reminded: {fmtDate(r.last_reminder_sent)}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
