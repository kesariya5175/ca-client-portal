// Super Admin Billing — tracks subscription revenue from CA firms
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { daysRemaining, expiryStatus, formatExpiry } from '../planUtils'

// Simple in-memory payment log stored in Supabase firms table notes
// For a real app this would be a separate payments table

export default function SuperAdminBilling() {
  const [firms, setFirms] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('firms')
      .select('*')
      .order('created_at', { ascending: false })
    setFirms(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const proFirms    = firms.filter(f => f.plan === 'pro')
  const freeFirms   = firms.filter(f => f.plan !== 'pro')
  const expired     = firms.filter(f => expiryStatus(f) === 'expired')
  const expiringSoon = firms.filter(f => expiryStatus(f) === 'expiring-soon')

  // Assume ₹999/month per pro firm as placeholder pricing
  const MONTHLY_RATE = 999
  const monthlyRevenue = proFirms.length * MONTHLY_RATE

  function fmtAmt(a) { return '₹' + Number(a).toLocaleString('en-IN') }

  function statusChip(firm) {
    const s = expiryStatus(firm)
    const map = {
      'active':        { label: 'Active',         bg: '#d1fae5', color: '#065f46' },
      'expiring-soon': { label: 'Expiring Soon',  bg: '#fef3c7', color: '#92400e' },
      'expired':       { label: 'Expired',        bg: '#fde8e8', color: '#c81e1e' },
      'no-expiry':     { label: 'No Expiry Set',  bg: 'var(--gray-100)', color: 'var(--gray-600)' },
    }
    const c = map[s]
    return <span style={{ background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.label}</span>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Billing & Revenue</h2>
      </div>

      {/* Summary */}
      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '3px solid #6366f1' }}>
          <div className="stat-value" style={{ color: '#6366f1' }}>{firms.length}</div>
          <div className="stat-label">Total Firms</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #1d4ed8' }}>
          <div className="stat-value" style={{ color: '#1d4ed8' }}>{proFirms.length}</div>
          <div className="stat-label">Pro Subscribers</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: 18 }}>{fmtAmt(monthlyRevenue)}</div>
          <div className="stat-label">Est. Monthly Revenue</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{expired.length}</div>
          <div className="stat-label">Expired</div>
        </div>
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="alert" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', marginBottom: 16 }}>
          ⚡ <strong>{expiringSoon.length} firm{expiringSoon.length > 1 ? 's' : ''}</strong> expiring within 7 days — follow up for renewal.
        </div>
      )}

      {/* Firms table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: 14 }}>
          All Firms — Subscription Status
        </div>
        {loading ? (
          <p className="text-muted" style={{ padding: 20 }}>Loading…</p>
        ) : (
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>FIRM</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>PLAN</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>EXPIRY</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>DAYS LEFT</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>VALUE/MO</th>
                </tr>
              </thead>
              <tbody>
                {firms.map((firm, i) => {
                  const days = daysRemaining(firm)
                  return (
                    <tr key={firm.id} style={{ borderBottom: i < firms.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{firm.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: firm.plan === 'pro' ? '#dbeafe' : 'var(--gray-100)',
                          color: firm.plan === 'pro' ? '#1d4ed8' : 'var(--gray-600)',
                          padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600
                        }}>
                          {firm.plan === 'pro' ? '⭐ PRO' : 'FREE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--gray-600)' }}>
                        {formatExpiry(firm) ?? '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: days !== null && days < 0 ? '#c81e1e' : days !== null && days <= 7 ? '#b45309' : 'var(--gray-700)' }}>
                        {days === null ? '—' : days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{statusChip(firm)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: firm.plan === 'pro' ? 'var(--success)' : 'var(--gray-400)' }}>
                        {firm.plan === 'pro' ? fmtAmt(MONTHLY_RATE) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {proFirms.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--gray-200)' }}>
                    <td colSpan={5} style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>Total Monthly Revenue</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, fontSize: 15, color: 'var(--success)' }}>{fmtAmt(monthlyRevenue)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
