// Public document upload page — no login required
// Accessed via: https://your-app.vercel.app/?upload=<doc_request_id>
// Client clicks link from email/WhatsApp, uploads document directly
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function PublicUploadPage({ requestId }) {
  const [request, setRequest] = useState(null)
  const [firmName, setFirmName] = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [file, setFile]         = useState(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone]           = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from('doc_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (err || !data) { setError('Link is invalid or has expired.'); setLoading(false); return }
      if (data.status !== 'pending') { setDone(true); setRequest(data); setLoading(false); return }
      setRequest(data)

      // Load firm name
      const { data: firm } = await supabase.from('firms').select('name').eq('id', data.firm_id).single()
      setFirmName(firm?.name ?? 'Your CA Firm')
      setLoading(false)
    }
    load()
  }, [requestId])

  async function upload() {
    if (!file) { setError('Please select a file'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10 MB'); return }

    setUploading(true); setError('')
    const ext  = file.name.split('.').pop()
    const path = `${request.firm_id}/${request.client_id}/${request.id}/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file)
    if (uploadErr) { setError('Upload failed: ' + uploadErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

    const { error: dbErr } = await supabase.from('documents').insert({
      firm_id:    request.firm_id,
      client_id:  request.client_id,
      request_id: request.id,
      file_name:  file.name,
      file_url:   publicUrl,
      status:     'uploaded',
    })
    if (dbErr) { setError('Error saving record: ' + dbErr.message); setUploading(false); return }

    await supabase.from('doc_requests').update({ status: 'uploaded' }).eq('id', request.id)
    setDone(true); setUploading(false)
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gray-50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 18,
            margin: '0 auto 12px',
          }}>CA</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--gray-800)' }}>
            {firmName || 'CA Client Portal'}
          </div>
          <div style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 2 }}>
            Secure Document Upload
          </div>
        </div>

        <div className="card">
          {loading ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>Loading…</p>
          ) : error && !request ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
              <p style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>Invalid Link</p>
              <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>{error}</p>
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--success)' }}>
                Document Uploaded!
              </h3>
              <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                {request?.status === 'uploaded' || request?.status === 'reviewed'
                  ? 'This document has already been submitted. Thank you!'
                  : `Your document has been uploaded successfully. Your CA will review it shortly.`}
              </p>
            </div>
          ) : (
            <>
              {/* Document info */}
              <div style={{
                background: 'var(--gray-50)', borderRadius: 8,
                padding: '14px 16px', marginBottom: 20,
                border: '1px solid var(--gray-200)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Document Requested
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--gray-800)', marginBottom: 6 }}>
                  {request.title}
                </div>
                {request.service_name && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                      {request.service_name}
                    </span>
                    {request.financial_year && (
                      <span style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                        {request.financial_year}
                      </span>
                    )}
                  </div>
                )}
                {request.due_date && (
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 6 }}>
                    Due: {new Date(request.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>

              {/* Upload form */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ marginBottom: 8, display: 'block' }}>
                  Select File to Upload *
                  <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 4 }}>
                    (PDF, JPG, PNG — max 10 MB)
                  </span>
                </label>

                {/* Custom file drop area */}
                <label style={{
                  display: 'block', border: '2px dashed var(--gray-300)',
                  borderRadius: 8, padding: '24px 16px', textAlign: 'center',
                  cursor: 'pointer', background: file ? '#f0fdf4' : 'var(--gray-50)',
                  borderColor: file ? 'var(--success)' : 'var(--gray-300)',
                  transition: 'all 0.2s',
                }}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => { setFile(e.target.files[0]); setError('') }}
                    style={{ display: 'none' }}
                  />
                  {file ? (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                      <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: 14 }}>{file.name}</div>
                      <div style={{ color: 'var(--gray-400)', fontSize: 12, marginTop: 2 }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB · Tap to change
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
                      <div style={{ fontWeight: 500, color: 'var(--gray-600)', fontSize: 14 }}>
                        Tap to select file
                      </div>
                      <div style={{ color: 'var(--gray-400)', fontSize: 12, marginTop: 2 }}>
                        or take a photo / scan
                      </div>
                    </>
                  )}
                </label>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button
                className="btn btn-primary"
                onClick={upload}
                disabled={uploading || !file}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
              >
                {uploading ? 'Uploading…' : '⬆ Upload Document'}
              </button>

              <p style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 11, marginTop: 12 }}>
                🔒 Secure upload · Your document goes directly to {firmName}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
