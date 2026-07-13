// Reusable export button — exports any data as CSV or triggers PDF print
// Usage: <ExportButton data={rows} filename="clients" columns={[{key,label}]} />

export function exportToCSV(data, filename, columns) {
  const header = columns.map(c => c.label).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? ''
      // Wrap in quotes if contains comma or newline
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('\n') ? `"${str}"` : str
    }).join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${filename}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export function exportToPrint(title, columns, data) {
  const rows = data.map(row =>
    `<tr>${columns.map(c => `<td>${row[c.key] ?? '—'}</td>`).join('')}</tr>`
  ).join('')

  const html = `
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
      h2 { margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
      th { background: #f3f4f6; font-weight: 600; }
      tr:nth-child(even) { background: #f9fafb; }
      .footer { margin-top: 16px; font-size: 11px; color: #888; }
    </style></head>
    <body>
      <h2>${title}</h2>
      <table>
        <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} · CA Client Portal</div>
    </body></html>
  `
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.print()
}

export default function ExportButton({ data, filename, columns, title, style }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)}>
        ↓ Export
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 51,
            background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8,
            boxShadow: 'var(--shadow-md)', minWidth: 140, overflow: 'hidden'
          }}>
            <button
              style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}
              onMouseEnter={e => e.target.style.background = 'var(--gray-50)'}
              onMouseLeave={e => e.target.style.background = 'none'}
              onClick={() => { exportToCSV(data, filename, columns); setOpen(false) }}
            >
              📊 Export CSV
            </button>
            <button
              style={{ display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}
              onMouseEnter={e => e.target.style.background = 'var(--gray-50)'}
              onMouseLeave={e => e.target.style.background = 'none'}
              onClick={() => { exportToPrint(title || filename, columns, data); setOpen(false) }}
            >
              🖨️ Print / PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Need useState import
import { useState } from 'react'
