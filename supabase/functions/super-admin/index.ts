// Super Admin Edge Function
// Handles firm creation, listing, disabling, and password reset
// Requires caller to be a super admin

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify caller is authenticated
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Use caller's token to verify super admin status
  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } }
  })

  const { data: { user: caller } } = await callerClient.auth.getUser(authHeader.replace('Bearer ', ''))
  if (!caller) return json({ error: 'Unauthorized' }, 401)

  // Admin client with service role for privileged operations
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // Check super admin status
  const { data: callerProfile } = await admin
    .from('users')
    .select('is_super_admin')
    .eq('auth_id', caller.id)
    .single()

  if (!callerProfile?.is_super_admin) {
    return json({ error: 'Forbidden: Super admin only' }, 403)
  }

  const { action, ...payload } = await req.json()

  // ── Actions ─────────────────────────────────────────────────

  if (action === 'list_firms') {
    const { data, error } = await admin
      .from('firms')
      .select('*, users(count)')
      .order('created_at', { ascending: false })
    if (error) return json({ error: error.message }, 500)
    return json({ firms: data })
  }

  if (action === 'create_firm') {
    const { firmName, adminName, adminEmail, adminPassword } = payload

    // 1. Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    })
    if (authErr) return json({ error: authErr.message }, 400)

    // 2. Create firm
    const { data: firm, error: firmErr } = await admin
      .from('firms')
      .insert({ name: firmName, plan: 'free' })
      .select()
      .single()
    if (firmErr) {
      await admin.auth.admin.deleteUser(authData.user.id)
      return json({ error: firmErr.message }, 500)
    }

    // 3. Create user profile linked to firm
    const { error: userErr } = await admin.from('users').insert({
      auth_id: authData.user.id,
      firm_id: firm.id,
      name: adminName,
      email: adminEmail,
      role: 'admin',
    })
    if (userErr) return json({ error: userErr.message }, 500)

    return json({ success: true, firm, authUser: authData.user })
  }

  if (action === 'toggle_firm') {
    const { firmId, disabled } = payload
    const { error } = await admin
      .from('firms')
      .update({ disabled })
      .eq('id', firmId)
    if (error) return json({ error: error.message }, 500)
    return json({ success: true })
  }

  if (action === 'toggle_plan') {
    const { firmId, plan } = payload
    if (!['free', 'pro'].includes(plan)) return json({ error: 'Invalid plan' }, 400)
    const { error } = await admin
      .from('firms')
      .update({ plan })
      .eq('id', firmId)
    if (error) return json({ error: error.message }, 500)
    return json({ success: true })
  }

  if (action === 'reset_password') {
    const { adminEmail, newPassword } = payload
    // Find auth user by email
    const { data: users } = await admin.auth.admin.listUsers()
    const authUser = users?.users?.find(u => u.email === adminEmail)
    if (!authUser) return json({ error: 'User not found' }, 404)

    const { error } = await admin.auth.admin.updateUserById(authUser.id, {
      password: newPassword
    })
    if (error) return json({ error: error.message }, 500)
    return json({ success: true })
  }

  return json({ error: 'Unknown action' }, 400)
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
