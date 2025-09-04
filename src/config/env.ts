/**
 * Environment Configuration
 * Centralized environment variable management with validation
 * 
 * Note: VITE_APP_VERSION is automatically set from package.json version in vite.config.ts
 * and should not be manually configured in .env files.
 */

interface EnvConfig {
  // App Configuration
  appVersion: string;
  isProduction: boolean;
  isDevelopment: boolean;
  mode: string;
  
  // API Configuration
  apiBaseUrl: string;
  
  // Stripe Configuration
  stripe: {
    priceId?: string;
    publishableKey?: string;
    productId?: string;
  };
}

/**
 * Validates required environment variables
 */
function validateEnv(): void {
  const requiredVars = [
    'VITE_API_BASE_URL',
  ];

  const missingVars = requiredVars.filter(varName => {
    const value = import.meta.env[varName as keyof ImportMetaEnv];
    return !value || value.trim() === '';
  });

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Gets environment configuration with validation
 */
function getEnvConfig(): EnvConfig {
  // Validate required environment variables
  validateEnv();

  const env = import.meta.env;

  return {
    // App Configuration
    appVersion: env.VITE_APP_VERSION,
    isProduction: env.PROD,
    isDevelopment: env.DEV,
    mode: env.MODE,
    
    // API Configuration
    apiBaseUrl: env.VITE_API_BASE_URL || (isDevelopment() ? 'http://localhost:5174' : 'https://api.flowsonat.com'),
    
    // Stripe Configuration
    stripe: {
      priceId: env.VITE_STRIPE_PRICE_ID,
      publishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY,
      productId: env.VITE_STRIPE_PRODUCT_ID,
    },
  };
}

/**
 * Environment configuration instance
 * Throws error if required environment variables are missing
 */
export const envConfig = getEnvConfig();

/**
 * Utility functions for environment checks
 */
export const isProduction = () => envConfig.isProduction;
export const isDevelopment = () => envConfig.isDevelopment;
export const getApiBaseUrl = () => envConfig.apiBaseUrl;
export const getAppVersion = () => envConfig.appVersion;

/**
 * Stripe configuration helpers
 */
export const getStripeConfig = () => envConfig.stripe;
export const getStripePriceId = () => envConfig.stripe.priceId;
export const getStripePublishableKey = () => envConfig.stripe.publishableKey;
export const getStripeProductId = () => envConfig.stripe.productId;

/**
 * Development-only logging
 */
export const logEnvConfig = () => {
  if (isDevelopment()) {
    console.log('🔧 Environment Configuration:', {
      appVersion: envConfig.appVersion,
      mode: envConfig.mode,
      apiBaseUrl: envConfig.apiBaseUrl,
      isProduction: envConfig.isProduction,
      stripe: {
        hasPriceId: !!envConfig.stripe.priceId,
        hasPublishableKey: !!envConfig.stripe.publishableKey,
        hasProductId: !!envConfig.stripe.productId,
      },
    });
  }
};

// Log configuration in development
logEnvConfig();
