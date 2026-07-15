// Plan limits, feature checks, and subscription expiry

export const PLANS = {
  free: {
    name: 'Free Trial',
    maxClients: 10,
    export: false,
  },
  pro: {
    name: 'Pro',
    maxClients: Infinity,
    export: true,
  },
}

export function getPlan(firms) {
  const key = firms?.plan === 'pro' ? 'pro' : 'free'
  return { key, ...PLANS[key] }
}

export function isPro(firms) {
  return firms?.plan === 'pro'
}

// Returns days remaining until expiry. Negative = expired.
export function daysRemaining(firms) {
  if (!firms?.plan_expires_at) return null
  const diff = new Date(firms.plan_expires_at) - new Date()
  return Math.ceil(diff / 86400000)
}

// Returns expiry status
export function expiryStatus(firms) {
  const days = daysRemaining(firms)
  if (days === null) return 'no-expiry'
  if (days < 0)  return 'expired'
  if (days <= 7) return 'expiring-soon'
  return 'active'
}

export function formatExpiry(firms) {
  if (!firms?.plan_expires_at) return null
  return new Date(firms.plan_expires_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}
