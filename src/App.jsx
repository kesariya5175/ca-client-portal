import { useState } from 'react'
import { useAuth } from './useAuth'
import Login          from './components/Login'
import Layout         from './components/Layout'
import Dashboard      from './components/Dashboard'
import ClientsTab     from './components/ClientsTab'
import DocumentsTab   from './components/DocumentsTab'
import TasksTab       from './components/TasksTab'
import BillingTab     from './components/BillingTab'
import NoticesTab     from './components/NoticesTab'
import SettingsTab    from './components/SettingsTab'
import ClientStatusTab from './components/ClientStatusTab'
import SuperAdminPanel from './components/SuperAdminPanel'
import ClientBillingTab from './components/ClientBillingTab'

export default function App() {
  const { user, profile, loading, signIn, signOut, isClient, isSuperAdmin } = useAuth()
  const [tab, setTab] = useState(isClient ? 'my-documents' : 'dashboard')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--gray-400)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚖️</div>
          <p>Loading…</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <Login onLogin={signIn} />
  }

  // Super admin gets their own dedicated panel
  if (isSuperAdmin) {
    return (
      <Layout profile={profile} activeTab="super-admin" onTabChange={() => {}} onSignOut={signOut}>
        <SuperAdminPanel />
      </Layout>
    )
  }

  function renderTab() {
    // Client-facing tabs
    if (profile.role === 'client') {
      if (tab === 'my-documents') return <DocumentsTab profile={profile} />
      if (tab === 'my-status')    return <ClientStatusTab profile={profile} />
      if (tab === 'notices')      return <NoticesTab profile={profile} />
      if (tab === 'my-bills')     return <ClientBillingTab profile={profile} />
      return <DocumentsTab profile={profile} />
    }

    // CA / Staff tabs
    switch (tab) {
      case 'dashboard':  return <Dashboard  profile={profile} onTabChange={setTab} />
      case 'clients':    return <ClientsTab profile={profile} isAdmin={profile.role === 'admin'} />
      case 'documents':  return <DocumentsTab profile={profile} />
      case 'tasks':      return <TasksTab   profile={profile} />
      case 'billing':    return <BillingTab  profile={profile} />
      case 'notices':    return <NoticesTab  profile={profile} />
      case 'settings':   return profile.role === 'admin' ? <SettingsTab profile={profile} /> : <div className="page"><p className="text-muted">Admin only.</p></div>
      default:           return <Dashboard  profile={profile} onTabChange={setTab} />
    }
  }

  // Set default tab based on role (on first load after login)
  const defaultTab = profile.role === 'client' ? 'my-documents' : 'dashboard'
  const activeTab = tab || defaultTab

  return (
    <Layout profile={profile} activeTab={activeTab} onTabChange={setTab} onSignOut={signOut}>
      {renderTab()}
    </Layout>
  )
}
