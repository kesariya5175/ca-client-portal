import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const DOC_CATEGORIES = ['ITR Documents', 'GST Documents', 'Audit Documents', 'TDS Documents', 'Company Documents', 'Other']

function RequestModal({ firmId, clients, onClose, onSaved }) {
  const [form, setForm] = useState({ client_id: clients[0]?.id ?? '', title: '', category: 'ITR Documents', due_date: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.client_id || !form.title.trim()) { setError('Client and title are required'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('doc_requests').insert({ ...form, firm_id: firmId, status: 'pending' })
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Request Documents from Client</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Client *</label>
            <select className="input" value={form.client_id} onChange={e => set('client_id', e.target.value)}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Request Title *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Bank statements for FY 2025-26" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {DOC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date (optional)</label>
            <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Sending…' : 'Send Request'}</button>
        </div>
      </div>
    </div>
  )
}

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
      firm_id: request.firm_id,
      client_id: request.client_id,
      request_id: request.id,
      file_name: file.name,
      file_url: publicUrl,
      status: 'uploaded',
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

export default function DocumentsTab({ profile }) {
  const [requests, setRequests] = useState([])
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [modal, setModal]       = useState(null)     // 'request' | { upload: request }
  const isClient = profile.role === 'client'

  async function load() {
    setLoading(true)
    const [reqRes, cliRes] = await Promise.all([
      supabase.from('doc_requests')
        .select('*, clients(name), documents(id,file_name,file_url,status,created_at)')
        .eq('firm_id', profile.firm_id)
        .match(isClient ? { client_id: profile.client_id } : {})
        .order('created_at', { ascending: false }),
      isClient ? { data: [] } :
        supabase.from('clients').select('id,name').eq('firm_id', profile.firm_id).eq('status', 'active').order('name'),
    ])
    setRequests(reqRes.data ?? [])
    setClients(cliRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.firm_id])

  const filtered = requests.filter(r => filter === 'all' || r.status === filter)

  async function markReviewed(req) {
    await supabase.from('doc_requests').update({ status: 'reviewed' }).eq('id', req.id)
    load()
  }

  function statusBadge(s) {
    const map = { pending: 'badge-yellow', uploaded: 'badge-blue', reviewed: 'badge-green' }
    return map[s] ?? 'badge-gray'
  }

  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }

  return (
    <div className="page">
      {modal === 'request' && clients.length > 0 && (
        <RequestModal firmId={profile.firm_id} clients={clients} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
      )}
      {modal?.upload && (
        <UploadModal request={modal.upload} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
      )}

      <div className="page-header">
        <h2>Documents</h2>
        {!isClient && <button className="btn btn-primary" onClick={() => setModal('request')}>+ Request Document</button>}
      </div>

      <div className="card">
        <div className="tabs" style={{ marginBottom: 16 }}>
          {['all', 'pending', 'uploaded', 'reviewed'].map(f => (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading
          ? <p className="text-muted">Loading…</p>
          : filtered.length === 0
            ? <div className="empty-state"><div className="icon">📁</div><p>No document requests</p></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {!isClient && <th>Client</th>}
                      <th>Request</th>
                      <th>Category</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Files</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id}>
                        {!isClient && <td style={{ fontWeight: 500 }}>{r.clients?.name}</td>}
                        <td>{r.title}</td>
                        <td><span className="badge badge-gray">{r.category}</span></td>
                        <td>{fmtDate(r.due_date)}</td>
                        <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                        <td>
                          {(r.documents ?? []).map(d => (
                            <a key={d.id} href={d.file_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', color: 'var(--brand)', fontSize: 12 }}>
                              📎 {d.file_name}
                            </a>
                          ))}
                          {(r.documents ?? []).length === 0 && <span className="text-muted text-sm">No files</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {isClient && r.status === 'pending' && (
                              <button className="btn btn-primary btn-sm" onClick={() => setModal({ upload: r })}>Upload</button>
                            )}
                            {!isClient && r.status === 'uploaded' && (
                              <button className="btn btn-ghost btn-sm" onClick={() => markReviewed(r)}>Mark Reviewed</button>
                            )}
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
