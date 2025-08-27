export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
  };
  usage: {
    current: number;
    limit: number;
    percentage: number;
  };
  next_payment_date: string;
}

export interface BillingInfo {
  subscription: Subscription | null;
  payment_method: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null;
  invoices: Invoice[];
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  created: string;
  due_date: string;
  pdf_url?: string;
}

export interface PaymentLinkRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}
