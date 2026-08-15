// Document URL helpers.
//
// The `documents` bucket is private. Files are reachable only via
// short-lived signed URLs, generated on demand and authorised by the
// storage RLS policies (a user sees only their own firm's folder, and a
// client only their own subfolder).
//
// Historically `documents.file_url` stored a permanent public URL from
// getPublicUrl(). Those rows still exist, so everything here accepts
// either a stored path or a legacy full URL.

import { supabase } from './supabaseClient'

export const DOCUMENTS_BUCKET = 'documents'

// How long a generated link stays valid. Long enough to click and
// download, short enough that a URL copied into a WhatsApp message or
// a log file stops working quickly.
export const SIGNED_URL_TTL_SECONDS = 300   // 5 minutes

// Accepts either a bare storage path ("firm/client/req/file.pdf") or a
// legacy Supabase public URL, and returns the storage path.
export function toStoragePath(fileUrl) {
  const value = String(fileUrl ?? '').trim()
  if (!value) return ''

  // Legacy public URL:
  //   https://<ref>.supabase.co/storage/v1/object/public/documents/<path>
  const marker = `/object/public/${DOCUMENTS_BUCKET}/`
  const idx = value.indexOf(marker)
  if (idx !== -1) return decodeURIComponent(value.slice(idx + marker.length))

  // Signed URL that was stored by mistake — strip the query and prefix.
  const signedMarker = `/object/sign/${DOCUMENTS_BUCKET}/`
  const sIdx = value.indexOf(signedMarker)
  if (sIdx !== -1) {
    return decodeURIComponent(value.slice(sIdx + signedMarker.length).split('?')[0])
  }

  // Already a path.
  return value.replace(/^\/+/, '')
}

// Returns a temporary URL for a document, or throws with a message
// suitable for showing to the user.
export async function getSignedUrl(fileUrl) {
  const path = toStoragePath(fileUrl)
  if (!path) throw new Error('This document has no file attached.')

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error) {
    // The most common cause is RLS refusing the read, which means the
    // signed-in user is not entitled to this firm's or client's files.
    throw new Error('You do not have access to this document, or it is no longer available.')
  }
  return data.signedUrl
}

// Opens a document in a new tab.
//
// The tab is opened synchronously, before the await, because browsers
// only allow window.open() during a user gesture. Opening it after the
// network round trip gets it blocked as a popup.
export async function openDocument(fileUrl) {
  const tab = window.open('', '_blank', 'noopener,noreferrer')
  try {
    const url = await getSignedUrl(fileUrl)
    if (tab) tab.location.href = url
    else window.location.href = url          // popup blocked — navigate instead
  } catch (err) {
    if (tab) tab.close()
    throw err
  }
}
