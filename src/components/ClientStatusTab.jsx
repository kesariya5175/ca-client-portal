// Client-facing "My Status" tab
// Shows enrolled services with document upload progress per service/FY
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ClientStatusTab({ profile }) {
  const [enrollments, setEnrollments] = useState([])
  const [docRequests, setDocRequests] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      const [svcRes, docRes] = await Promise.all([
        supabase.from('client_services')
          .select('*')
          .eq('client_id', profile.client_id)
          .order('financial_year', { ascending: false })
          .order('service_name'),
        supabase.from('doc_requests')
          .select('id,title,status,service_name,financial_year,due_date')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false }),
      ])
      setEnrollments(svcRes.data ?? [])
      setDocRequests(docRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [profile.client_id])

  // Group doc requests by service+FY
  function docsFor(serviceName, fy) {
    return docRequests.filter(
      d => d.service_name === serviceName && d.financial_year === fy
    )
  }

  // Overall status derived from doc requests
  function overallStatus(docs) {
    if (docs.length === 0) return { label: 'No Documents Requested', color: 'var(--gray-400)', bg: 'var(--gray-100)' }
    const pending  = docs.filter(d => d.status === 'pending').length
    const uploaded = docs.filter(d => d.status === 'uploaded').length
    const reviewed = docs.filter(d => d.status === 'reviewed').length
    if (reviewed === docs.length)               return { label: 'All Reviewed ✓',     color: '#065f46', bg: '#d1fae5' }
    if (pending === 0 && uploaded > 0)          return { label: 'Uploaded — Under Review', color: '#1e40af', bg: '#dbeafe' }
    if (pending === docs.length)                return { label: 'Documents Pending',   color: '#92400e', bg: '#fef3c7' }
    return { label: `${pending} Pending · ${uploaded} Uploaded · ${reviewed} Reviewed`, color: '#92400e', bg: '#fef3c7' }
  }

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  }

  // Group enrollments by FY
  const byFY = enrollments.reduce((acc, e) => {
    const fy = e.financial_year ?? 'Other'
    ;(acc[fy] = acc[fy] ?? []).push(e)
    return acc
  }, {})

  if (loading) return <div className="page"><p className="text-muted">Loading…</p></div>

  return (
    <div className="page">
      <div className="page-header"><h2>My Status</h2></div>
      <p className="text-muted" style={{ marginBottom: 20 }}>
        Track the status of your services and document submissions.
      </p>

      {enrollments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>No services enrolled yet. Please contact your CA.</p>
          </div>
        </div>
      ) : (
        Object.entries(byFY).map(([fy, list]) => (
          <div key={fy} style={{ marginBottom: 28 }}>
            {/* FY header */}
            <div style={{
              fontWeight: 700, fontSize: 13, color: 'var(--gray-500)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 10, paddingBottom: 6,
              borderBottom: '2px solid var(--gray-200)',
            }}>
              {fy}
            </div>

            {list.map(svc => {
              const docs   = docsFor(svc.service_name, svc.financial_year)
              const status = overallStatus(docs)
              const pending  = docs.filter(d => d.status === 'pending').length
              const uploaded = docs.filter(d => d.status === 'uploaded').length
              const reviewed = docs.filter(d => d.status === 'reviewed').length
              const total    = docs.length
              const pct      = total > 0 ? Math.round(((uploaded + reviewed) / total) * 100) : 0

              return (
                <div key={svc.id} className="card" style={{ marginBottom: 12 }}>
                  {/* Service header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: total > 0 ? 14 : 0 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{svc.service_name}</div>
                      {svc.notes && (
                        <div className="text-muted text-sm" style={{ marginTop: 3 }}>{svc.notes}</div>
                      )}
                    </div>
                    <span style={{
                      background: status.bg, color: status.color,
                      fontSize: 12, fontWeight: 600,
                      padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {status.label}
                    </span>
                  </div>

                  {/* Progress bar + doc breakdown */}
                  {total > 0 && (
                    <>
                      {/* Progress bar */}
                      <div style={{ background: 'var(--gray-100)', borderRadius: 99, height: 6, marginBottom: 10, overflow: 'hidden' }}>
                        <div style={{
                          background: reviewed === total ? '#16a34a' : 'var(--brand)',
                          height: '100%', width: `${pct}%`,
                          borderRadius: 99, transition: 'width 0.4s',
                        }} />
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                        <StatPill count={pending}  label="Pending"  color="#92400e" bg="#fef3c7" />
                        <StatPill count={uploaded} label="Uploaded" color="#1e40af" bg="#dbeafe" />
                        <StatPill count={reviewed} label="Reviewed" color="#065f46" bg="#d1fae5" />
                      </div>

                      {/* Document list */}
                      <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
                        {docs.map(d => (
                          <div key={d.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 0', borderBottom: '1px solid var(--gray-100)', gap: 8,
                          }}>
                            <div style={{ fontSize: 13, flex: 1 }}>
                              <span style={{ marginRight: 6 }}>
                                {d.status === 'reviewed' ? '✅' : d.status === 'uploaded' ? '📤' : '📄'}
                              </span>
                              {d.title}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                              {d.due_date && d.status === 'pending' && (
                                <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Due: {fmtDate(d.due_date)}</span>
                              )}
                              <DocStatusBadge status={d.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {total === 0 && (
                    <div className="text-muted text-sm" style={{ marginTop: 6 }}>
                      No documents requested yet for this service.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}

function StatPill({ count, label, color, bg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        background: bg, color, fontWeight: 700,
        fontSize: 12, padding: '2px 8px', borderRadius: 99,
      }}>{count}</span>
      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{label}</span>
    </div>
  )
}

function DocStatusBadge({ status }) {
  const map = {
    pending:  { label: 'Pending',  bg: '#fef3c7', color: '#92400e' },
    uploaded: { label: 'Uploaded', bg: '#dbeafe', color: '#1e40af' },
    reviewed: { label: 'Reviewed', bg: '#d1fae5', color: '#065f46' },
  }
  const s = map[status] ?? { label: status, bg: 'var(--gray-100)', color: 'var(--gray-500)' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 4,
    }}>{s.label}</span>
  )
}
