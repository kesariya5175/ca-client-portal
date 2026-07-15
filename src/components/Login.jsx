import { useState } from 'react'
import { supabase } from '../supabaseClient'

// ── Inline logo SVG ─────────────────────────────────────────────
function CaLogo({ size = 48, dark = false }) {
  const arc = dark ? '#0f2557' : '#1e3a8a'
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <path d="M98 60 A40 40 0 1 1 84 22" stroke={arc} strokeWidth="16" strokeLinecap="round" fill="none"/>
      <rect x="60" y="16" width="32" height="40" rx="5" fill="#0d5c63"/>
      <rect x="54" y="24" width="32" height="40" rx="5" fill="#0e9280"/>
      <rect x="61" y="33" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.55)"/>
      <rect x="61" y="40" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/>
      <rect x="61" y="47" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.35)"/>
      <rect x="68" y="56" width="22" height="14" rx="3" fill={arc} opacity="0.9"/>
      <rect x="43" y="51" width="26" height="22" rx="5" fill="white"/>
      <path d="M50 51 L50 44 Q56 37 62 44 L62 51" stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
      <circle cx="56" cy="60" r="3.5" fill="#0e9280"/>
      <rect x="54.5" y="61.5" width="3" height="5" rx="1" fill="#0e9280"/>
    </svg>
  )
}

