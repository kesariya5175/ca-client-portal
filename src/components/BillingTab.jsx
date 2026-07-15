import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ExportButton from './ExportButton'
import { getPlan } from '../planUtils'

const INVOICE_EXPORT_COLS = [
  { key: 'client_name', label: 'Client' }, { key: 'description', label: 'Description' },
  { key: 'date', label: 'Date' }, { key: 'amount', label: 'Amount (₹)' },
  { key: 'paid', label: 'Paid' },
]

function InvoiceModal({ firmId, clients, invoice, onClose, onSaved }) {
  const isEdit = !!invoice
  const [form, setForm] = useState({
    client_id:   invoice?.client_id   ?? (clients[0]?.id ?? ''),
    description: invoice?.description ?? '',
    amount:      invoice?.amount      ?? '',
    date:        invoice?.date        ?? new Date().toISOString().slice(0, 10),
    paid:        invoice?.paid        ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.client_id || !form.description.trim() || !form.amount) { setError('Client, description and amount are required'); return }
    setSaving(true); setError('')
    const payload = { ...form, firm_id: firmId, amount: parseFloat(form.amount) }
    const { error: err } = isEdit
      ? await supabase.from('invoices').update(payload).eq('id', invoice.id)
      : await supabase.from('invoices').insert(payload)
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Invoice' : 'Add Invoice'}</h3>
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
            <label>Description *</label>
            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. ITR Filing FY 2025-26" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="5000" />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.paid} onChange={e => set('paid', e.target.checked)} />
              Mark as Paid
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function BillingTab({ profile }) {
  const plan = getPlan(profile.firms)
  const [invoices, setInvoices] = useState([])
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [modal, setModal]       = useState(null)

  async function load() {
    setLoading(true)
    const [invRes, cliRes] = await Promise.all([
      supabase.from('invoices').select('*, clients(name)').eq('firm_id', profile.firm_id).order('date', { ascending: false }),
      supabase.from('clients').select('id,name').eq('firm_id', profile.firm_id).eq('status', 'active').order('name'),
    ])
    setInvoices(invRes.data ?? [])
    setClients(cliRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.firm_id])

  const filtered = invoices.filter(i => filter === 'all' || (filter === 'unpaid' && !i.paid) || (filter === 'paid' && i.paid))

  const totalUnpaid = invoices.filter(i => !i.paid).reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid   = invoices.filter(i =>  i.paid).reduce((s, i) => s + Number(i.amount), 0)

  async function togglePaid(inv) {
    await supabase.from('invoices').update({ paid: !inv.paid }).eq('id', inv.id)
    load()
  }

  function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }
  function fmtAmt(a)  { return '₹' + Number(a).toLocaleString('en-IN') }

  return (
    <div className="page">
      {modal && (
        <InvoiceModal
          firmId={profile.firm_id} clients={clients}
          invoice={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}

      <div className="page-header">
        <h2>Billing</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {plan.export && (
            <ExportButton
              data={filtered.map(i => ({ ...i, client_name: i.clients?.name, paid: i.paid ? 'Yes' : 'No' }))}
              filename="invoices" title="Invoice List" columns={INVOICE_EXPORT_COLS}
            />
          )}
          <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Invoice</button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div className="stat-value" style={{ color: 'var(--danger)', fontSize: 20 }}>{fmtAmt(totalUnpaid)}</div>
          <div className="stat-label">Outstanding</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: 20 }}>{fmtAmt(totalPaid)}</div>
          <div className="stat-label">Collected</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs" style={{ marginBottom: 16 }}>
          {[['all', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid']].map(([val, label]) => (
            <button key={val} className={`tab-btn ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>

        {loading
          ? <p className="text-muted">Loading…</p>
          : filtered.length === 0
            ? <div className="empty-state"><div className="icon">💰</div><p>No invoices yet</p></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 500 }}>{inv.clients?.name}</td>
                        <td>{inv.description}</td>
                        <td>{fmtDate(inv.date)}</td>
                        <td style={{ fontWeight: 600 }}>{fmtAmt(inv.amount)}</td>
                        <td>
                          <span className={`badge ${inv.paid ? 'badge-green' : 'badge-red'}`}>
                            {inv.paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => togglePaid(inv)}>
                              {inv.paid ? 'Mark Unpaid' : 'Mark Paid'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal(inv)}>Edit</button>
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
