import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// Roles: 'admin' | 'staff' | 'client'
// admin  = CA firm owner — full access
// staff  = article clerk / employee — access to clients + tasks, no billing/settings
// client = end client — sees only their own data

export function useAuth() {
  const [user, setUser]       = useState(null)   // Supabase auth user
  const [profile, setProfile] = useState(null)   // row from public.users
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchProfile(session.user)
      else { setUser(null); setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authUser) {
    setUser(authUser)
    const { data, error } = await supabase
      .from('users')
      .select('*, firms(name, plan)')
      .eq('auth_id', authUser.id)
      .single()

    if (!error && data) setProfile(data)
    setLoading(false)
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const role = profile?.role ?? null
  const firmId = profile?.firm_id ?? null

  return {
    user,
    profile,
    loading,
    role,
    firmId,
    signIn,
    signOut,
    isAdmin:  role === 'admin',
    isStaff:  role === 'staff' || role === 'admin',
    isClient: role === 'client',
  }
}
