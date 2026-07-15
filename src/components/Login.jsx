import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onLogin }) {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPass, setShowPass]         = useState(false)
  const [remember, setRemember]         = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [forgotMode, setForgotMode]     = useState(false)
  const [forgotEmail, setForgotEmail]   = useState('')
  const [forgotSent, setForgotSent]     = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setForgotLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/?reset=true`,
    })
    setForgotLoading(false)
    if (err) { setError(err.message); return }
    setForgotSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>

      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f2557 0%, #1a3a7c 40%, #0d5c63 100%)' }} />

      {/* Floating circles */}
      {[
        { w: 340, h: 340, top: '-80px',   left: '-80px',   op: 0.07 },
        { w: 500, h: 500, bottom: '-150px', right: '-100px', op: 0.06 },
        { w: 200, h: 200, top: '30%',     left: '10%',     op: 0.05 },
        { w: 120, h: 120, top: '20%',     right: '12%',    op: 0.08 },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          width: c.w, height: c.h,
          top: c.top, bottom: c.bottom, left: c.left, right: c.right,
          background: 'rgba(255,255,255,' + c.op + ')',
          pointerEvents: 'none',
        }} />
      ))}

      {/* Finance icons */}
      {[
        { icon: '₹',  top: '12%', left: '8%',   size: 48, op: 0.12 },
        { icon: '📊', top: '25%', left: '3%',   size: 32, op: 0.18 },
        { icon: '📋', top: '65%', left: '6%',   size: 36, op: 0.15 },
        { icon: '🔒', top: '80%', left: '2%',   size: 28, op: 0.18 },
        { icon: '📈', top: '8%',  right: '5%',  size: 40, op: 0.15 },
        { icon: '💼', top: '45%', right: '4%',  size: 34, op: 0.15 },
        { icon: '🧾', top: '72%', right: '6%',  size: 30, op: 0.15 },
        { icon: '⚖️', top: '55%', left: '4%',  size: 32, op: 0.15 },
      ].map((f, i) => (
        <div key={i} style={{
          position: 'absolute', top: f.top, left: f.left, right: f.right,
          fontSize: f.size, opacity: f.op, pointerEvents: 'none', userSelect: 'none',
        }}>{f.icon}</div>
      ))}

      {/* Left panel — desktop only */}
      <div className="login-left-panel" style={{
        display: 'none', flex: 1,
        alignItems: 'center', justifyContent: 'center',
        padding: '48px', position: 'relative', zIndex: 1,
      }}>
        <div style={{ color: '#fff', maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚖️</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
            Manage your CA practice smarter
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            One platform for documents, tasks, billing, and client communication — built for Indian CA firms.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📁', text: 'Collect documents with one-click upload links' },
              { icon: '📧', text: 'Email & WhatsApp reminders automatically' },
              { icon: '🧾', text: 'GST, ITR, ROC — 40+ CA services covered' },
              { icon: '🔒', text: 'Secure, multi-tenant, firm-isolated data' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login card */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <CaLogo size={80} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>CA Client Portal</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Client Management System</p>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.97)', borderRadius: 20, padding: '32px 28px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            {forgotMode ? (
              forgotSent ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>📧</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Check your email</h3>
                  <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 20 }}>
                    A password reset link has been sent to <strong>{forgotEmail}</strong>
                  </p>
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setForgotMode(false); setForgotSent(false); setError('') }}>
                    ← Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Reset Password</h3>
                  <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 20 }}>
                    Enter your email and we'll send a reset link.
                  </p>
                  {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                  <form onSubmit={handleForgot}>
                    <div className="form-group">
                      <label>Email address</label>
                      <input type="email" className="input" placeholder="you@example.com"
                        value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        required autoFocus />
                    </div>
                    <button type="submit" className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginBottom: 10 }}
                      disabled={forgotLoading}>
                      {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                    </button>
                    <button type="button" className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => { setForgotMode(false); setError('') }}>
                      ← Back to Sign In
                    </button>
                  </form>
                </>
              )
            ) : (
              <>
                <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4, color: 'var(--gray-900)' }}>
                  Welcome back
                </h2>
                <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 24 }}>
                  Secure access for Chartered Accountants
                </p>

                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">Email or Username</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: 15 }}>✉</span>
                      <input id="email" type="email" className="input"
                        placeholder="your@email.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        style={{ paddingLeft: 36 }} required autoFocus />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                      <button type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 500 }}
                        onClick={() => { setForgotMode(true); setForgotEmail(email); setError('') }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: 14 }}>🔒</span>
                      <input id="password"
                        type={showPass ? 'text' : 'password'}
                        className="input" placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)}
                        style={{ paddingLeft: 36, paddingRight: 40 }} required />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 15, padding: 0 }}>
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <input type="checkbox" id="remember" checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--brand)' }} />
                    <label htmlFor="remember" style={{ fontSize: 13, color: 'var(--gray-600)', cursor: 'pointer', margin: 0 }}>
                      Remember me
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 16, fontWeight: 700, borderRadius: 10 }}
                    disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In →'}
                  </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--gray-500)' }}>
                  Don't have an account?{' '}
                  <a href="mailto:support@caclientportal.in"
                    style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
                    Contact Admin
                  </a>
                </p>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
            {['🔒 256-bit SSL', '🏅 ISO Certified', '🇮🇳 Made in India'].map(b => (
              <span key={b} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

// Inline SVG logo — no external file dependency
function CaLogo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', margin: '0 auto 12px' }}>
      {/* Outer C arc */}
      <path d="M98 60 A40 40 0 1 1 84 22" stroke="#0f2557" strokeWidth="16" strokeLinecap="round" fill="none"/>
      {/* Document stack back */}
      <rect x="60" y="16" width="32" height="40" rx="5" fill="#0d5c63"/>
      {/* Document stack front */}
      <rect x="54" y="24" width="32" height="40" rx="5" fill="#0e9280"/>
      {/* Doc lines */}
      <rect x="61" y="33" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.55)"/>
      <rect x="61" y="40" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
      <rect x="61" y="47" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.35)"/>
      {/* Small card bottom-right */}
      <rect x="68" y="56" width="22" height="14" rx="3" fill="#0f2557" opacity="0.9"/>
      {/* Padlock body */}
      <rect x="43" y="51" width="26" height="22" rx="5" fill="white"/>
      {/* Padlock shackle */}
      <path d="M50 51 L50 44 Q56 37 62 44 L62 51" stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      {/* Keyhole */}
      <circle cx="56" cy="60" r="3.5" fill="#0e9280"/>
      <rect x="54.5" y="61.5" width="3" height="5" rx="1" fill="#0e9280"/>
    </svg>
  )
}
