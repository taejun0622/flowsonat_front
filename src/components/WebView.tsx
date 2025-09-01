import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { InstagramWebViewScripts } from './InstagramWebViewLogic';

export interface WebViewHandle {
  reload: () => void;
  activateExtension: () => void;
  deactivateExtension: () => void;
  moveCursor: (x: number, y: number) => void;
  click: (x: number, y: number, button?: 'left' | 'right') => void;
  doubleClick: (x: number, y: number) => void;
  startDrag: (x: number, y: number) => void;
  dragMove: (x: number, y: number) => void;
  endDrag: () => void;
  scroll: (x: number, y: number, deltaX: number, deltaY: number) => void;
  scrollForemost: (deltaY: number) => Promise<boolean>;
  findScrollableAreas: () => Promise<any[]>;
  findClickableElements: () => Promise<any[]>;
  findElementByText: (text: string) => Promise<any[]>;
  findElementBySelector: (selector: string) => Promise<any[]>;
  getElementInfo: (x: number, y: number) => Promise<any>;
  takeScreenshot: () => Promise<any>;
  clickByText: (text: string) => Promise<boolean>;
  typeText: (text: string) => Promise<boolean>;
  pressEnter: () => Promise<boolean>;
  pressEscape: () => Promise<boolean>;
  clickFollowers: () => Promise<boolean>;
  clickFollowing: () => Promise<boolean>;
  clickFollowButton: () => Promise<boolean>;
  clickFollowingButton: () => Promise<boolean>;
  clickRequestedButton: () => Promise<boolean>;
  clickUnfollowButton: () => Promise<boolean>;
}

interface WebViewProps {
  src: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onInstagramLogin?: (sessionData: any) => void;
  onLoginStatusCheck?: (isLoggedIn: boolean) => void;
  className?: string;
  instagramState?: string; // Instagram 상태 추가
  enableExtension?: boolean; // 확장프로그램 활성화 여부
  disablePointerEvents?: boolean; // 사용자 물리적 입력 차단
}

