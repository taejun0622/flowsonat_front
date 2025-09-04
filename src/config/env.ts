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
    
    // API Configuration - 프로덕션 환경에서 안전한 기본값 보장
    apiBaseUrl: env.VITE_API_BASE_URL || 'https://api.flowsonat.com',
    
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
 * Comprehensive environment variable logging and debugging
 */
export const logEnvConfig = () => {
  const timestamp = new Date().toISOString();
  const allEnvVars = import.meta.env;
  
  console.group('🔧 Environment Configuration Debug - ' + timestamp);
  
  // Raw environment variables
  console.log('📄 Raw Environment Variables:', {
    VITE_API_BASE_URL: allEnvVars.VITE_API_BASE_URL,
    VITE_APP_VERSION: allEnvVars.VITE_APP_VERSION,
    VITE_STRIPE_PRICE_ID: allEnvVars.VITE_STRIPE_PRICE_ID ? '[REDACTED]' : 'undefined',
    VITE_STRIPE_PUBLISHABLE_KEY: allEnvVars.VITE_STRIPE_PUBLISHABLE_KEY ? '[REDACTED]' : 'undefined',
    VITE_STRIPE_PRODUCT_ID: allEnvVars.VITE_STRIPE_PRODUCT_ID ? '[REDACTED]' : 'undefined',
    MODE: allEnvVars.MODE,
    PROD: allEnvVars.PROD,
    DEV: allEnvVars.DEV,
    NODE_ENV: allEnvVars.NODE_ENV,
  });
  
  // Processed configuration
  console.log('⚙️ Processed Configuration:', {
    appVersion: envConfig.appVersion,
    mode: envConfig.mode,
    apiBaseUrl: envConfig.apiBaseUrl,
    isProduction: envConfig.isProduction,
    isDevelopment: envConfig.isDevelopment,
    stripe: {
      hasPriceId: !!envConfig.stripe.priceId,
      hasPublishableKey: !!envConfig.stripe.publishableKey,
      hasProductId: !!envConfig.stripe.productId,
    },
  });
  
  // Environment source detection
  console.log('🔍 Environment Source Analysis:', {
    isViteEnvLoaded: !!allEnvVars,
    hasVitePrefix: Object.keys(allEnvVars).filter(k => k.startsWith('VITE_')),
    currentWorkingDirectory: typeof process !== 'undefined' ? process.cwd?.() : 'N/A (browser)',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  });
  
  // Validation status
  console.log('✅ Validation Status:', {
    hasRequiredApiUrl: !!allEnvVars.VITE_API_BASE_URL,
    apiUrlValue: allEnvVars.VITE_API_BASE_URL || 'MISSING',
    fallbackUsed: !allEnvVars.VITE_API_BASE_URL && envConfig.apiBaseUrl !== allEnvVars.VITE_API_BASE_URL,
    finalApiBaseUrl: envConfig.apiBaseUrl,
    isAbsoluteUrl: envConfig.apiBaseUrl.startsWith('http'),
    isFileProtocol: envConfig.apiBaseUrl.startsWith('file://'),
  });
  
  console.groupEnd();
};

/**
 * Track environment variable changes during runtime
 */
export const trackEnvChanges = () => {
  const initialState = JSON.stringify({
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    MODE: import.meta.env.MODE,
  });
  
  // Store initial state globally for comparison
  (window as any).__initialEnvState = initialState;
  
  // Check for changes periodically (only in development)
  if (isDevelopment()) {
    setInterval(() => {
      const currentState = JSON.stringify({
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
        MODE: import.meta.env.MODE,
      });
      
      if (currentState !== (window as any).__initialEnvState) {
        console.error('🚨 ENVIRONMENT VARIABLES CHANGED DURING RUNTIME!');
        console.log('Initial:', JSON.parse((window as any).__initialEnvState));
        console.log('Current:', JSON.parse(currentState));
        (window as any).__initialEnvState = currentState;
      }
    }, 5000); // Check every 5 seconds
  }
};

/**
 * Force log environment (useful for production debugging)
 */
export const forceLogEnv = () => {
  logEnvConfig();
};

// Initialize environment tracking
trackEnvChanges();

// Log configuration (only once per session)
if (!(window as any).__envConfigLogged) {
  logEnvConfig();
  (window as any).__envConfigLogged = true;
}
