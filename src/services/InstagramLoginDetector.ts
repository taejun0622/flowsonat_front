// Instagram Login Detector - Enhanced cookie and DOM-based detection

import { extractUsernameFromProfileImage, getAllCookiesStructured, hasInstagramLoginCookies } from '@/utils/instagramUtils';

export interface LoginDetectionResult {
  isLoggedIn: boolean;
  username?: string;
  dsUserId?: string;
  sessionId?: string;
  cookies: Record<string, any>;
  rawCookies: string;
  detectionMethod: 'cookies' | 'cookies_and_dom';
  timestamp: string;
  url: string;
}

export class InstagramLoginDetector {
  
  /**
   * Detect Instagram login status from current page
   */
  static detectLoginStatus(): LoginDetectionResult {
    const url = window.location.href;
    const timestamp = new Date().toISOString();
    const rawCookies = document.cookie;
    const cookies = getAllCookiesStructured();
    
    console.log('[LoginDetector] Starting detection...', { url, cookieCount: Object.keys(cookies).length });
    
    // Check for core login cookies
    const isLoggedInByCookies = hasInstagramLoginCookies(cookies);
    const dsUserId = cookies.ds_user_id;
    const sessionId = cookies.sessionid;
    
    console.log('[LoginDetector] Cookie-based detection:', { isLoggedInByCookies, dsUserId, hasSessionId: !!sessionId });
    
    if (!isLoggedInByCookies) {
      return {
        isLoggedIn: false,
        cookies,
        rawCookies,
        detectionMethod: 'cookies',
        timestamp,
        url
      };
    }
    
    // Extract username from DOM if logged in
    let username: string | undefined;
    let detectionMethod: 'cookies' | 'cookies_and_dom' = 'cookies';
    
    try {
      username = extractUsernameFromProfileImage() || undefined;
      if (username) {
        detectionMethod = 'cookies_and_dom';
        console.log('[LoginDetector] Username extracted from DOM:', username);
      } else {
        console.log('[LoginDetector] No username found in DOM');
      }
    } catch (error) {
      console.warn('[LoginDetector] DOM username extraction failed:', error);
    }
    
    const result: LoginDetectionResult = {
      isLoggedIn: true,
      username,
      dsUserId,
      sessionId,
      cookies,
      rawCookies,
      detectionMethod,
      timestamp,
      url
    };
    
    console.log('[LoginDetector] Final result:', result);
    return result;
  }

