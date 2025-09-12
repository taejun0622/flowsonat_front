// Instagram utility functions

// Parse cookie string to object
export const parseCookies = (cookieString: string): Record<string, any> => {
  if (!cookieString) return {};
  
  const cookies: Record<string, any> = {};
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  return cookies;
};

// Check if Instagram login cookies are present
export const hasInstagramLoginCookies = (cookies: Record<string, any>): boolean => {
  return !!(cookies.ds_user_id && cookies.sessionid);
};

// Extract username from DOM (used in WebView scripts)
export const extractUsernameFromProfileImage = (): string | null => {
  try {
    const profileImages = document.querySelectorAll('img[alt*="profile picture"]');
    if (profileImages.length > 0) {
      // Use the last profile image found
      const lastProfileImage = profileImages[profileImages.length - 1];
      const alt = lastProfileImage.getAttribute('alt');
      
      if (alt && alt.includes("'s profile picture")) {
        const extractedUsername = alt.replace("'s profile picture", "");
        
        // Validate username format
        if (extractedUsername && 
            !/^\d+$/.test(extractedUsername) && 
            extractedUsername.length > 1 && 
            extractedUsername.length < 31 &&
            /^[a-zA-Z0-9._]+$/.test(extractedUsername)) {
          return extractedUsername;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract username from profile image:', error);
  }
  
  return null;
};

// Get all cookies as structured object
export const getAllCookiesStructured = (): Record<string, any> => {
  if (typeof document === 'undefined') return {};
  
  const cookies: Record<string, any> = {};
  const allCookies = document.cookie.split(';').map(cookie => {
    const parts = cookie.trim().split('=');
    return { name: parts[0], value: parts[1] || '' };
  });
  
  allCookies.forEach(cookie => {
    if (cookie.name) {
      cookies[cookie.name] = cookie.value;
    }
  });
  
  return cookies;
};

// Clear Instagram cookies (for WebView cleanup)
export const clearInstagramCookies = (): void => {
  if (typeof document === 'undefined') return;
  
  const cookiesToRemove = [
    'ds_user_id',
    'sessionid', 
    'csrftoken',
    'mid',
    'ig_did',
    'ig_nrcb',
    'ps_n',
    'rur',
    'urlgen'
  ];
  
  const domains = [window.location.hostname, '.instagram.com', 'instagram.com'];
  const paths = ['/', '/accounts', '/accounts/login', '/accounts/logout'];
  
  cookiesToRemove.forEach(cookieName => {
    domains.forEach(domain => {
      paths.forEach(path => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
      });
    });
    // Also clear without domain/path specification
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
  });
};

// Generate fresh partition name for WebView
export const generateFreshPartitionName = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `persist:ig_${timestamp}_${random}`;
};

// Validate Instagram username format
export const isValidInstagramUsername = (username: string): boolean => {
  if (!username) return false;
  
  return (
    !/^\d+$/.test(username) && 
    username.length > 1 && 
    username.length < 31 &&
    /^[a-zA-Z0-9._]+$/.test(username)
  );
};