export const WebView = forwardRef<WebViewHandle, WebViewProps>(({ 
  src,
  onLoad,
  onError,
  onInstagramLogin,
  onLoginStatusCheck,
  className = "",
  instagramState,
  enableExtension = false,
  disablePointerEvents = false
}, ref) => {
  const webviewRef = useRef<any>(null);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [forceReload, setForceReload] = useState(0); // 강제 리렌더링을 위한 상태
  const [extensionActive, setExtensionActive] = useState(false);
  const [isDomReady, setIsDomReady] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    // New navigation; wait for next dom-ready
    setIsDomReady(false);
  }, [src]);

  // Instagram disconnect 후 강제 리렌더링 이벤트 감지
  useEffect(() => {
    const handleForceReload = () => {
      console.log('🔄 WebView 강제 리렌더링 이벤트 감지');
      setForceReload(prev => prev + 1);
    };

    window.addEventListener('instagram-webview-force-reload', handleForceReload);
    
    return () => {
      window.removeEventListener('instagram-webview-force-reload', handleForceReload);
    };
  }, []);

  // 확장프로그램 활성화 상태 변경 감지 (Manager decides; trust enableExtension)
  useEffect(() => {
    console.log('🔍 Extension 활성화 조건 체크:', {
      enableExtension,
      instagramState,
      condition: enableExtension
    });
    
    // Enable when caller requests
    if (enableExtension) {
      console.log('✅ Extension 활성화 조건 만족 - extensionActive = true');
      setExtensionActive(true);
    } else {
      console.log('❌ Extension 활성화 조건 불만족 - extensionActive = false');
      setExtensionActive(false);
    }
  }, [enableExtension]);

  // When extensionActive toggles, send activate/deactivate to the page (only after dom-ready)
  useEffect(() => {
    console.log('🔄 Extension 상태 변경 감지:', { extensionActive });
    
    const webview = webviewRef.current;
    if (!webview || !isDomReady) {
      console.log('⚠️ WebView ref가 없음');
      return;
    }
    
    const msg = extensionActive ? 'FLOWSONAT_ACTIVATE' : 'FLOWSONAT_DEACTIVATE';
    console.log('📤 WebView에 메시지 전송:', msg);
    
    try {
      webview.executeJavaScript(`window.postMessage({ type: '${msg}' }, '*');`);
      console.log('✅ 메시지 전송 성공');
    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);
    }
  }, [extensionActive, isDomReady]);

  useImperativeHandle(ref, () => ({
    reload: () => {
      if (webviewRef.current && isDomReady) {
        webviewRef.current.reload();
      }
    },
    activateExtension: () => {
      if (webviewRef.current && isDomReady) {
        webviewRef.current.executeJavaScript(`
          window.postMessage({
            type: 'FLOWSONAT_ACTIVATE'
          }, '*');
        `);
        setExtensionActive(true);
      }
    },
    deactivateExtension: () => {
      if (webviewRef.current && isDomReady) {
        webviewRef.current.executeJavaScript(`
          window.postMessage({
            type: 'FLOWSONAT_DEACTIVATE'
          }, '*');
        `);
        setExtensionActive(false);
      }
    },
    moveCursor: (x: number, y: number) => {
      if (webviewRef.current && extensionActive && isDomReady) {
        console.log('[WebView] MOVE_CURSOR', { x, y });
        webviewRef.current.executeJavaScript(`(() => { try {
          if (window.flowsonatController) {
            window.flowsonatController.injectStyles?.();
            window.flowsonatController.activate?.();
            window.flowsonatController.moveCursor(${x}, ${y});
          } else {
            window.postMessage({ type: 'FLOWSONAT_ACTIVATE' }, '*');
            window.postMessage({ type: 'FLOWSONAT_MOVE_CURSOR', data: { x: ${x}, y: ${y} } }, '*');
          }
          return true; } catch(e){ return false; } })();`);
      }
    },
    click: (x: number, y: number, button: 'left' | 'right' = 'left') => {
      if (webviewRef.current && extensionActive && isDomReady) {
        console.log('[WebView] CLICK', { x, y, button });
        webviewRef.current.executeJavaScript(`
          window.postMessage({
            type: 'FLOWSONAT_CLICK',
            data: { x: ${x}, y: ${y}, button: '${button}' }
          }, '*');
        `);
      }
    },
    doubleClick: (x: number, y: number) => {
      if (webviewRef.current && extensionActive && isDomReady) {
        console.log('[WebView] DOUBLE_CLICK', { x, y });
        webviewRef.current.executeJavaScript(`
          window.postMessage({
            type: 'FLOWSONAT_DOUBLE_CLICK',
            data: { x: ${x}, y: ${y} }
          }, '*');
        `);
      }
    },
    startDrag: (x: number, y: number) => {
      if (webviewRef.current && extensionActive && isDomReady) {
        webviewRef.current.executeJavaScript(`
          window.postMessage({
            type: 'FLOWSONAT_DRAG_START',
            data: { x: ${x}, y: ${y} }
          }, '*');
        `);
      }
    },
    dragMove: (x: number, y: number) => {
      if (webviewRef.current && extensionActive && isDomReady) {
        webviewRef.current.executeJavaScript(`
          window.postMessage({
            type: 'FLOWSONAT_DRAG_MOVE',
            data: { x: ${x}, y: ${y} }
          }, '*');
        `);
      }
    },
    endDrag: () => {
      if (webviewRef.current && extensionActive && isDomReady) {
        webviewRef.current.executeJavaScript(`
          window.postMessage({
            type: 'FLOWSONAT_DRAG_END'
          }, '*');
        `);
      }
    },
    scroll: (x: number, y: number, deltaX: number, deltaY: number) => {
      if (webviewRef.current && extensionActive && isDomReady) {
        console.log('[WebView] SCROLL', { x, y, deltaX, deltaY });
        webviewRef.current.executeJavaScript(`(() => { try {
          if (window.flowsonatController) {
            window.flowsonatController.injectStyles?.();
            window.flowsonatController.activate?.();
            window.flowsonatController.moveCursor(${x}, ${y});
            const el = document.elementFromPoint(${x}, ${y});
            if (el) el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: ${deltaX||0}, deltaY: ${deltaY||0}, clientX: ${x}, clientY: ${y} }));
          } else {
            window.postMessage({ type: 'FLOWSONAT_ACTIVATE' }, '*');
            window.postMessage({ type: 'FLOWSONAT_SCROLL', data: { x: ${x}, y: ${y}, deltaX: ${deltaX}, deltaY: ${deltaY} } }, '*');
          }
          return true; } catch(e){ return false; } })();`);
      }
    },
    findScrollableAreas: async () => {
      if (webviewRef.current && extensionActive && isDomReady) {
        const js = `(() => {
          try {
            if (!window.flowsonatController || !window.flowsonatController.findScrollableAreas) return '[]';
            const areas = window.flowsonatController.findScrollableAreas() || [];
            const safe = areas.map(a => ({
              selector: a.selector || null,
              rect: a.rect ? { left: a.rect.left, top: a.rect.top, width: a.rect.width, height: a.rect.height } : null,
              zIndex: (typeof a.zIndex === 'number' ? a.zIndex : 0),
              visible: !!a.visible,
              order: (typeof a.order === 'number' ? a.order : 0),
              centerX: typeof a.centerX === 'number' ? a.centerX : (a.rect ? (a.rect.left + a.rect.width/2) : 0),
              centerY: typeof a.centerY === 'number' ? a.centerY : (a.rect ? (a.rect.top + a.rect.height/2) : 0)
            }));
            return JSON.stringify(safe);
          } catch (e) { return '[]'; }
        })();`;
        console.log('[WebView] FIND_SCROLLABLE_AREAS');
        const res = await webviewRef.current.executeJavaScript(js);
        try { const parsed = JSON.parse(res); console.log('[WebView] FIND_SCROLLABLE_AREAS result', parsed?.length); return parsed; } catch { return []; }
      }
      return [];
    },
    findClickableElements: async () => {
      if (webviewRef.current && extensionActive && isDomReady) {
        const js = `(() => {
          try {
            if (!window.flowsonatController || !window.flowsonatController.findClickableElements) return '[]';
            const els = window.flowsonatController.findClickableElements() || [];
            const safe = els.map(e => ({
              selector: e.selector || null,
              text: e.text || '',
              type: e.type || null,
              rect: e.rect ? { left: e.rect.left, top: e.rect.top, width: e.rect.width, height: e.rect.height } : null
            }));
            return JSON.stringify(safe);
          } catch (e) { return '[]'; }
        })();`;
        console.log('[WebView] FIND_CLICKABLE_ELEMENTS');
        const res = await webviewRef.current.executeJavaScript(js);
        try { const parsed = JSON.parse(res); console.log('[WebView] FIND_CLICKABLE_ELEMENTS result', parsed?.length); return parsed; } catch { return []; }
      }
      return [];
    },
    findElementByText: async (text: string) => {
      if (webviewRef.current && extensionActive && isDomReady) {
        const encoded = JSON.stringify(text);
        const js = `(() => {
          try {
            if (!window.flowsonatController || !window.flowsonatController.findElementByText) return '[]';
            const els = window.flowsonatController.findElementByText(${encoded}) || [];
            const safe = els.map(e => ({
              selector: e.selector || null,
              text: e.text || '',
              rect: e.rect ? { left: e.rect.left, top: e.rect.top, width: e.rect.width, height: e.rect.height } : null
            }));
            return JSON.stringify(safe);
          } catch (e) { return '[]'; }
        })();`;
        console.log('[WebView] FIND_ELEMENT_BY_TEXT', { text });
        const res = await webviewRef.current.executeJavaScript(js);
        try { const parsed = JSON.parse(res); console.log('[WebView] FIND_ELEMENT_BY_TEXT result', parsed?.length); return parsed; } catch { return []; }
      }
      return [];
    },
    findElementBySelector: async (selector: string) => {
      if (webviewRef.current && extensionActive && isDomReady) {
        const encoded = JSON.stringify(selector);
        const js = `(() => {
          try {
            if (!window.flowsonatController || !window.flowsonatController.findElementBySelector) return '[]';
            const els = window.flowsonatController.findElementBySelector(${encoded}) || [];
            const safe = els.map(e => ({
              selector: e.selector || null,
              text: e.text || '',
              rect: e.rect ? { left: e.rect.left, top: e.rect.top, width: e.rect.width, height: e.rect.height } : null
            }));
            return JSON.stringify(safe);
          } catch (e) { return '[]'; }
        })();`;
        console.log('[WebView] FIND_ELEMENT_BY_SELECTOR', { selector });
        const res = await webviewRef.current.executeJavaScript(js);
        try { const parsed = JSON.parse(res); console.log('[WebView] FIND_ELEMENT_BY_SELECTOR result', parsed?.length); return parsed; } catch { return []; }
      }
      return [];
    },
    scrollForemost: async (deltaY: number) => {
      if (webviewRef.current && extensionActive && isDomReady) {
        const js = `(() => {
          try {
            const delta = ${deltaY};
            // 1) Find the foremost scrollable ancestor along the visual stack at viewport center
            const cx = Math.floor(window.innerWidth / 2);
            const cy = Math.floor(window.innerHeight / 2);
            const stack = document.elementsFromPoint ? document.elementsFromPoint(cx, cy) : [];
            const isScrollable = (el) => {
              try {
                const cs = getComputedStyle(el);
                const ov = cs.overflow + ' ' + cs.overflowX + ' ' + cs.overflowY;
                if (!(ov.includes('auto') || ov.includes('scroll'))) return false;
                if (cs.pointerEvents === 'none' || cs.visibility === 'hidden' || cs.display === 'none') return false;
                return (el.scrollHeight > el.clientHeight + 1);
            } catch (e) { return false; }
            };
            let targetEl = null;
            for (const topEl of stack) {
              let cur = topEl;
              while (cur && cur !== document.body) {
                if (isScrollable(cur)) { targetEl = cur; break; }
                cur = cur.parentElement;
              }
              if (targetEl) break;
            }
            // 2) Fallback: choose best from all scrollables by zIndex/area if none under center
            if (!targetEl) {
              const all = Array.from(document.querySelectorAll('*'));
              let best = null;
              for (const el of all) {
                if (!isScrollable(el)) continue;
                const r = el.getBoundingClientRect();
                const cs = getComputedStyle(el);
                let zi = parseInt(cs.zIndex); if (isNaN(zi)) zi = 0;
                const area = r.width * r.height;
                if (!best || zi > best.zi || (zi === best.zi && area > best.area)) {
                  best = { el, r, zi, area };
                }
              }
              if (best) targetEl = best.el;
            }
            if (!targetEl) { window.scrollBy(0, delta); return true; }
            const r = targetEl.getBoundingClientRect();
            const px = r.left + r.width/2;
            const py = r.top + r.height/2;
            if (window.flowsonatController) { window.flowsonatController.moveCursor(px, py); }
            try { targetEl.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: delta, clientX: px, clientY: py })); } catch (e) {}
            try { targetEl.scrollTop += delta; } catch (e) {}
            return true;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] SCROLL_FOREMOST', { deltaY });
        await webviewRef.current.executeJavaScript(`try { window.postMessage({ type: 'FLOWSONAT_ACTIVATE' }, '*'); } catch {}`);
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    getElementInfo: async (x: number, y: number) => {
      if (webviewRef.current && extensionActive && isDomReady) {
        const js = `(() => {
          try {
            if (!window.flowsonatController || !window.flowsonatController.getElementInfo) return 'null';
            const info = window.flowsonatController.getElementInfo(${x}, ${y});
            if (!info) return 'null';
            const safe = {
              tagName: info.tagName,
              className: info.className,
              id: info.id,
              text: info.text,
              selector: info.selector,
              rect: info.rect ? { left: info.rect.left, top: info.rect.top, width: info.rect.width, height: info.rect.height } : null,
              isClickable: !!info.isClickable,
              isScrollable: !!info.isScrollable,
              attributes: info.attributes || {}
            };
            return JSON.stringify(safe);
          } catch (e) { return 'null'; }
        })();`;
        console.log('[WebView] GET_ELEMENT_INFO', { x, y });
        const res = await webviewRef.current.executeJavaScript(js);
        try { const parsed = JSON.parse(res); console.log('[WebView] GET_ELEMENT_INFO result', parsed); return parsed; } catch { return null; }
      }
      return null;
    },
    takeScreenshot: async () => {
      if (webviewRef.current && extensionActive && isDomReady) {
        const js = `(() => {
          try {
            if (!window.flowsonatController || !window.flowsonatController.takeScreenshot) {
              return JSON.stringify({ width: window.innerWidth, height: window.innerHeight, scrollX: window.scrollX, scrollY: window.scrollY, url: window.location.href });
            }
            const data = window.flowsonatController.takeScreenshot();
            return JSON.stringify(data);
          } catch (e) {
            return JSON.stringify({ width: window.innerWidth, height: window.innerHeight, scrollX: window.scrollX, scrollY: window.scrollY, url: window.location.href });
          }
        })();`;
        console.log('[WebView] TAKE_SCREENSHOT');
        const res = await webviewRef.current.executeJavaScript(js);
        try { const parsed = JSON.parse(res); console.log('[WebView] TAKE_SCREENSHOT result', parsed); return parsed; } catch { return null; }
      }
      return null;
    },
    clickByText: async (text: string) => {
      if (webviewRef.current && extensionActive) {
        const encoded = JSON.stringify(text);
        const js = `(() => {
          try {
            const matchText = (el) => (el.innerText || el.textContent || '').trim();
            const target = ${encoded}.toLowerCase();
            const candidates = Array.from(document.querySelectorAll('button, [role="button"], a, div, span'));
            const found = candidates.find(el => {
              const t = matchText(el).toLowerCase();
              if (!t) return false;
              return t === target || t.includes(target);
            });
            if (found) { found.click(); return true; }
            return false;
          } catch (e) { return false; }
        })();`;
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    typeText: async (text: string) => {
      if (webviewRef.current && extensionActive) {
        const encoded = JSON.stringify(text);
        const js = `(() => {
          try {
            const el = document.activeElement;
            if (!el) return false;
            const isInput = ['INPUT','TEXTAREA'].includes(el.tagName) || el.isContentEditable;
            if (!isInput) return false;
            if (el.isContentEditable) {
              el.textContent = (el.textContent || '') + ${encoded};
            } else {
              const v = (el.value || '') + ${encoded};
              el.value = v;
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] TYPE_TEXT');
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    pressEnter: async () => {
      if (webviewRef.current && extensionActive) {
        const js = `(() => {
          try {
            const el = document.activeElement;
            if (!el) return false;
            const ev = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
            el.dispatchEvent(ev);
            const evUp = new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
            el.dispatchEvent(evUp);
            return true;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] PRESS_ENTER');
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    pressEscape: async () => {
      if (webviewRef.current && extensionActive) {
        const js = `(() => {
          try {
            const el = document.activeElement || document.body;
            const ev = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true });
            el.dispatchEvent(ev);
            const evUp = new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true });
            el.dispatchEvent(evUp);
            return true;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] PRESS_ESCAPE');
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    clickFollowers: async () => {
      if (webviewRef.current && extensionActive) {
        const js = `(() => {
          try {
            const byHref = document.querySelector('a[href$="/followers/"]') || document.querySelector('a[href*="followers"]');
            if (byHref) { byHref.click(); return true; }
            const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], div, span'));
            const found = candidates.find(el => ((el.innerText||el.textContent||'').toLowerCase().includes('followers')));
            if (found) { found.click(); return true; }
            return false;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] CLICK_FOLLOWERS');
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    clickFollowing: async () => {
      if (webviewRef.current && extensionActive) {
        const js = `(() => {
          try {
            const byHref = document.querySelector('a[href$="/following/"]') || document.querySelector('a[href*="following"]');
            if (byHref) { byHref.click(); return true; }
            const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], div, span'));
            const found = candidates.find(el => ((el.innerText||el.textContent||'').toLowerCase().includes('following')));
            if (found) { found.click(); return true; }
            return false;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] CLICK_FOLLOWING');
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    clickFollowButton: async () => {
      if (webviewRef.current && extensionActive) {
        const js = `(() => {
          try {
            const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
            const found = candidates.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === 'follow');
            if (found) { found.click(); return true; }
            return false;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] CLICK_FOLLOW_BUTTON');
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    clickFollowingButton: async () => {
      if (webviewRef.current && extensionActive) {
        const js = `(() => {
          try {
            const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
            const found = candidates.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === 'following');
            if (found) { found.click(); return true; }
            return false;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] CLICK_FOLLOWING_BUTTON');
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    clickRequestedButton: async () => {
      if (webviewRef.current && extensionActive) {
        const js = `(() => {
          try {
            const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
            const found = candidates.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === 'requested');
            if (found) { found.click(); return true; }
            return false;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] CLICK_REQUESTED_BUTTON');
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    },
    clickUnfollowButton: async () => {
      if (webviewRef.current && extensionActive) {
        const js = `(() => {
          try {
            // Instagram shows a confirmation dialog. This will click the first "Unfollow" button.
            const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
            const found = candidates.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === 'unfollow');
            if (found) { found.click(); return true; }
            return false;
          } catch (e) { return false; }
        })();`;
        console.log('[WebView] CLICK_UNFOLLOW_BUTTON');
        const res = await webviewRef.current.executeJavaScript(js);
        return !!res;
      }
      return false;
    }
  }));

  // 주기적으로 Instagram 로그인 상태 확인 (로그아웃 + 서버 미등록 상태에서만)
  useEffect(() => {
    if (!webviewRef.current || !src.includes('instagram.com')) return;
    
    // instagram_logged_out_server_unregistered 상태에서만 주기적 체크 실행
    if (instagramState !== 'instagram_logged_out_server_unregistered') {
      console.log('Periodic check skipped - not in unregistered state:', instagramState);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastCheckTime < 3000) return; // 3초마다 체크
      
      setLastCheckTime(now);
      
      webviewRef.current.executeJavaScript(InstagramWebViewScripts.getPeriodicCheckScript()).then((result: string) => {
        try {
          const data = JSON.parse(result);
          console.log('Periodic check result:', data);
          
          if (data.type === 'INSTAGRAM_LOGIN_SUCCESS') {
            console.log('Instagram login detected via periodic check:', data.data);
            onInstagramLogin?.(data.data);
          } else if (data.type === 'INSTAGRAM_LOGIN_STATUS_CHECK') {
            console.log('Instagram login status check via periodic check:', data.data);
            onLoginStatusCheck?.(data.data.isLoggedIn);
          }
        } catch (error) {
          console.error('Error parsing periodic check result:', error);
        }
      }).catch((error: any) => {
        console.error('Error in periodic check:', error);
      });
    }, 5000); // 5초로 늘림

    return () => clearInterval(interval);
  }, [src, lastCheckTime, onInstagramLogin, onLoginStatusCheck, instagramState]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    const handleError = (event: any) => {
      setIsLoading(false);
      setHasError(true);
      onError?.(event);
    };

  const handleDomReady = () => {
      setIsLoading(false);
      setIsDomReady(true);
      
      // Instagram 페이지인지 확인
      const isInstagram = src.includes('instagram.com');
      
      if (isInstagram && (onInstagramLogin || onLoginStatusCheck)) {
        // Instagram은 동적으로 콘텐츠를 로드하므로 지연 후 실행
        setTimeout(() => {
          webview.executeJavaScript(InstagramWebViewScripts.getDetailedLoginCheckScript());
        }, 2000); // 2초 지연
      }
      
      // Instagram 로그인 페이지에서 강제 리렌더링 트리거
      if (isInstagram && src.includes('/accounts/login/')) {
        setTimeout(() => {
          setForceReload(prev => prev + 1);
        }, 1000);
      }

      // 확장프로그램이 활성화되어 있고 Instagram 페이지라면 확장프로그램 활성화
      console.log('🔍 Extension 컨텐츠 스크립트 주입 조건 체크:', {
        isInstagram,
        extensionActive,
        instagramState,
        condition: isInstagram && extensionActive
      });
      
      if (isInstagram && extensionActive) {
        console.log('✅ Extension 컨텐츠 스크립트 주입 시작');
        setTimeout(() => {
          console.log('📥 Extension 컨텐츠 스크립트 주입 중...');
          webview.executeJavaScript(`
            // 확장프로그램 컨텐츠 스크립트 주입
            if (!window.flowsonatController) {
              ${getExtensionContentScript()}
            }
            console.log('[Injected] window.flowsonatController exists?', !!window.flowsonatController);
            try {
              if (window.flowsonatController) {
                if (window.flowsonatController.injectStyles) window.flowsonatController.injectStyles();
                if (window.flowsonatController.activate) window.flowsonatController.activate();
                window.flowsonatController.moveCursor(Math.floor(window.innerWidth/2), Math.floor(window.innerHeight/2));
              }
            } catch (e) {}
          `);
          // Ensure controller is activated after injection
          setTimeout(() => {
            console.log('🚀 Extension 컨트롤러 활성화 중...');
            try { window.postMessage({ type: 'FLOWSONAT_ACTIVATE' }, '*'); } catch {}
            try { webview.executeJavaScript(`window.postMessage({ type: 'FLOWSONAT_ACTIVATE' }, '*');`); } catch {}
            console.log('✅ Extension 컨트롤러 활성화 완료');
          }, 200);
        }, 1000);
      } else {
        console.log('❌ Extension 컨텐츠 스크립트 주입 조건 불만족');
      }
    };

    const handleMessage = (event: any) => {
      console.log('WebView message received:', event);
      
      if (event.data && event.data.type === 'INSTAGRAM_LOGIN_SUCCESS') {
        console.log('Instagram login detected:', event.data.data);
        onInstagramLogin?.(event.data.data);
      } else if (event.data && event.data.type === 'INSTAGRAM_LOGIN_STATUS_CHECK') {
        console.log('Instagram login status check:', event.data.data);
        onLoginStatusCheck?.(event.data.data.isLoggedIn);
      }
    };

    // URL-based login detection as requested: if it redirects away from /accounts/login -> logged in
    const handleDidNavigate = (e: any) => {
      try {
        const url: string = e?.url || webview.getURL?.() || '';
        const isInstagramHost = url.includes('instagram.com');
        const onLoginPage = /instagram\.com\/accounts\/login/.test(url);
        if (isInstagramHost) {
          const inferredLoggedIn = !onLoginPage;
          console.log('🔎 URL-based status:', { url, inferredLoggedIn });
          onLoginStatusCheck?.(inferredLoggedIn);
        }
      } catch {}
    };

    webview.addEventListener('did-finish-load', handleLoad);
    webview.addEventListener('did-fail-load', handleError);
    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('did-navigate', handleDidNavigate as any);
    webview.addEventListener('did-navigate-in-page', handleDidNavigate as any);
    window.addEventListener('message', handleMessage);

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad);
      webview.removeEventListener('did-fail-load', handleError);
      webview.removeEventListener('dom-ready', handleDomReady);
      webview.removeEventListener('did-navigate', handleDidNavigate as any);
      webview.removeEventListener('did-navigate-in-page', handleDidNavigate as any);
      window.removeEventListener('message', handleMessage);
    };
  }, [onLoad, onError, onInstagramLogin, onLoginStatusCheck, src, extensionActive, instagramState]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-10">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">Failed to load content</p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {extensionActive && (
        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium z-20">
          🎮 Extension Active
        </div>
      )}
      
      <webview
        ref={webviewRef}
        src={currentSrc}
        className="w-full h-full"
        partition="persist:ig"
        webpreferences="contextIsolation=yes, nodeIntegration=no"
        allowpopups={true}
        security="true"
        style={{ pointerEvents: disablePointerEvents ? 'none' as const : 'auto' as const }}
        key={`webview-${forceReload}`} // 강제 리렌더링을 위한 key
      />
    </div>
  );
});

// 확장프로그램 컨텐츠 스크립트를 문자열로 반환하는 함수
  function getExtensionContentScript(): string {
    return `
      // FlowSonat Instagram Controller - Injected Content Script
      class FlowSonatController {
        constructor() {
        this.isActive = false;
        this.cursor = null;
        this.overlay = null;
        this.statusIndicator = null;
        this.currentPosition = { x: 0, y: 0 };
        this.isClicking = false;
        this.isDragging = false;
        this.dragStart = null;
        this.scrollableAreas = [];
        this.clickableElements = [];
        
        this.init();
      }

      init() {
        console.log('🚀 FlowSonat Instagram Controller initialized');
        this.createCursor();
        this.createOverlay();
        this.createStatusIndicator();
          this.setupMessageListener();
          this.scanPage();
        }

        injectStyles() {
          try {
            if (document.getElementById('flowsonat-style')) return;
            const style = document.createElement('style');
            style.id = 'flowsonat-style';
            style.textContent = \`
              .flowsonat-cursor { position: fixed; width: 24px; height: 24px; pointer-events: none; z-index: 2147483646; transform: translate(-50%, -50%); transition: all 0.1s ease-out; }
              .flowsonat-cursor.clicking { transform: translate(-50%, -50%) scale(0.9); }
              .flowsonat-overlay { position: fixed; top:0; left:0; width:100vw; height:100vh; background: transparent; z-index: 2147483645; pointer-events: none; }
              .flowsonat-scrollable-indicator { position: absolute; border: 2px solid #667eea; background: rgba(102,126,234,0.1); border-radius: 8px; pointer-events:none; z-index:2147483644; }
              .flowsonat-clickable-indicator { position: absolute; border: 2px solid #10b981; background: rgba(16,185,129,0.1); border-radius:4px; pointer-events:none; z-index:2147483643; }
              .flowsonat-status { position: fixed; top: 20px; right: 20px; background: rgba(0,0,0,0.8); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; z-index:2147483647; pointer-events:none; }
            \`;
            document.head.appendChild(style);
          } catch {}
        }

      createCursor() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'flowsonat-cursor';
        this.cursor.innerHTML = \`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" fill="url(#glow)" opacity="0.3"/>
            <path d="M12 2L20 12L12 22L4 12L12 2Z" fill="url(#gradient)" stroke="white" stroke-width="1.5"/>
            <path d="M12 4L18 12L12 20L6 12L12 4Z" fill="url(#highlight)" opacity="0.7"/>
            <circle cx="12" cy="12" r="2" fill="white"/>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
              </linearGradient>
              <linearGradient id="highlight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.2" />
              </linearGradient>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#667eea;stop-opacity:0" />
              </radialGradient>
            </defs>
          </svg>
        \`;
        document.body.appendChild(this.cursor);
      }

      createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'flowsonat-overlay';
        this.overlay.style.display = 'none';
        // Ensure overlay never intercepts hit-testing so elementFromPoint finds real targets
        this.overlay.style.pointerEvents = 'none';
        document.body.appendChild(this.overlay);
      }

      createStatusIndicator() {
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'flowsonat-status';
        this.statusIndicator.textContent = 'FlowSonat Controller Ready';
        document.body.appendChild(this.statusIndicator);
      }

      setupMessageListener() {
        window.addEventListener('message', (event) => {
          if (event.source !== window) return;
          
          const { type, data } = event.data;
          
          switch (type) {
            case 'FLOWSONAT_ACTIVATE':
              this.activate();
              break;
            case 'FLOWSONAT_DEACTIVATE':
              this.deactivate();
              break;
            case 'FLOWSONAT_MOVE_CURSOR':
              this.moveCursor(data.x, data.y);
              break;
            case 'FLOWSONAT_CLICK':
              this.click(data.x, data.y, data.button || 'left');
              break;
            case 'FLOWSONAT_DOUBLE_CLICK':
              this.doubleClick(data.x, data.y);
              break;
            case 'FLOWSONAT_RIGHT_CLICK':
              this.rightClick(data.x, data.y);
              break;
            case 'FLOWSONAT_DRAG_START':
              this.startDrag(data.x, data.y);
              break;
            case 'FLOWSONAT_DRAG_MOVE':
              this.dragMove(data.x, data.y);
              break;
            case 'FLOWSONAT_DRAG_END':
              this.endDrag();
              break;
            case 'FLOWSONAT_SCROLL':
              this.scroll(data.x, data.y, data.deltaX, data.deltaY);
              break;
            case 'FLOWSONAT_FIND_SCROLLABLE_AREAS':
              this.findScrollableAreas();
              break;
            case 'FLOWSONAT_FIND_CLICKABLE_ELEMENTS':
              this.findClickableElements();
              break;
            case 'FLOWSONAT_FIND_ELEMENT_BY_TEXT':
              this.findElementByText(data.text);
              break;
            case 'FLOWSONAT_FIND_ELEMENT_BY_SELECTOR':
              this.findElementBySelector(data.selector);
              break;
            case 'FLOWSONAT_GET_ELEMENT_INFO':
              this.getElementInfo(data.x, data.y);
              break;
            case 'FLOWSONAT_TAKE_SCREENSHOT':
              this.takeScreenshot();
              break;
          }
        });
      }

        activate() {
          this.isActive = true;
          this.overlay.style.display = 'block';
          document.body.classList.add('flowsonat-overlay-active');
          this.cursor.style.display = 'block';
          this.updateStatus('Controller Active');
          console.log('✅ FlowSonat Controller activated');
        }

      deactivate() {
        this.isActive = false;
        this.overlay.style.display = 'none';
        document.body.classList.remove('flowsonat-overlay-active');
        this.cursor.style.display = 'none';
        this.updateStatus('Controller Inactive');
        console.log('❌ FlowSonat Controller deactivated');
      }

      moveCursor(x, y) {
        if (!this.isActive) return;
        
        this.currentPosition = { x, y };
        this.cursor.style.left = \`\${x}px\`;
        this.cursor.style.top = \`\${y}px\`;
        
        // Check if hovering over clickable element
        const element = document.elementFromPoint(x, y);
        if (element && this.isClickable(element)) {
          this.cursor.classList.add('hovering');
        } else {
          this.cursor.classList.remove('hovering');
        }
      }

      click(x, y, button = 'left') {
        if (!this.isActive) return;
        
        this.moveCursor(x, y);
        this.cursor.classList.add('clicking');
        
        const element = document.elementFromPoint(x, y);
        if (element) {
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: button === 'right' ? 2 : 0,
            buttons: button === 'right' ? 2 : 1,
            clientX: x,
            clientY: y
          });
          
          element.dispatchEvent(event);
        }
        
        setTimeout(() => {
          this.cursor.classList.remove('clicking');
        }, 150);
      }

      doubleClick(x, y) {
        if (!this.isActive) return;
        
        this.moveCursor(x, y);
        this.cursor.classList.add('clicking');
        
        const element = document.elementFromPoint(x, y);
        if (element) {
          const event = new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y
          });
          
          element.dispatchEvent(event);
        }
        
        setTimeout(() => {
          this.cursor.classList.remove('clicking');
        }, 150);
      }

      rightClick(x, y) {
        this.click(x, y, 'right');
      }

      startDrag(x, y) {
        if (!this.isActive) return;
        
        this.isDragging = true;
        this.dragStart = { x, y };
        this.cursor.classList.add('clicking');
      }

      dragMove(x, y) {
        if (!this.isActive || !this.isDragging) return;
        
        this.moveCursor(x, y);
        
        const element = document.elementFromPoint(x, y);
        if (element) {
          const event = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            buttons: 1
          });
          
          element.dispatchEvent(event);
        }
      }

      endDrag() {
        if (!this.isActive) return;
        
        this.isDragging = false;
        this.dragStart = null;
        this.cursor.classList.remove('clicking');
      }

      scroll(x, y, deltaX, deltaY) {
        if (!this.isActive) return;
        
        this.moveCursor(x, y);
        
        const element = document.elementFromPoint(x, y);
        if (element) {
          const event = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            view: window,
            deltaX: deltaX || 0,
            deltaY: deltaY || 0,
            clientX: x,
            clientY: y
          });
          
          element.dispatchEvent(event);
        }
      }

      findScrollableAreas() {
        const scrollableElements = [];
        let order = 0;
        // Find elements with overflow scroll
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
          const style = window.getComputedStyle(element);
          const ov = style.overflow + ' ' + style.overflowX + ' ' + style.overflowY;
          if (ov.includes('scroll') || ov.includes('auto')) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const ziRaw = style.zIndex;
              const zIndex = Number.isNaN(parseInt(ziRaw)) ? 0 : parseInt(ziRaw);
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const visible = style.visibility !== 'hidden' && style.display !== 'none';
              scrollableElements.push({
                element: element,
                rect: rect,
                selector: this.getElementSelector(element),
                zIndex: zIndex,
                visible: visible,
                order: order++,
                centerX,
                centerY
              });
            }
          }
        });
        this.scrollableAreas = scrollableElements;
        return scrollableElements;
      }

      findClickableElements() {
        const clickableElements = [];
        
        // Find buttons, links, and other clickable elements
        const selectors = [
          'button', 'a', 'input[type="button"]', 'input[type="submit"]',
          '[role="button"]', '[onclick]', '[data-testid*="button"]',
          '[class*="btn"]', '[class*="button"]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (this.isClickable(element)) {
              const rect = element.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                clickableElements.push({
                  element: element,
                  rect: rect,
                  selector: this.getElementSelector(element),
                  text: element.textContent?.trim() || '',
                  type: element.tagName.toLowerCase()
                });
              }
            }
          });
        });
        this.clickableElements = clickableElements;
        // Removed visual highlighting of structure
        return clickableElements;
      }

      findElementByText(text) {
        const elements = document.querySelectorAll('*');
        const matches = [];
        
        elements.forEach(element => {
          if (element.textContent?.includes(text)) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              matches.push({
                element: element,
                rect: rect,
                selector: this.getElementSelector(element),
                text: element.textContent?.trim() || ''
              });
            }
          }
        });
        
        return matches;
      }

      findElementBySelector(selector) {
        const elements = document.querySelectorAll(selector);
        const matches = [];
        
        elements.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            matches.push({
              element: element,
              rect: rect,
              selector: this.getElementSelector(element),
              text: element.textContent?.trim() || ''
            });
          }
        });
        
        return matches;
      }

      getElementInfo(x, y) {
        const element = document.elementFromPoint(x, y);
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          text: element.textContent?.trim() || '',
          selector: this.getElementSelector(element),
          rect: rect,
          isClickable: this.isClickable(element),
          isScrollable: style.overflow === 'scroll' || style.overflow === 'auto',
          attributes: this.getElementAttributes(element)
        };
      }

      takeScreenshot() {
        // This would require additional permissions and implementation
        // For now, return the current viewport info
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          url: window.location.href
        };
      }

      // Helper methods
      isClickable(element) {
        const style = window.getComputedStyle(element);
        return style.pointerEvents !== 'none' && 
               style.cursor !== 'default' &&
               element.offsetWidth > 0 &&
               element.offsetHeight > 0;
      }

      getElementSelector(element) {
        if (element.id) {
          return \`#\${element.id}\`;
        }
        
        if (element.className) {
          const classes = element.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) {
            return \`\${element.tagName.toLowerCase()}.\${classes.join('.')}\`;
          }
        }
        
        return element.tagName.toLowerCase();
      }

      getElementAttributes(element) {
        const attributes = {};
        for (let attr of element.attributes) {
          attributes[attr.name] = attr.value;
        }
        return attributes;
      }

      // No-op highlighting to keep API compatibility but hide visuals
      highlightScrollableAreas() {}
      highlightClickableElements() {}

      updateStatus(message) {
        this.statusIndicator.textContent = message;
        this.statusIndicator.classList.remove('hidden');
        
        setTimeout(() => {
          this.statusIndicator.classList.add('hidden');
        }, 3000);
      }

      scanPage() {
        // Initial scan for scrollable and clickable elements
        setTimeout(() => {
          this.findScrollableAreas();
          this.findClickableElements();
        }, 2000);
      }
    }

    // Initialize the controller
    window.flowsonatController = new FlowSonatController();
    window.flowsonatController.injectStyles();
    `;
  }
