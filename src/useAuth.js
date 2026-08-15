import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { resolveLoginEmail } from './authIdentity'

// Roles: 'admin' | 'staff' | 'client'
// admin  = CA firm owner — full access
// staff  = article clerk / employee — access to clients + tasks, no billing/settings
// client = end client — sees only their own data

export function useAuth() {
  const [user, setUser]       = useState(null)   // Supabase auth user
  const [profile, setProfile] = useState(null)   // row from public.users
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('') // e.g. Google account not enrolled

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

    if (!error && data) {
      setProfile(data)
      setLoading(false)
      return
    }

    // No profile row. For a Google sign-in this is expected on the
    // very first visit — the auth account exists but has never been
    // linked to a client record. Ask the server to link it.
    //
    // Password sign-ins always have a row already, so we only take
    // this path for Google to avoid a pointless round trip.
    const providers = authUser.app_metadata?.providers
      ?? [authUser.app_metadata?.provider].filter(Boolean)

    if (!providers.includes('google')) {
      setLoading(false)
      return
    }

    await claimGoogleAccount(authUser)
  }

  // Calls the claim-google edge function. On success the profile row
  // now exists, so we re-read it. On failure the person is signed out
  // — leaving a valid session with no profile would strand them on a
  // blank screen with no way back to the login page.
  async function claimGoogleAccount(authUser) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-google`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: '{}',
        }
      )
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setAuthError(
          body.message ||
          'This Google account is not registered on the portal.'
        )
        await supabase.auth.signOut()
        setUser(null); setProfile(null); setLoading(false)
        return
      }

      // Linked — read the profile that now exists.
      const { data: linked } = await supabase
        .from('users')
        .select('*, firms(name, plan)')
        .eq('auth_id', authUser.id)
        .single()

      if (linked) setProfile(linked)
      setLoading(false)
    } catch (err) {
      setAuthError('Could not complete Google sign-in. Please try again.')
      await supabase.auth.signOut()
      setUser(null); setProfile(null); setLoading(false)
    }
  }

  // `identifier` may be a username (team members / clients) or a real
  // email address (firm admins onboarded by the super admin).
  async function signIn(identifier, password) {
    const email = resolveLoginEmail(identifier)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Don't leak the synthetic address back to the user
      if (/invalid login credentials/i.test(error.message)) {
        throw new Error('Incorrect username or password')
      }
      throw error
    }
  }

  // Optional convenience for end clients whose CA has put their
  // Google address on their client record. Redirects to Google and
  // comes back to the app, where onAuthStateChange picks it up.
  async function signInWithGoogle() {
    setAuthError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }

  async function signOut() {
    setAuthError('')
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
    authError,
    clearAuthError: () => setAuthError(''),
    signIn,
    signInWithGoogle,
    signOut,
    isAdmin:      role === 'admin',
    isStaff:      role === 'staff' || role === 'admin',
    isClient:     role === 'client',
    isSuperAdmin: profile?.is_super_admin === true,
  }
}
