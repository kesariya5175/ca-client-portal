import { useState } from 'react'
import { openDocument } from '../storageUrls'

// A clickable document name that fetches a short-lived signed URL and
// opens it. Replaces the old plain <a href={file_url}> — those relied
// on the bucket being public, which it no longer is.
//
// Rendered as a button rather than an anchor because there is no stable
// href to give it: the URL does not exist until it is requested, and
// expires a few minutes later.
export default function DocLink({ doc, style }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleClick() {
    setError(''); setLoading(true)
    try { await openDocument(doc.file_url) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <span style={{ display: 'block' }}>
      <button type="button" onClick={handleClick} disabled={loading}
        title={loading ? 'Preparing secure link…' : `Open ${doc.file_name}`}
        style={{
          background: 'none', border: 'none', padding: 0,
          color: 'var(--brand)', fontSize: 12, textAlign: 'left',
          cursor: loading ? 'default' : 'pointer',
          textDecoration: 'underline', opacity: loading ? 0.6 : 1,
          ...style,
        }}>
        📎 {doc.file_name}{loading ? ' …' : ''}
      </button>
      {error && (
        <span style={{ display: 'block', color: 'var(--danger, #dc2626)', fontSize: 11 }}>
          {error}
        </span>
      )}
    </span>
  )
}
