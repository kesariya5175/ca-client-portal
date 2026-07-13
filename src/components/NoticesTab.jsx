import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function NoticeModal({ firmId, notice, onClose, onSaved }) {
  const isEdit = !!notice
  const [form, setForm] = useState({ title: notice?.title ?? '', body: notice?.body ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function save() {
    if (!form.title.trim() || !form.body.trim()) { setError('Title and message are required'); return }
    setSaving(true); setError('')
    const payload = { ...form, firm_id: firmId }
    const { error: err } = isEdit
      ? await supabase.from('notices').update(payload).eq('id', notice.id)
      : await supabase.from('notices').insert(payload)
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Notice' : 'Post Notice'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. ITR Deadline Reminder — 31 July 2026" />
          </div>
          <div className="form-group">
            <label>Message *</label>
            <textarea className="input" rows={5} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Dear clients, please note that the last date for filing ITR is 31st July 2026. Kindly submit all documents by 15th July…"
              style={{ resize: 'vertical' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>This notice will be visible to ALL clients in your portal.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Posting…' : 'Post Notice'}</button>
        </div>
      </div>
    </div>
  )
}

export default function NoticesTab({ profile }) {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const isClient = profile.role === 'client'

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('notices')
      .select('*')
      .eq('firm_id', profile.firm_id)
      .order('created_at', { ascending: false })
    setNotices(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.firm_id])

  async function deleteNotice(id) {
    if (!confirm('Delete this notice?')) return
    await supabase.from('notices').delete().eq('id', id)
    load()
  }

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
  }

  return (
    <div className="page">
      {modal && (
        <NoticeModal
          firmId={profile.firm_id}
          notice={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}

      <div className="page-header">
        <h2>Notices</h2>
        {!isClient && <button className="btn btn-primary" onClick={() => setModal('add')}>+ Post Notice</button>}
      </div>

      {loading
        ? <div className="page"><p className="text-muted">Loading…</p></div>
        : notices.length === 0
          ? <div className="card"><div className="empty-state"><div className="icon">📢</div><p>No notices posted yet</p></div></div>
          : notices.map(n => (
              <div key={n.id} className="card" style={{ marginBottom: 14 }}>
                <div className="flex items-center justify-between mb-4" style={{ marginBottom: 10 }}>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 15 }}>{n.title}</h3>
                    <div className="text-muted text-sm" style={{ marginTop: 3 }}>Posted {fmtDate(n.created_at)}</div>
                  </div>
                  {!isClient && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(n)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteNotice(n.id)}>Delete</button>
                    </div>
                  )}
                </div>
                <p style={{ color: 'var(--gray-700)', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{n.body}</p>
              </div>
            ))
      }
    </div>
  )
}