  /**
   * Generate WebView script for periodic login detection
   */
  static getPeriodicDetectionScript(): string {
    return `
      (function() {
        try {
          // Cookie utilities
          function getCookie(name) {
            var value = ' ' + document.cookie;
            var parts = value.split(' ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
          }
          
          function getAllCookiesStructured() {
            var cookies = {};
            var allCookies = document.cookie.split(';').map(function(cookie) {
              var parts = cookie.trim().split('=');
              return { name: parts[0], value: parts[1] || '' };
            });
            
            allCookies.forEach(function(cookie) {
              if (cookie.name) {
                cookies[cookie.name] = cookie.value;
              }
            });
            
            return cookies;
          }
          
          function hasInstagramLoginCookies(cookies) {
            return !!(cookies.ds_user_id && cookies.sessionid);
          }
          
          function extractUsernameFromProfileImage() {
            try {
              var profileImages = document.querySelectorAll('img[alt*="profile picture"]');
              if (profileImages.length > 0) {
                var lastProfileImage = profileImages[profileImages.length - 1];
                var alt = lastProfileImage.getAttribute('alt');
                
                if (alt && alt.includes("'s profile picture")) {
                  var extractedUsername = alt.replace("'s profile picture", "");
                  
                  // Validate username format
                  if (extractedUsername && 
                      !/^\\d+$/.test(extractedUsername) && 
                      extractedUsername.length > 1 && 
                      extractedUsername.length < 31 &&
                      /^[a-zA-Z0-9._]+$/.test(extractedUsername)) {
                    return extractedUsername;
                  }
                }
              }
            } catch (error) {
              console.warn('DOM username extraction failed:', error);
            }
            return null;
          }
          
          // Main detection logic
          var url = window.location.href;
          var timestamp = new Date().toISOString();
          var rawCookies = document.cookie;
          var cookies = getAllCookiesStructured();
          
          var isLoggedInByCookies = hasInstagramLoginCookies(cookies);
          var dsUserId = cookies.ds_user_id;
          var sessionId = cookies.sessionid;

          async function networkFallback() {
            try {
              var res = await fetch('https://www.instagram.com/api/v1/accounts/current_user/?edit=true', { credentials: 'include' });
              if (res.status === 200) {
                var j = await res.json();
                var uname = (j && (j.user && (j.user.username || j.user.usernme))) || j.username || null;
                var uid = (j && (j.user && (j.user.pk || j.user.id))) || j.user_id || dsUserId || null;
                return {
                  ok: true,
                  username: uname,
                  dsUserId: uid ? String(uid) : null
                };
              }
            } catch (e) {}
            return { ok: false };
          }

          if (!isLoggedInByCookies) {
            // Try network-based detection when cookies are HttpOnly
            return networkFallback().then(function(nr) {
              if (nr.ok) {
                return JSON.stringify({
                  type: 'INSTAGRAM_LOGIN_SUCCESS',
                  data: {
                    isLoggedIn: true,
                    username: nr.username,
                    dsUserId: nr.dsUserId,
                    sessionId: null,
                    cookies: cookies,
                    rawCookies: rawCookies,
                    detectionMethod: 'network',
                    timestamp: timestamp,
                    url: url
                  }
                });
              }
              return JSON.stringify({
                type: 'INSTAGRAM_LOGIN_STATUS_CHECK',
                data: {
                  isLoggedIn: false,
                  cookies: cookies,
                  rawCookies: rawCookies,
                  detectionMethod: 'cookies',
                  timestamp: timestamp,
                  url: url
                }
              });
            });
          }

          // Extract username if logged in
          var username = extractUsernameFromProfileImage();
          var detectionMethod = username ? 'cookies_and_dom' : 'cookies';

          return JSON.stringify({
            type: 'INSTAGRAM_LOGIN_SUCCESS',
            data: {
              isLoggedIn: true,
              username: username,
              dsUserId: dsUserId,
              sessionId: sessionId,
              cookies: cookies,
              rawCookies: rawCookies,
              detectionMethod: detectionMethod,
              timestamp: timestamp,
              url: url
            }
          });
          
        } catch (error) {
          return JSON.stringify({
            type: 'ERROR',
            error: error.message
          });
        }
      })();
    `;
  }

