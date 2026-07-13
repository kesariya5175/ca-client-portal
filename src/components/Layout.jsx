// Shared shell: sidebar nav + top bar

const CA_NAV = [
  { key: 'dashboard',  label: 'Dashboard',  icon: '📊' },
  { key: 'clients',    label: 'Clients',    icon: '👥' },
  { key: 'documents',  label: 'Documents',  icon: '📁' },
  { key: 'tasks',      label: 'Tasks',      icon: '✅' },
  { key: 'billing',    label: 'Billing',    icon: '💰' },
  { key: 'notices',    label: 'Notices',    icon: '📢' },
  { key: 'settings',   label: 'Settings',   icon: '⚙️' },
]

const CLIENT_NAV = [
  { key: 'my-documents', label: 'My Documents', icon: '📁' },
  { key: 'my-status',    label: 'My Status',    icon: '📋' },
  { key: 'notices',      label: 'Notices',      icon: '📢' },
]

export default function Layout({ profile, activeTab, onTabChange, onSignOut, children }) {
  const isClient = profile?.role === 'client'
  const nav = isClient ? CLIENT_NAV : CA_NAV

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'var(--gray-900)', display: 'flex',
        flexDirection: 'column', flexShrink: 0, position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 10
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
            }}>CA</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>
                {profile?.firms?.name || 'CA Portal'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>
                {profile?.firms?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 10px' }}>
          {nav.map(item => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px', borderRadius: 7,
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                marginBottom: 2, transition: 'background 0.12s',
                background: activeTab === item.key ? 'rgba(26,86,219,0.6)' : 'transparent',
                color: activeTab === item.key ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + sign out */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.name || profile?.email}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8, textTransform: 'capitalize' }}>
            {profile?.role}
          </div>
          <button onClick={onSignOut} className="btn btn-ghost btn-sm" style={{
            color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)',
            fontSize: 12, width: '100%', justifyContent: 'center'
          }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
