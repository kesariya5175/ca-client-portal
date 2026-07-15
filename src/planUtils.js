// Plan limits and feature checks

export const PLANS = {
  free: {
    name: 'Free',
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
