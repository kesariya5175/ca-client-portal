import { useState } from 'react'

const SUPER_NAV = [
  { key: 'firms',   label: 'Firms',   icon: '🏢' },
  { key: 'billing', label: 'Billing', icon: '💰' },
]

export default function SuperAdminLayout({ profile, activeTab, onTabChange, onSignOut, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleNav(key) {
    onTabChange(key)
    setSidebarOpen(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <button className="mobile-nav-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>

      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 220, background: '#0f172a', display: 'flex',
        flexDirection: 'column', flexShrink: 0, position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 10
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
            }}>CA</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                CA Client Portal
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>
                Super Admin
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px' }}>
          {SUPER_NAV.map(item => (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px', borderRadius: 7,
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                marginBottom: 2, transition: 'background 0.12s',
                background: activeTab === item.key ? 'rgba(99,102,241,0.5)' : 'transparent',
                color: activeTab === item.key ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 2 }}>
            {profile?.name || profile?.email}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8 }}>
            Super Admin
          </div>
          <button onClick={onSignOut} className="btn btn-ghost btn-sm" style={{
            color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)',
            fontSize: 12, width: '100%', justifyContent: 'center'
          }}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content" style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
