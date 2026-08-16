// Shared identity helpers.
//
// Team members and clients are created by the Super Admin with only a
// username + password — no real email address is required.
//
// Supabase Auth still needs an email internally, so we derive a
// deterministic synthetic one. This must stay in sync with the same
// constants in supabase/functions/super-admin/index.ts.

export const AUTH_EMAIL_DOMAIN = 'users.kesariya.app'
export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/

export function normalizeUsername(raw) {
  return String(raw ?? '').trim().toLowerCase()
}

export function toAuthEmail(username) {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`
}

// Accepts either a username or a real email address and returns the
// address to authenticate with. Existing firm admins created with a
// real email keep working unchanged.
export function resolveLoginEmail(identifier) {
  const value = String(identifier ?? '').trim()
  return value.includes('@') ? value.toLowerCase() : toAuthEmail(value)
}

// True for synthetic addresses, so the UI can hide them.
export function isSyntheticEmail(email) {
  return String(email ?? '').toLowerCase().endsWith(`@${AUTH_EMAIL_DOMAIN}`)
}

// What to show in a table cell for a user's login identity.
export function displayIdentity(user) {
  if (user?.username) return user.username
  if (user?.email && !isSyntheticEmail(user.email)) return user.email
  return '—'
}
