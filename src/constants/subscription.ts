export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'price_basic',
    name: 'Basic Plan',
    price: 999, // $9.99 in cents
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'Basic Instagram analytics',
      'Up to 100 posts per month',
      'Email support',
    ],
  },
  PRO: {
    id: 'price_pro',
    name: 'Pro Plan',
    price: 2999, // $29.99 in cents
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'Advanced Instagram analytics',
      'Unlimited posts',
      'Priority support',
      'Custom reports',
      'API access',
    ],
  },
  ENTERPRISE: {
    id: 'price_enterprise',
    name: 'Enterprise Plan',
    price: 9999, // $99.99 in cents
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'All Pro features',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
    ],
  },
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  TRIALING: 'trialing',
} as const;

export const INVOICE_STATUS = {
  PAID: 'paid',
  OPEN: 'open',
  VOID: 'void',
  UNCOLLECTIBLE: 'uncollectible',
} as const;
