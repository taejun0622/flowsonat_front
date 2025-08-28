// Environment-based Stripe configuration
const isProduction = import.meta.env.PROD;

// Production Stripe Price ID
const PRODUCTION_PRICE_ID = 'price_1S0mZgCVaHm33FAQxI3ZvEeD';

// Development Price IDs (placeholder - replace with actual test price IDs)
const DEVELOPMENT_PRICE_ID = 'price_basic'; // Replace with actual test price ID

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: isProduction ? PRODUCTION_PRICE_ID : DEVELOPMENT_PRICE_ID,
    name: 'Basic Plan',
    price: 999, // $9.99 in cents
    currency: 'USD',
    interval: 'month' as const,
    features: [
      'Follow and unfollow 500 accounts per day (CPM $7.5)',
      'Not only impression, but FOLLOW',
      'Auto-follow and unfollow',
      'Sophisticated targeting',

    ],
  },
  PRO: {
    id: isProduction ? PRODUCTION_PRICE_ID : 'price_pro',
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
    id: isProduction ? PRODUCTION_PRICE_ID : 'price_enterprise',
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

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: isProduction 
    ? 'pk_live_51RlCpUCVaHm33FAQpKX90Lxi8sckvUrH9NJ5WrhNbJhaokWKhxzinPKd9F38BHNimiu73a3m8DoIxL1vkpJutI9S008TfcCJea'
    : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_test_key_here',
  productId: isProduction 
    ? 'prod_SwfvVCI3rprIQK'
    : import.meta.env.VITE_STRIPE_PRODUCT_ID || 'prod_test_your_test_product_id',
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
