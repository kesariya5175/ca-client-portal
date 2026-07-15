import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Dashboard({ profile, onTabChange }) {
  const [stats, setStats]     = useState({ clients: 0, pendingDocs: 0, overdueTasks: 0, unpaidInvoices: 0 })
  const [tasks, setTasks]     = useState([])
  const [pendingByClient, setPendingByClient] = useState([])   // [{ name, count }]
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const firmId = profile.firm_id

      const [clientsRes, docsRes, tasksRes, invoicesRes, pendingDocsRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('firm_id', firmId).eq('status', 'active'),
        supabase.from('doc_requests').select('id', { count: 'exact', head: true }).eq('firm_id', firmId).eq('status', 'pending'),
        supabase.from('tasks').select('id,title,due_date,status,priority,clients(name)').eq('firm_id', firmId).neq('status', 'done').order('due_date').limit(8),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('firm_id', firmId).eq('paid', false),
        // Pending docs with client name for breakdown
        supabase.from('doc_requests').select('client_id, clients(name)').eq('firm_id', firmId).eq('status', 'pending'),
      ])

      setStats({
        clients:        clientsRes.count ?? 0,
        pendingDocs:    docsRes.count ?? 0,
        overdueTasks:   (tasksRes.data ?? []).filter(t => t.due_date && new Date(t.due_date) < new Date()).length,
        unpaidInvoices: invoicesRes.count ?? 0,
      })
      setTasks(tasksRes.data ?? [])

      // Group pending docs by client
      const byClient = {}
      for (const d of pendingDocsRes.data ?? []) {
        const name = d.clients?.name ?? 'Unknown'
        byClient[name] = (byClient[name] ?? 0) + 1
      }
      const sorted = Object.entries(byClient)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
      setPendingByClient(sorted)

      setLoading(false)
    }
    load()
  }, [profile.firm_id])

  if (loading) return <div className="page"><p className="text-muted">Loading…</p></div>

  const today = new Date()
  function taskStatus(t) {
    if (t.status === 'done') return { label: 'Done', cls: 'badge-green' }
    if (!t.due_date) return { label: t.priority ?? 'Pending', cls: t.priority === 'High' ? 'badge-red' : 'badge-gray' }
    const d = new Date(t.due_date)
    if (d < today) return { label: 'Overdue', cls: 'badge-red' }
    const diff = Math.ceil((d - today) / 86400000)
    if (diff <= 3) return { label: `Due in ${diff}d`, cls: 'badge-yellow' }
    return { label: t.priority ?? 'On track', cls: 'badge-blue' }
  }

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < today)
  const upcomingTasks = tasks.filter(t => !t.due_date || new Date(t.due_date) >= today)

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <span className="text-muted text-sm">
          {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onTabChange('clients')}>
          <div className="stat-value">{stats.clients}</div>
          <div className="stat-label">Active Clients</div>
        </div>
        <div className="stat-card"
          style={{ cursor: 'pointer', borderLeft: stats.pendingDocs > 0 ? '3px solid var(--warning)' : undefined }}
          onClick={() => onTabChange('documents')}
        >
          <div className="stat-value" style={{ color: stats.pendingDocs > 0 ? 'var(--warning)' : undefined }}>
            {stats.pendingDocs}
          </div>
          <div className="stat-label">Pending Documents</div>
        </div>
        <div className="stat-card" style={{ borderLeft: stats.overdueTasks > 0 ? '3px solid var(--danger)' : undefined }}>
          <div className="stat-value" style={{ color: stats.overdueTasks > 0 ? 'var(--danger)' : undefined }}>
            {stats.overdueTasks}
          </div>
          <div className="stat-label">Overdue Tasks</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onTabChange('billing')}>
          <div className="stat-value">{stats.unpaidInvoices}</div>
          <div className="stat-label">Unpaid Invoices</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left column: Tasks */}
        <div>
          {/* Overdue tasks */}
          {overdueTasks.length > 0 && (
            <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 600, color: 'var(--danger)', fontSize: 14 }}>⚠ Overdue Tasks ({overdueTasks.length})</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => onTabChange('tasks')}>View all</button>
              </div>
              {overdueTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</div>
                    <div className="text-muted text-sm">{t.clients?.name} · Due {fmtDate(t.due_date)}</div>
                  </div>
                  <span className="badge badge-red">Overdue</span>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming tasks */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 600, fontSize: 14 }}>Upcoming Tasks</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onTabChange('tasks')}>View all</button>
            </div>
            {upcomingTasks.length === 0
              ? <div className="empty-state" style={{ padding: '20px 0' }}><p>No upcoming tasks</p></div>
              : upcomingTasks.slice(0, 6).map(t => {
                  const s = taskStatus(t)
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div className="text-muted text-sm">{t.clients?.name} · Due {fmtDate(t.due_date)}</div>
                      </div>
                      <span className={`badge ${s.cls}`} style={{ flexShrink: 0, marginLeft: 8 }}>{s.label}</span>
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* Right column: Pending docs by client */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 600, fontSize: 14 }}>📁 Pending Documents by Client</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onTabChange('documents')}>View all</button>
            </div>

            {pendingByClient.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                <p>No pending documents — all clear!</p>
              </div>
            ) : (
              pendingByClient.map(({ name, count }) => (
                <div
                  key={name}
                  onClick={() => onTabChange('documents')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 0', borderBottom: '1px solid var(--gray-100)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 6,
                      background: 'var(--brand-light)', color: 'var(--brand)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{name}</div>
                  </div>
                  <span style={{
                    background: count > 3 ? '#fde8e8' : '#fef3c7',
                    color: count > 3 ? 'var(--danger)' : 'var(--warning)',
                    fontWeight: 700, fontSize: 12,
                    padding: '3px 10px', borderRadius: 99,
                  }}>
                    {count} pending
                  </span>
                </div>
              ))
            )}

            {stats.pendingDocs > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--gray-100)', textAlign: 'center' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onTabChange('documents')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Go to Documents →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
