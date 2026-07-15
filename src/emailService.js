// Email service — calls the Supabase Edge Function
import { supabase } from './supabaseClient'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`

async function sendEmail({ to, subject, html }) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ to, subject, html }),
  })

  return res.json()
}

// ── Email templates ──────────────────────────────────────────

// documents = [{ title, uploadUrl }]
export async function emailDocumentRequest({ clientEmail, clientName, firmName, serviceName, financialYear, documents }) {
  const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://ca-client-portal-yr7e.vercel.app'
  const docListHtml = documents.map((d, i) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-size:14px">
        <strong>${i + 1}. ${d.title}</strong>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right">
        <a href="${d.uploadUrl}"
           style="display:inline-block;background:#1a56db;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-size:13px;white-space:nowrap">
          Upload →
        </a>
      </td>
    </tr>
  `).join('')

  return sendEmail({
    to: clientEmail,
    subject: `[Action Required] Documents Requested by ${firmName}${serviceName ? ` — ${serviceName}` : ''}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <div style="background:#1a56db;border-radius:10px;padding:20px 24px;margin-bottom:24px">
          <div style="color:#fff;font-weight:700;font-size:18px">CA Client Portal</div>
          <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:2px">${firmName}</div>
        </div>

        <p style="font-size:15px;margin-bottom:6px">Dear <strong>${clientName}</strong>,</p>
        <p style="color:#4b5563;margin-bottom:16px">
          <strong>${firmName}</strong> has requested the following document(s)${serviceName ? ` for <strong>${serviceName}</strong>${financialYear ? ` (${financialYear})` : ''}` : ''}:
        </p>

        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 14px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb">DOCUMENT</th>
              <th style="padding:10px 14px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb">ACTION</th>
            </tr>
          </thead>
          <tbody>${docListHtml}</tbody>
        </table>

        <div style="background:#eff6ff;border-radius:8px;padding:14px 16px;margin-bottom:20px;border:1px solid #bfdbfe">
          <p style="color:#1e40af;font-size:13px;margin:0">
            💡 <strong>No login required</strong> — click each "Upload →" button to upload that specific document directly.
          </p>
        </div>

        <p style="color:#6b7280;font-size:12px;margin-top:24px">
          CA Client Portal · ${firmName} ·
          <a href="${APP_URL}" style="color:#1a56db">Open Portal</a>
        </p>
      </div>
    `
  })
}

export async function emailTaskOverdue({ staffEmail, taskTitle, clientName, dueDate, firmName }) {
  return sendEmail({
    to: staffEmail,
    subject: `[Overdue] ${taskTitle} — ${clientName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#c81e1e">Overdue Task Alert</h2>
        <p>The following task is overdue:</p>
        <div style="background:#fde8e8;border-radius:8px;padding:14px 18px;margin:16px 0">
          <div style="font-weight:600;font-size:15px">${taskTitle}</div>
          <div style="margin-top:4px;color:#4b5563">Client: ${clientName}</div>
          <div style="margin-top:4px;color:#c81e1e">Due: ${dueDate}</div>
        </div>
        <a href="${import.meta.env.VITE_APP_URL ?? 'https://ca-client-portal-yr7e.vercel.app'}"
           style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          View Tasks →
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">CA Client Portal · ${firmName}</p>
      </div>
    `
  })
}

export async function emailDocumentReminder({ clientEmail, clientName, documentName, serviceName, financialYear, firmName }) {
  return sendEmail({
    to: clientEmail,
    subject: `[Reminder] Document Pending: ${documentName} — ${serviceName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#d97706">Document Pending — Reminder</h2>
        <p>Dear ${clientName},</p>
        <p>This is a gentle reminder that the following document is still pending from you:</p>
        <div style="background:#fef3c7;border-radius:8px;padding:14px 18px;margin:16px 0">
          <div style="font-weight:600;font-size:15px">${documentName}</div>
          <div style="margin-top:4px;color:#78350f;font-size:13px">Service: ${serviceName}${financialYear ? ` (${financialYear})` : ''}</div>
        </div>
        <p>Please log in to the CA Client Portal to upload this document at your earliest convenience.</p>
        <a href="${import.meta.env.VITE_APP_URL ?? 'https://ca-client-portal-yr7e.vercel.app'}"
           style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:8px">
          Upload Document →
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">CA Client Portal · ${firmName}</p>
      </div>
    `
  })
}

export async function emailServiceStatusUpdate({ clientEmail, clientName, serviceName, newStatus, notes, firmName }) {
  return sendEmail({
    to: clientEmail,
    subject: `Update: ${serviceName} — ${newStatus}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#1a56db">Service Status Update</h2>
        <p>Dear ${clientName},</p>
        <p>Your <strong>${serviceName}</strong> status has been updated:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:14px 18px;margin:16px 0">
          <div style="font-weight:600;font-size:15px">${newStatus}</div>
          ${notes ? `<div style="margin-top:6px;color:#4b5563">${notes}</div>` : ''}
        </div>
        <a href="${import.meta.env.VITE_APP_URL ?? 'https://ca-client-portal-yr7e.vercel.app'}"
           style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:8px">
          View Portal →
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">CA Client Portal · ${firmName}</p>
      </div>
    `
  })
}
