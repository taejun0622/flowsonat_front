import { isProduction, getStripePriceId, getStripePublishableKey, getStripeProductId } from '@/config/env';

// Production Stripe Price ID
const PRODUCTION_PRICE_ID = 'price_1S0mZgCVaHm33FAQxI3ZvEeD';

// Use environment variable for price ID, fallback to production ID
const getPriceId = () => {
  const envPriceId = getStripePriceId();
  const finalPriceId = envPriceId || PRODUCTION_PRICE_ID;
  
  // 디버그 로그는 한 번만 실행
  if (process.env.NODE_ENV === 'development' && !(window as any).__priceIdDebugLogged) {
    console.log('=== getPriceId Debug ===');
    console.log('Environment price ID:', envPriceId);
    console.log('Production price ID:', PRODUCTION_PRICE_ID);
    console.log('Final price ID:', finalPriceId);
    console.log('=== End getPriceId Debug ===');
    (window as any).__priceIdDebugLogged = true;
  }
  
  return finalPriceId;
};

// 캐싱된 price ID (한 번만 계산)
const CACHED_PRICE_ID = getPriceId();

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: CACHED_PRICE_ID,
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
    id: CACHED_PRICE_ID,
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
    id: CACHED_PRICE_ID,
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
  publishableKey: isProduction() 
    ? 'pk_live_51RlCpUCVaHm33FAQpKX90Lxi8sckvUrH9NJ5WrhNbJhaokWKhxzinPKd9F38BHNimiu73a3m8DoIxL1vkpJutI9S008TfcCJea'
    : getStripePublishableKey() || 'pk_test_your_test_key_here',
  productId: isProduction() 
    ? 'prod_SwfvVCI3rprIQK'
    : getStripeProductId() || 'prod_test_your_test_product_id',
  priceId: CACHED_PRICE_ID,
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
