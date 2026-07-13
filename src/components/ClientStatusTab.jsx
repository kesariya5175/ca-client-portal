// Client-facing "My Status" tab
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ClientStatusTab({ profile }) {
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('client_services')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('updated_at', { ascending: false })
      setServices(data ?? [])
      setLoading(false)
    }
    load()
  }, [profile.client_id])

  function statusBadge(s) {
    const map = {
      'Pending Documents': 'badge-yellow',
      'Under Review':      'badge-blue',
      'In Progress':       'badge-blue',
      'Filed':             'badge-green',
      'Completed':         'badge-green',
      'On Hold':           'badge-gray',
      'Rejected':          'badge-red',
    }
    return map[s] ?? 'badge-gray'
  }

  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }

  return (
    <div className="page">
      <div className="page-header"><h2>My Status</h2></div>
      <p className="text-muted" style={{ marginBottom: 20 }}>Current status of your services with our firm.</p>

      {loading
        ? <p className="text-muted">Loading…</p>
        : services.length === 0
          ? (
            <div className="card">
              <div className="empty-state">
                <div className="icon">📋</div>
                <p>No services added yet. Please contact your CA.</p>
              </div>
            </div>
          )
          : services.map(s => (
              <div key={s.id} className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{s.service_name}</div>
                  {s.notes && <div className="text-muted text-sm" style={{ marginTop: 4 }}>{s.notes}</div>}
                  <div className="text-muted text-sm" style={{ marginTop: 4 }}>Updated: {fmtDate(s.updated_at)}</div>
                </div>
                <span className={`badge ${statusBadge(s.status)}`} style={{ fontSize: 12, padding: '5px 12px' }}>{s.status}</span>
              </div>
            ))
      }
    </div>
  )
}
