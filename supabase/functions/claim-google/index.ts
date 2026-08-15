// claim-google — links a Google sign-in to a pre-enrolled client
//
// Why this needs the service role:
//   Supabase creates the auth.users row the moment Google returns,
//   BEFORE our app has any say. At that instant the person has a
//   valid session but no row in public.users, so RLS shows them
//   nothing and they cannot link themselves. Doing the link from
//   the browser would require an INSERT policy on public.users open
//   to any authenticated user — a privilege-escalation hole. So the
//   link happens here, server-side, gated on enrolment.
//
// Enrolment = a clients row whose portal_google_email matches the
// email inside the caller's verified Google JWT. No match, no entry.
//
// This function only ever creates role='client' rows. It cannot mint
// an admin, staff, or super admin under any input.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // ── 1. Verify the session server-side ─────────────────────
  // getUser() validates the JWT signature against the project
  // secret. We never trust an email sent in the request body.
  const token = authHeader.replace('Bearer ', '')
  const { data: { user: caller }, error: callerErr } = await admin.auth.getUser(token)
  if (callerErr || !caller) return json({ error: 'Unauthorized' }, 401)

  // ── 2. It must actually be a Google sign-in ───────────────
  const providers: string[] = caller.app_metadata?.providers
    ?? [caller.app_metadata?.provider].filter(Boolean)
  if (!providers.includes('google')) {
    return json({ error: 'Not a Google session' }, 403)
  }

  // ── 3. And Google must have verified the address ──────────
  // Guards against an unverified-email account being used to
  // impersonate an enrolled client.
  const email = String(caller.email ?? '').trim().toLowerCase()
  const emailVerified =
    caller.user_metadata?.email_verified === true ||
    caller.user_metadata?.email_verified === 'true'
  if (!email || !emailVerified) {
    return json({ error: 'Google account has no verified email' }, 403)
  }

  // ── 4. Already linked? Nothing to do. ─────────────────────
  const { data: existing } = await admin
    .from('users')
    .select('id, role, firm_id, client_id')
    .eq('auth_id', caller.id)
    .maybeSingle()

  if (existing) {
    await admin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', existing.id)
    return json({ status: 'already_linked', role: existing.role })
  }

  // ── 5. Look for the enrolment ─────────────────────────────
  // NOTE: ilike is used only to narrow the scan case-insensitively.
  // It treats % and _ as wildcards, so an enrolment value of
  // '%@gmail.com' would otherwise match every Gmail account. The
  // exact comparison below is what actually authorises.
  const { data: candidates } = await admin
    .from('clients')
    .select('id, firm_id, name, status, portal_google_email')
    .ilike('portal_google_email', email)

  const client = (candidates ?? []).find(
    c => String(c.portal_google_email ?? '').trim().toLowerCase() === email
  )

  if (!client) {
    return json({
      error: 'not_enrolled',
      message: 'This Google account is not registered with any CA firm on '
             + 'the portal. Ask your CA to add it to your client record.',
    }, 403)
  }

  if (client.status !== 'active') {
    return json({
      error: 'client_inactive',
      message: 'Your account is currently inactive. Please contact your CA firm.',
    }, 403)
  }

  // ── 6. Does this client already have a portal login? ──────
  // If they were given a username + password earlier, a second
  // users row would leave one client with two profiles, and
  // .single() lookups elsewhere in the app would start failing.
  // Two auth identities cannot be merged, so refuse and let the
  // firm decide which login the client should keep.
  const { data: clientUsers } = await admin
    .from('users')
    .select('id, auth_id, auth_method, google_email')
    .eq('client_id', client.id)

  const priorLogin = (clientUsers ?? []).find(
    u => u.auth_id && u.auth_id !== caller.id
  )
  if (priorLogin) {
    return json({
      error: 'already_has_login',
      message: 'This client already has a portal login. Please sign in with '
             + 'your username and password, or ask your CA firm to switch '
             + 'the account over to Google.',
    }, 409)
  }

  // ── 7. Is this Google address spoken for by someone else? ──
  // Should be impossible given the unique index on clients, but a
  // stale users row (e.g. client re-created) must not be hijacked.
  // Exact match for the same wildcard reason as above.
  const { data: emailRows } = await admin
    .from('users')
    .select('id, auth_id, google_email')
    .ilike('google_email', email)

  const emailTaken = (emailRows ?? []).find(
    u => String(u.google_email ?? '').trim().toLowerCase() === email
  )

  if (emailTaken && emailTaken.auth_id && emailTaken.auth_id !== caller.id) {
    return json({
      error: 'already_claimed',
      message: 'This Google account is already linked to another portal login. '
             + 'Please contact your CA firm.',
    }, 409)
  }

  // ── 8. Link it ────────────────────────────────────────────
  // Note the hardcoded role. Nothing in the request body reaches
  // this insert.
  const now = new Date().toISOString()

  if (emailTaken) {
    // Row was pre-created but never signed in — attach this auth_id.
    const { error } = await admin
      .from('users')
      .update({ auth_id: caller.id, auth_method: 'google', last_login_at: now })
      .eq('id', emailTaken.id)
    if (error) return json({ error: error.message }, 500)
    return json({ status: 'linked', role: 'client' })
  }

  const { error: insErr } = await admin.from('users').insert({
    firm_id:      client.firm_id,
    auth_id:      caller.id,
    client_id:    client.id,
    name:         caller.user_metadata?.full_name || client.name,
    email:        email,
    google_email: email,
    auth_method:  'google',
    role:         'client',
    last_login_at: now,
  })

  if (insErr) return json({ error: insErr.message }, 500)

  return json({ status: 'linked', role: 'client' })
})
