import { useState } from 'react'
import { supabase } from '../supabaseClient'

function FinanceIllustration() {
  return (
    <svg viewBox="0 0 420 360" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 400 }}>
      {/* Card 1 — Revenue bar chart */}
      <rect x="10" y="10" width="185" height="115" rx="14" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.5"/>
      <text x="26" y="34" fontSize="10" fill="#0369a1" fontWeight="700" fontFamily="sans-serif">Monthly Revenue</text>
      <text x="26" y="52" fontSize="18" fill="#0284c7" fontWeight="700" fontFamily="sans-serif">₹4.2L</text>
      <text x="108" y="52" fontSize="9" fill="#16a34a" fontFamily="sans-serif">▲ 18% this month</text>
      <rect x="26"  y="90" width="12" height="22" rx="2" fill="#bae6fd"/>
      <rect x="44"  y="80" width="12" height="32" rx="2" fill="#7dd3fc"/>
      <rect x="62"  y="68" width="12" height="44" rx="2" fill="#38bdf8"/>
      <rect x="80"  y="72" width="12" height="40" rx="2" fill="#0ea5e9"/>
      <rect x="98"  y="60" width="12" height="52" rx="2" fill="#0284c7"/>
      <rect x="116" y="55" width="12" height="57" rx="2" fill="#0369a1"/>
      <rect x="134" y="62" width="12" height="50" rx="2" fill="#0284c7"/>
      <rect x="152" y="50" width="12" height="62" rx="2" fill="#0369a1"/>

      {/* Card 2 — Tax savings donut */}
      <rect x="215" y="10" width="195" height="115" rx="14" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5"/>
      <text x="231" y="34" fontSize="10" fill="#166534" fontWeight="700" fontFamily="sans-serif">Tax Savings — FY 2025-26</text>
      <circle cx="268" cy="82" r="30" fill="none" stroke="#dcfce7" strokeWidth="14"/>
      <circle cx="268" cy="82" r="30" fill="none" stroke="#16a34a" strokeWidth="14"
        strokeDasharray="120 68" strokeDashoffset="30" strokeLinecap="round"/>
      <text x="268" y="86" fontSize="11" fill="#15803d" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">63%</text>
      <text x="310" y="58" fontSize="9" fill="#15803d" fontFamily="sans-serif">ITR Filing</text>
      <rect x="348" y="49" width="8" height="8" rx="2" fill="#16a34a"/>
      <text x="310" y="76" fontSize="9" fill="#15803d" fontFamily="sans-serif">GST Return</text>
      <rect x="348" y="67" width="8" height="8" rx="2" fill="#4ade80"/>
      <text x="310" y="94" fontSize="9" fill="#15803d" fontFamily="sans-serif">TDS Challan</text>
      <rect x="348" y="85" width="8" height="8" rx="2" fill="#bbf7d0"/>

      {/* Card 3 — Compliance line chart */}
      <rect x="10" y="145" width="185" height="110" rx="14" fill="#fefce8" stroke="#fef08a" strokeWidth="1.5"/>
      <text x="26" y="168" fontSize="10" fill="#854d0e" fontWeight="700" fontFamily="sans-serif">Compliance Score</text>
      <text x="26" y="188" fontSize="18" fill="#d97706" fontWeight="700" fontFamily="sans-serif">98.4%</text>
      <text x="115" y="188" fontSize="9" fill="#16a34a" fontFamily="sans-serif">✓ Excellent</text>
      <polyline
        points="26,235 56,228 86,218 116,212 146,205 175,196"
        fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="175" cy="196" r="4" fill="#d97706"/>
      <circle cx="26"  cy="235" r="3" fill="#fcd34d"/>
      <circle cx="56"  cy="228" r="3" fill="#fcd34d"/>
      <circle cx="86"  cy="218" r="3" fill="#fcd34d"/>
      <circle cx="116" cy="212" r="3" fill="#fcd34d"/>
      <circle cx="146" cy="205" r="3" fill="#fcd34d"/>

      {/* Card 4 — Pending tasks */}
      <rect x="215" y="145" width="195" height="110" rx="14" fill="#fdf4ff" stroke="#e9d5ff" strokeWidth="1.5"/>
      <text x="231" y="168" fontSize="10" fill="#6b21a8" fontWeight="700" fontFamily="sans-serif">Pending Documents</text>
      <circle cx="236" cy="188" r="5" fill="#a855f7"/>
      <text x="231" y="173" fontSize="9" fill="#9333ea" fontFamily="sans-serif">          </text>
      <text x="245" y="191" fontSize="10" fill="#7e22ce" fontFamily="sans-serif">Form 16 (Employer)</text>
      <circle cx="236" cy="207" r="5" fill="none" stroke="#c084fc" strokeWidth="1.5"/>
      <text x="245" y="210" fontSize="10" fill="#7e22ce" fontFamily="sans-serif">Bank Statement</text>
      <circle cx="236" cy="226" r="5" fill="none" stroke="#c084fc" strokeWidth="1.5"/>
      <text x="245" y="229" fontSize="10" fill="#7e22ce" fontFamily="sans-serif">Investment Proof</text>
      <circle cx="236" cy="245" r="5" fill="#a855f7"/>
      <text x="245" y="248" fontSize="10" fill="#c084fc" fontFamily="sans-serif" textDecoration="line-through">Aadhaar Copy</text>

      {/* Bottom banner */}
      <rect x="10" y="278" width="400" height="72" rx="14" fill="#1e40af"/>
      <text x="28" y="305" fontSize="13" fill="white" fontWeight="700" fontFamily="sans-serif">CA Client Portal</text>
      <text x="28" y="324" fontSize="9" fill="#93c5fd" fontFamily="sans-serif">Trusted by CA firms across India · Secure · Multi-tenant</text>
      <rect x="28" y="336" width="40" height="5" rx="3" fill="#3b82f6"/>
      <rect x="76" y="336" width="24" height="5" rx="3" fill="#60a5fa"/>
      <rect x="108" y="336" width="32" height="5" rx="3" fill="#93c5fd"/>
      <text x="310" y="308" fontSize="26" fontFamily="sans-serif">📊</text>
      <text x="352" y="308" fontSize="26" fontFamily="sans-serif">🧾</text>
      <text x="353" y="340" fontSize="9" fill="#93c5fd" fontFamily="sans-serif">Billing</text>
      <text x="312" y="340" fontSize="9" fill="#93c5fd" fontFamily="sans-serif">Reports</text>
    </svg>
  )
}

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f8faff 0%, #eef4ff 50%, #f0fdf4 100%)',
      display: 'flex',
      alignItems: 'stretch',
    }}>

      {/* ── Left panel — illustration (hidden on mobile) ── */}
      <div className="login-left" style={{
        flex: 1,
        display: 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        borderRight: '1px solid #e2e8f0',
      }}>
        <FinanceIllustration />
        <div style={{ marginTop: 32, textAlign: 'center', maxWidth: 320 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a', marginBottom: 8 }}>
            Manage your CA practice smarter
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
            Documents, tasks, billing, and client communication — all in one place, built for Indian CA firms.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {['📁 Document Requests', '📧 Auto Reminders', '🧾 GST & ITR', '💰 Billing', '⚖️ 40+ Services'].map(f => (
            <span key={f} style={{
              background: 'white', border: '1px solid #e2e8f0',
              borderRadius: 20, padding: '5px 12px',
              fontSize: 12, color: '#475569', fontWeight: 500,
            }}>{f}</span>
          ))}
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img
              src="/logo.svg"
              alt="CA Client Portal"
              style={{ width: 72, height: 72, margin: '0 auto 12px', display: 'block' }}
            />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a', marginBottom: 3 }}>
              CA Client Portal
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>Client Management System</p>
          </div>

          {/* Form card */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '32px 28px',
            boxShadow: '0 4px 24px rgba(30,58,138,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            border: '1px solid #e8efff',
          }}>
            {forgotMode ? (
              forgotSent ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>📧</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#1e3a8a' }}>Check your email</h3>
                  <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
                    A password reset link has been sent to <strong>{forgotEmail}</strong>
                  </p>
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setForgotMode(false); setForgotSent(false); setError('') }}>
                    ← Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: '#1e3a8a' }}>Reset Password</h3>
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
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
                <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4, color: '#1e3a8a' }}>
                  Welcome back
                </h2>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
                  Secure access for Chartered Accountants
                </p>

                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">Email or Username</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 15 }}>✉</span>
                      <input id="email" type="email" className="input"
                        placeholder="your@email.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        style={{ paddingLeft: 36 }}
                        required autoFocus />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                      <button type="button"
                        style={{ background: 'none', border: 'none', color: '#1a56db', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 500 }}
                        onClick={() => { setForgotMode(true); setForgotEmail(email); setError('') }}>
                        Forgot password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}>🔒</span>
                      <input id="password"
                        type={showPass ? 'text' : 'password'}
                        className="input" placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)}
                        style={{ paddingLeft: 36, paddingRight: 40 }}
                        required />
                      <button type="button"
                        onClick={() => setShowPass(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15, padding: 0 }}>
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>

                  {/* Remember me */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <input type="checkbox" id="remember" checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1a56db' }} />
                    <label htmlFor="remember" style={{ fontSize: 13, color: '#64748b', cursor: 'pointer', margin: 0 }}>
                      Remember me
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, fontWeight: 700, borderRadius: 10 }}
                    disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In →'}
                  </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#94a3b8' }}>
                  Don't have an account?{' '}
                  <a href="mailto:support@caclientportal.in"
                    style={{ color: '#1a56db', fontWeight: 600, textDecoration: 'none' }}>
                    Contact Admin
                  </a>
                </p>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
            {['🔒 256-bit SSL', '🏅 ISO Certified', '🇮🇳 Made in India'].map(b => (
              <span key={b} style={{ color: '#94a3b8', fontSize: 11 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 860px) {
          .login-left { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