  /**
   * Generate WebView script for detailed login check with debugging
   */
  static getDetailedDetectionScript(): string {
    return `
      (function() {
        try {
          console.log('=== Instagram Login Detection Debug ===');
          
          function getCookie(name) {
            var value = ' ' + document.cookie;
            var parts = value.split(' ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
          }
          
          var dsUserId = getCookie('ds_user_id');
          var sessionId = getCookie('sessionid');
          
          console.log('Core cookies:', { dsUserId: dsUserId, hasSessionId: !!sessionId });
          
          var allCookies = document.cookie.split(';').map(function(cookie) {
            var parts = cookie.trim().split('=');
            return { name: parts[0], value: parts[1] || '' };
          });
          
          var psnCookies = allCookies.filter(function(cookie) {
            return cookie.name === 'ps_n';
          });
          
          var hasPsnZero = psnCookies.some(function(cookie) {
            return cookie.value === '0';
          });
          
          console.log('ps_n validation:', { psnCookies: psnCookies, hasPsnZero: hasPsnZero });
          
          var isLoggedIn = !!(dsUserId && !hasPsnZero);
          
          console.log('Final login status:', isLoggedIn);
          
          async function networkFallbackDetailed() {
            try {
              var res = await fetch('https://www.instagram.com/api/v1/accounts/current_user/?edit=true', { credentials: 'include' });
              if (res.status === 200) {
                var j = await res.json();
                var uname = (j && (j.user && (j.user.username || j.user.usernme))) || j.username || null;
                var uid = (j && (j.user && (j.user.pk || j.user.id))) || j.user_id || dsUserId || null;
                return { ok: true, username: uname, dsUserId: uid ? String(uid) : null };
              }
            } catch (e) {}
            return { ok: false };
          }

          if (isLoggedIn) {
            var username = null;
            var profileImages = document.querySelectorAll('img[alt*="profile picture"]');
            
            if (profileImages.length > 0) {
              var lastProfileImage = profileImages[profileImages.length - 1];
              var alt = lastProfileImage.getAttribute('alt');
              
              if (alt && alt.includes("'s profile picture")) {
                var extractedUsername = alt.replace("'s profile picture", "");
                
                if (extractedUsername && 
                    !/^\\d+$/.test(extractedUsername) && 
                    extractedUsername.length > 1 && 
                    extractedUsername.length < 31 &&
                    /^[a-zA-Z0-9._]+$/.test(extractedUsername)) {
                  username = extractedUsername;
                }
              }
            }
            
            console.log('Username extraction:', username);
            
            var structuredCookies = {};
            allCookies.forEach(function(cookie) {
              if (cookie.name) {
                structuredCookies[cookie.name] = cookie.value;
              }
            });
            
            var sessionData = {
              isLoggedIn: true,
              username: username || 'instagram_user',
              dsUserId: dsUserId,
              sessionId: sessionId,
              cookies: structuredCookies,
              rawCookies: document.cookie,
              detectionMethod: username ? 'cookies_and_dom' : 'cookies',
              timestamp: new Date().toISOString(),
              url: window.location.href,
              psnCookies: psnCookies,
              hasPsnZero: hasPsnZero
            };
            
            console.log('Returning login success data:', sessionData);
            console.log('=== End Debug ===');
            
            return JSON.stringify({
              type: 'INSTAGRAM_LOGIN_SUCCESS',
              data: sessionData
            });
            
          } else {
            // Try network-based detection if cookies are HttpOnly
            return networkFallbackDetailed().then(function(nr) {
              if (nr.ok) {
                var allCookies = document.cookie.split(';').map(function(cookie) {
                  var parts = cookie.trim().split('=');
                  return { name: parts[0], value: parts[1] || '' };
                });
                var structuredCookies = {};
                allCookies.forEach(function(cookie) {
                  if (cookie.name) structuredCookies[cookie.name] = cookie.value;
                });
                var sessionData2 = {
                  isLoggedIn: true,
                  username: nr.username || 'instagram_user',
                  dsUserId: nr.dsUserId,
                  sessionId: null,
                  cookies: structuredCookies,
                  rawCookies: document.cookie,
                  detectionMethod: 'network',
                  timestamp: new Date().toISOString(),
                  url: window.location.href,
                  psnCookies: psnCookies,
                  hasPsnZero: hasPsnZero
                };
                console.log('Returning login success via network fallback:', sessionData2);
                console.log('=== End Debug ===');
                return JSON.stringify({ type: 'INSTAGRAM_LOGIN_SUCCESS', data: sessionData2 });
              }
              console.log('Not logged in - returning logout status');
              console.log('=== End Debug ===');
              return JSON.stringify({ type: 'INSTAGRAM_LOGOUT' });
            });
          }
          
        } catch (error) {
          console.error('Detection script error:', error);
          return JSON.stringify({ type: 'ERROR', error: error.message });
        }
      })();
    `;
  }

  /**
   * Process detection result from WebView
   */
  static processDetectionResult(result: string): { 
    type: 'LOGIN_SUCCESS' | 'LOGOUT_DETECTED' | 'STATUS_CHECK' | 'ERROR'; 
    data?: LoginDetectionResult; 
    error?: string 
  } {
    try {
      const parsed = JSON.parse(result);
      
      if (parsed.type === 'ERROR') {
        return { type: 'ERROR', error: parsed.error };
      }
      
      if (parsed.type === 'INSTAGRAM_LOGIN_SUCCESS') {
        return { type: 'LOGIN_SUCCESS', data: parsed.data };
      }
      
      if (parsed.type === 'INSTAGRAM_LOGIN_STATUS_CHECK') {
        const isLoggedIn = parsed.data?.isLoggedIn;
        return { 
          type: isLoggedIn ? 'STATUS_CHECK' : 'LOGOUT_DETECTED', 
          data: parsed.data 
        };
      }
      
      return { type: 'ERROR', error: 'Unknown result type' };
      
    } catch (error) {
      return { type: 'ERROR', error: `Failed to parse result: ${error}` };
    }
  }
}
