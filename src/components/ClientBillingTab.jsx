// Client-facing billing tab — shows invoices with Pay Now button
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { payInvoice } from '../razorpayService'

export default function ClientBillingTab({ profile }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [paying, setPaying]     = useState(null) // invoice id being paid
  const [paidMsg, setPaidMsg]   = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', profile.client_id)
      .order('date', { ascending: false })
    setInvoices(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.client_id])

  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }
  function fmtAmt(a)  { return '₹' + Number(a).toLocaleString('en-IN') }

  const totalUnpaid = invoices.filter(i => !i.paid).reduce((s, i) => s + Number(i.amount), 0)

  async function handlePay(inv) {
    setPaying(inv.id)
    await payInvoice(
      inv,
      { name: profile.name, email: profile.email },
      (paymentId) => {
        setPaidMsg(`Payment successful! ID: ${paymentId}`)
        load()
      }
    )
    setPaying(null)
  }

  return (
    <div className="page">
      <div className="page-header"><h2>My Bills</h2></div>

      {paidMsg && (
        <div className="alert" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', marginBottom: 16 }}>
          ✓ {paidMsg}
          <button style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }} onClick={() => setPaidMsg('')}>✕</button>
        </div>
      )}

      {totalUnpaid > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--danger)', fontSize: 18 }}>{fmtAmt(totalUnpaid)}</div>
            <div className="text-muted text-sm">Total outstanding</div>
          </div>
        </div>
      )}

      {loading
        ? <p className="text-muted">Loading…</p>
        : invoices.length === 0
          ? (
            <div className="card">
              <div className="empty-state">
                <div className="icon">💰</div>
                <p>No invoices yet.</p>
              </div>
            </div>
          )
          : invoices.map(inv => (
            <div key={inv.id} className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{inv.description}</div>
                <div className="text-muted text-sm" style={{ marginTop: 4 }}>{fmtDate(inv.date)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{fmtAmt(inv.amount)}</div>
                {inv.paid ? (
                  <span className="badge badge-green">Paid</span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={paying === inv.id}
                    onClick={() => handlePay(inv)}
                  >
                    {paying === inv.id ? 'Opening…' : '💳 Pay Now'}
                  </button>
                )}
              </div>
            </div>
          ))
      }
    </div>
  )
}