// ── Login Modal ────────────────────────────────────────────────
function LoginModal({ onLogin, onClose }) {
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
    e.preventDefault(); setError(''); setLoading(true)
    try { await onLogin(email, password) }
    catch (err) { setError(err.message || 'Login failed. Check your credentials.') }
    finally { setLoading(false) }
  }

  async function handleForgot(e) {
    e.preventDefault(); setForgotLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/?reset=true`,
    })
    setForgotLoading(false)
    if (err) { setError(err.message); return }
    setForgotSent(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,37,87,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '36px 32px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="CA Client Portal" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e3a8a' }}>CA Client Portal</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Sign in to your account</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>

        {forgotMode ? (
          forgotSent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📧</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, color: '#1e3a8a' }}>Check your email</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                Reset link sent to <strong>{forgotEmail}</strong>
              </p>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => { setForgotMode(false); setForgotSent(false); setError('') }}>
                ← Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, color: '#1e3a8a' }}>Reset Password</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>We'll email you a reset link.</p>
              {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
              <form onSubmit={handleForgot}>
                <div className="form-group">
                  <label>Email address</label>
                  <input type="email" className="input" placeholder="you@example.com"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus />
                </div>
                <button type="submit" className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: 8 }}
                  disabled={forgotLoading}>{forgotLoading ? 'Sending…' : 'Send Reset Link'}</button>
                <button type="button" className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { setForgotMode(false); setError('') }}>← Back</button>
              </form>
            </>
          )
        ) : (
          <>
            {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="m-email">Email</label>
                <input id="m-email" type="email" className="input" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>Password</label>
                  <button type="button" style={{ background: 'none', border: 'none', color: '#1a56db', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 500 }}
                    onClick={() => { setForgotMode(true); setForgotEmail(email); setError('') }}>Forgot password?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input id="m-pass" type={showPass ? 'text' : 'password'} className="input" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 40 }} required />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15, padding: 0 }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <input type="checkbox" id="m-rem" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#1a56db', cursor: 'pointer' }} />
                <label htmlFor="m-rem" style={{ fontSize: 13, color: '#64748b', cursor: 'pointer', margin: 0 }}>Remember me</label>
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, fontWeight: 700, borderRadius: 10 }}
                disabled={loading}>{loading ? 'Signing in…' : 'Sign In →'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
              New firm?{' '}
              <a href="mailto:support@caclientportal.in" style={{ color: '#1a56db', fontWeight: 600, textDecoration: 'none' }}>
                Contact us for free trial
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main landing page ──────────────────────────────────────────
export default function Login({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false)

  const NAVY  = '#0f2557'
  const GOLD  = '#c9922a'
  const TEAL  = '#0e9280'

  const services = [
    { icon: '📝', title: 'Income Tax & ITR',      desc: 'ITR filing for individuals, firms, companies. Auto document checklists.' },
    { icon: '🧾', title: 'GST Compliance',         desc: 'GSTR-1, 3B, annual returns. Track status per client per FY.' },
    { icon: '🏢', title: 'ROC & Company Law',      desc: 'Company incorporation, annual filings, DIR-3 KYC and more.' },
    { icon: '📊', title: 'Audit & Assurance',      desc: 'Statutory, internal, tax audit workflow with document management.' },
    { icon: '💰', title: 'TDS Management',         desc: 'Quarterly TDS returns, Form 16/16A generation, challan tracking.' },
    { icon: '📋', title: 'Accounting & MIS',       desc: 'Bookkeeping, finalisation of accounts, MIS reporting.' },
  ]

  const features = [
    { icon: '📁', title: 'Document Collection',  desc: 'Send document requests via email & WhatsApp. Clients upload directly — no login required.' },
    { icon: '⏰', title: 'Auto Reminders',        desc: 'Set auto-reminders per document. Stop chasing clients manually.' },
    { icon: '💼', title: 'Client Management',     desc: 'Full client profiles with services, documents, tasks and billing — all in one place.' },
    { icon: '🧾', title: 'Billing & Invoicing',   desc: 'Create invoices, track payments, send reminders. Know your unpaid amounts instantly.' },
    { icon: '✅', title: 'Task Management',       desc: 'Assign tasks to staff with due dates. Get overdue alerts automatically.' },
    { icon: '📢', title: 'Client Notices',        desc: 'Send notices and updates to clients. Keep them informed at every step.' },
  ]

  const stats = [
    { value: '40+',   label: 'CA Services Covered' },
    { value: '100%',  label: 'Secure & Multi-tenant' },
    { value: '2 min', label: 'Onboarding Time' },
    { value: '₹0',    label: 'For First 2 Months' },
  ]

  const testimonials = [
    { name: 'Rajesh Sharma', firm: 'Sharma & Associates, Delhi',    text: 'Our document collection time reduced by 70%. Clients love the WhatsApp upload links.' },
    { name: 'Priya Iyer',    firm: 'Iyer Tax Consultants, Chennai', text: 'The auto-reminders are a game changer. No more follow-up calls for documents.' },
    { name: 'Amit Gupta',    firm: 'Gupta & Co., Mumbai',           text: 'Finally a portal built for Indian CA firms. GST, ITR, ROC — everything is there.' },
  ]

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b', background: 'white' }}>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 68,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="CA Client Portal" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: NAVY, lineHeight: 1.1 }}>CA Client Portal</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Trusted · Professional · Reliable</div>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="landing-nav">
          {['Features', 'Services', 'Pricing', 'Contact'].map(n => (
            <a key={n} href={'#' + n.toLowerCase()}
              style={{ color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
              onMouseOver={e => e.target.style.color = NAVY}
              onMouseOut={e => e.target.style.color = '#475569'}>
              {n}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setShowLogin(true)}
            style={{ background: 'none', border: `1.5px solid ${NAVY}`, color: NAVY, padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Sign In
          </button>
          <button onClick={() => setShowLogin(true)}
            style={{ background: NAVY, color: 'white', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            Start Free Trial
          </button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, #f8faff 0%, #eef2ff 60%, #f0fdf4 100%)`,
        padding: '72px 5% 60px',
        display: 'flex', alignItems: 'center', gap: 48,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 380px', maxWidth: 540 }}>
          <div style={{
            display: 'inline-block', background: '#fef3c7', color: '#92400e',
            fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
            marginBottom: 18, border: '1px solid #fcd34d',
            letterSpacing: '0.03em',
          }}>
            🎉 FREE for 2 months — No credit card required
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: NAVY, lineHeight: 1.15, marginBottom: 18 }}>
            Expert Tools for<br />
            <span style={{ color: TEAL }}>Chartered Accountants</span>
          </h1>

          <div style={{ width: 56, height: 4, background: GOLD, borderRadius: 2, marginBottom: 20 }} />

          <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
            One platform for document collection, task management, client billing, and compliance tracking — built specifically for Indian CA firms.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setShowLogin(true)}
              style={{ background: NAVY, color: 'white', padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              Get Started Free →
            </button>
            <button onClick={() => setShowLogin(true)}
              style={{ background: 'white', color: NAVY, padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: `1.5px solid #cbd5e1` }}>
              📋 Book Demo
            </button>
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
            ✓ 2 months free &nbsp;·&nbsp; ✓ No setup fee &nbsp;·&nbsp; ✓ Cancel anytime
          </p>
        </div>

        {/* Hero visual */}
        <div style={{ flex: '1 1 320px', maxWidth: 520 }}>
          <div style={{ position: 'relative' }}>
            {/* Main dashboard mockup card */}
            <div style={{
              background: 'white', borderRadius: 20, padding: 24,
              boxShadow: '0 20px 60px rgba(15,37,87,0.12)', border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>Dashboard</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Sharma & Associates</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Active Clients', val: '47',  color: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
                  { label: 'Pending Docs',   val: '12',  color: '#fefce8', border: '#fef08a', text: '#a16207' },
                  { label: 'Open Tasks',     val: '8',   color: '#fef2f2', border: '#fecaca', text: '#dc2626' },
                  { label: 'Unpaid ₹',       val: '3.2L', color: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.color, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.text }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Mini pending list */}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>📁 Pending Documents</div>
              {[
                { name: 'Rahul Mehta',   doc: 'Form 16',         days: 2 },
                { name: 'Priya Singh',   doc: 'Bank Statement',  days: 5 },
                { name: 'Amit Joshi',    doc: 'Aadhaar Copy',    days: 1 },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.doc}</div>
                  </div>
                  <span style={{ background: r.days <= 2 ? '#fef2f2' : '#fefce8', color: r.days <= 2 ? '#dc2626' : '#a16207', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                    Due in {r.days}d
                  </span>
                </div>
              ))}
            </div>

            {/* Floating badge */}
            <div style={{
              position: 'absolute', top: -16, right: -16,
              background: '#16a34a', color: 'white', borderRadius: 12,
              padding: '10px 16px', boxShadow: '0 8px 24px rgba(22,163,74,0.35)',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              ✓ Document uploaded via WhatsApp
            </div>

            {/* Floating email badge */}
            <div style={{
              position: 'absolute', bottom: -16, left: -16,
              background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
              padding: '10px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              fontSize: 12, color: '#475569', whiteSpace: 'nowrap',
            }}>
              📧 Reminder sent to 3 clients
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────── */}
      <section style={{ background: NAVY, padding: '36px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: GOLD }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FREE TRIAL BANNER ──────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        padding: '40px 5%', textAlign: 'center',
        borderTop: '2px solid #fcd34d', borderBottom: '2px solid #fcd34d',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#78350f', marginBottom: 8 }}>
          2 Months Completely Free — No Strings Attached
        </h2>
        <p style={{ color: '#92400e', fontSize: 15, marginBottom: 24, maxWidth: 560, margin: '0 auto 24px' }}>
          Start managing your CA firm today. Full access to all features for 2 months.
          No credit card, no setup fee, no commitment.
        </p>
        <button onClick={() => setShowLogin(true)}
          style={{ background: NAVY, color: 'white', padding: '14px 40px', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
          Start My Free Trial →
        </button>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" style={{ padding: '72px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: NAVY, marginBottom: 10 }}>Everything Your CA Firm Needs</h2>
          <div style={{ width: 56, height: 4, background: GOLD, borderRadius: 2, margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
            From document collection to billing — manage your entire practice in one place.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'white', border: '1px solid #e2e8f0', borderRadius: 16,
              padding: '28px 24px',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(15,37,87,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────── */}
      <section id="services" style={{ background: '#f8faff', padding: '72px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: NAVY, marginBottom: 10 }}>Our Services Coverage</h2>
          <div style={{ width: 56, height: 4, background: GOLD, borderRadius: 2, margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
            Pre-built service templates with document checklists for 40+ CA services.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {services.map((s, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 14, padding: '24px 20px',
              border: '1px solid #e2e8f0', textAlign: 'center',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 14, background: '#f0f9ff',
                border: '1px solid #bae6fd', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 26, margin: '0 auto 14px',
              }}>{s.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{s.title}</h3>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section style={{ padding: '72px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: NAVY, marginBottom: 10 }}>How It Works</h2>
          <div style={{ width: 56, height: 4, background: GOLD, borderRadius: 2, margin: '0 auto' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
          {[
            { step: '01', icon: '👥', title: 'Add Your Clients',      desc: 'Import or add clients. Assign services they need.' },
            { step: '02', icon: '📋', title: 'Request Documents',     desc: 'Select service → get checklist → send to client.' },
            { step: '03', icon: '📱', title: 'Client Uploads',        desc: 'Client taps link on WhatsApp or email. Uploads directly.' },
            { step: '04', icon: '✅', title: 'Review & Complete',     desc: 'Review docs, complete tasks, raise invoices.' },
          ].map((s, i) => (
            <div key={i} style={{ flex: '1 1 200px', maxWidth: 240, textAlign: 'center', padding: '0 16px', position: 'relative' }}>
              {i < 3 && (
                <div style={{ position: 'absolute', top: 28, right: -10, fontSize: 20, color: '#cbd5e1', zIndex: 1 }}>→</div>
              )}
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: NAVY,
                color: 'white', fontSize: 22, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 14px',
              }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, marginBottom: 4, letterSpacing: '0.05em' }}>STEP {s.step}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{s.title}</h3>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section style={{ background: '#f8faff', padding: '72px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: NAVY, marginBottom: 10 }}>CA Firms Love It</h2>
          <div style={{ width: 56, height: 4, background: GOLD, borderRadius: 2, margin: '0 auto' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 16, padding: '28px 24px', border: '1px solid #e2e8f0' }}>
              <div style={{ color: GOLD, fontSize: 24, marginBottom: 12 }}>"</div>
              <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{t.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: NAVY,
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>{t.name.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.firm}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '72px 5%', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: NAVY, marginBottom: 10 }}>Simple, Transparent Pricing</h2>
        <div style={{ width: 56, height: 4, background: GOLD, borderRadius: 2, margin: '0 auto 48px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          {[
            {
              name: 'Free Trial', price: '₹0', period: 'for 2 months',
              color: '#f0fdf4', border: '#86efac', btn: '#16a34a',
              features: ['All features included', 'Unlimited clients', 'Email & WhatsApp', 'Document requests', '24/7 support'],
              badge: '🎉 Start here',
            },
            {
              name: 'Pro Plan', price: '₹999', period: 'per month after trial',
              color: '#f0f4ff', border: '#93c5fd', btn: NAVY,
              features: ['Everything in Free', 'Unlimited storage', 'Priority support', 'Custom branding', 'API access'],
              badge: '⭐ Most Popular',
            },
          ].map((p, i) => (
            <div key={i} style={{
              background: p.color, border: `2px solid ${p.border}`,
              borderRadius: 20, padding: '36px 32px', maxWidth: 320, flex: '1 1 260px',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: p.btn, color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {p.badge}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 8 }}>{p.name}</h3>
              <div style={{ fontSize: 40, fontWeight: 900, color: p.btn, marginBottom: 2 }}>{p.price}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{p.period}</div>
              <div style={{ textAlign: 'left', marginBottom: 28 }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, color: '#374151' }}>
                    <span style={{ color: p.btn, fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowLogin(true)}
                style={{ width: '100%', background: p.btn, color: 'white', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
                Get Started →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer id="contact" style={{ background: NAVY, padding: '48px 5% 32px', color: 'rgba(255,255,255,0.8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
          <div style={{ flex: '1 1 220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <img src="/logo.png" alt="CA Client Portal" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>CA Client Portal</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 240 }}>
              Partnering in your financial journey with knowledge, integrity and trust.
            </p>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ color: 'white', fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Platform</div>
            {['Features', 'Services', 'Pricing', 'Security'].map(l => (
              <div key={l} style={{ fontSize: 13, marginBottom: 8, cursor: 'pointer' }}
                onMouseOver={e => e.target.style.color = GOLD} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.8)'}>
                {l}
              </div>
            ))}
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ color: 'white', fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Contact</div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>📧 support@caclientportal.in</div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>📱 +91 81300 97489</div>
            <div style={{ fontSize: 13 }}>🇮🇳 Made in India</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12 }}>© 2026 CA Client Portal. All rights reserved.</span>
          <span style={{ fontSize: 12 }}>🔒 256-bit SSL · ISO Certified · GDPR Compliant</span>
        </div>
      </footer>

      {/* ── LOGIN MODAL ────────────────────────────────────── */}
      {showLogin && <LoginModal onLogin={onLogin} onClose={() => setShowLogin(false)} />}

      <style>{`
        @media (max-width: 640px) {
          .landing-nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}
