// Public document upload page — no login required
// Accessed via: https://your-app.vercel.app/?upload=<doc_request_id>
// Accepts PDF, JPG, PNG — images are auto-converted to PDF before upload
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { jsPDF } from 'jspdf'

// Convert an image File to a PDF Blob
async function imageToPdf(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // A4 in mm: 210 x 297. Fit image to page.
        const maxW = 190, maxH = 270
        let w = img.width, h = img.height
        const ratio = Math.min(maxW / w, maxH / h)
        w = w * ratio; h = h * ratio
        const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
        const pageW = pdf.internal.pageSize.getWidth()
        const pageH = pdf.internal.pageSize.getHeight()
        const x = (pageW - w) / 2
        const y = (pageH - h) / 2
        const fmt = file.type === 'image/png' ? 'PNG' : 'JPEG'
        pdf.addImage(e.target.result, fmt, x, y, w, h)
        resolve(pdf.output('blob'))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PublicUploadPage({ requestId }) {
  const [request, setRequest]     = useState(null)
  const [firmName, setFirmName]   = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [file, setFile]           = useState(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone]           = useState(false)
  const [converting, setConverting] = useState(false)

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

      const { data: firm } = await supabase.from('firms').select('name').eq('id', data.firm_id).single()
      setFirmName(firm?.name ?? 'Your CA Firm')
      setLoading(false)
    }
    load()
  }, [requestId])

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setError('')
  }

  async function upload() {
    if (!file) { setError('Please select a file'); return }
    if (file.size > 20 * 1024 * 1024) { setError('File must be under 20 MB'); return }

    setUploading(true); setError('')

    try {
      let uploadFile = file
      let fileName   = file.name

      // Convert image to PDF
      const isImage = file.type.startsWith('image/')
      if (isImage) {
        setConverting(true)
        const pdfBlob = await imageToPdf(file)
        // Replace extension with .pdf
        const baseName = file.name.replace(/\.[^.]+$/, '')
        fileName = `${baseName}.pdf`
        uploadFile = new File([pdfBlob], fileName, { type: 'application/pdf' })
        setConverting(false)
      }

      const path = `${request.firm_id}/${request.client_id}/${request.id}/${Date.now()}_${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(path, uploadFile, { contentType: 'application/pdf', upsert: false })

      if (uploadErr) {
        setError('Upload failed: ' + uploadErr.message)
        setUploading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

      const { error: dbErr } = await supabase.from('documents').insert({
        firm_id:    request.firm_id,
        client_id:  request.client_id,
        request_id: request.id,
        file_name:  fileName,
        file_url:   publicUrl,
        status:     'uploaded',
      })
      if (dbErr) { setError('Error saving record: ' + dbErr.message); setUploading(false); return }

      const { error: statusErr } = await supabase
        .from('doc_requests')
        .update({ status: 'uploaded' })
        .eq('id', request.id)

      if (statusErr) { setError('Upload saved but status update failed: ' + statusErr.message); setUploading(false); return }

      setDone(true)
    } catch (err) {
      setError('Unexpected error: ' + err.message)
    }

    setUploading(false)
  }

  const isImage = file && file.type.startsWith('image/')

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gray-50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 auto 12px',
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
                  : 'Your document has been uploaded successfully. Your CA will review it shortly.'}
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

              {/* Upload area */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>
                  Select File
                  <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                    PDF, JPG or PNG · max 20 MB
                  </span>
                </label>

                <label style={{
                  display: 'block', border: '2px dashed var(--gray-300)',
                  borderRadius: 8, padding: '28px 16px', textAlign: 'center',
                  cursor: 'pointer',
                  background: file ? (isImage ? '#fffbeb' : '#f0fdf4') : 'var(--gray-50)',
                  borderColor: file ? (isImage ? 'var(--warning)' : 'var(--success)') : 'var(--gray-300)',
                  transition: 'all 0.2s',
                }}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  {file ? (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{isImage ? '🖼️' : '📄'}</div>
                      <div style={{ fontWeight: 600, color: isImage ? 'var(--warning)' : 'var(--success)', fontSize: 14 }}>
                        {file.name}
                      </div>
                      <div style={{ color: 'var(--gray-400)', fontSize: 12, marginTop: 2 }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {isImage && <span style={{ color: 'var(--warning)', marginLeft: 6 }}>· Will be converted to PDF</span>}
                        <span style={{ marginLeft: 6 }}>· Tap to change</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                      <div style={{ fontWeight: 600, color: 'var(--gray-700)', fontSize: 15 }}>
                        Tap to select or take a photo
                      </div>
                      <div style={{ color: 'var(--gray-400)', fontSize: 12, marginTop: 4 }}>
                        Photos will be automatically converted to PDF
                      </div>
                    </>
                  )}
                </label>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>
              )}

              <button
                className="btn btn-primary"
                onClick={upload}
                disabled={uploading || !file}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, fontWeight: 600 }}
              >
                {converting ? '⚙️ Converting to PDF…' : uploading ? '⬆ Uploading…' : '⬆ Upload Document'}
              </button>

              <p style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 11, marginTop: 12 }}>
                🔒 Secure upload · Goes directly to {firmName}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
