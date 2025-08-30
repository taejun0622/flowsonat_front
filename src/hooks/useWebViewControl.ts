import { useRef, useMemo, useCallback } from 'react';
import { WebViewControl } from '@/features/browser-extension/types';

export const useWebViewControl = () => {
  const webviewRef = useRef<HTMLWebViewElement>(null);

  // Stable method implementations that read from the ref at call time
  const click = useCallback((x: number, y: number) => {
      if (webviewRef.current) {
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${x}, ${y});
            if (!element) return false;
            
            element.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            return true;
          })()
        `, true);
      }
    }, []);

  const doubleClick = useCallback((x: number, y: number) => {
    if (webviewRef.current) {
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${x}, ${y});
            if (!element) return false;
            
            // First click
            element.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            // Second click
            element.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            element.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            return true;
          })()
        `, true);
      }
  }, []);

  const rightClick = useCallback((x: number, y: number) => {
    if (webviewRef.current) {
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${x}, ${y});
            if (!element) return false;
            
            element.dispatchEvent(new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            return true;
          })()
        `, true);
      }
  }, []);

  const hover = useCallback((x: number, y: number) => {
    if (webviewRef.current) {
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${x}, ${y});
            if (!element) return false;
            
            element.dispatchEvent(new MouseEvent('mousemove', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${x},
              clientY: ${y}
            }));
            
            return true;
          })()
        `, true);
      }
  }, []);

  const scroll = useCallback((deltaX: number, deltaY: number) => {
    if (webviewRef.current) {
        webviewRef.current.executeJavaScript(`
          (() => {
            const x = window.innerWidth / 2;
            const y = window.innerHeight / 2;
            
            let scrollableElement = document.elementFromPoint(x, y);
            while (scrollableElement && (scrollableElement.scrollHeight <= scrollableElement.clientHeight || getComputedStyle(scrollableElement).overflowY === 'visible')) {
              scrollableElement = scrollableElement.parentElement;
            }
            
            if (scrollableElement) {
              console.log('Found scrollable element:', scrollableElement);
              scrollableElement.scrollBy(${deltaX}, ${deltaY});
              return true;
            } else {
              console.log('No scrollable element found');
              window.scrollBy(${deltaX}, ${deltaY});
              return true;
            }
          })()
        `, true);
      }
  }, []);

  const drag = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    if (webviewRef.current) {
        webviewRef.current.executeJavaScript(`
          (() => {
            const element = document.elementFromPoint(${startX}, ${startY});
            if (!element) return false;
            
            element.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${startX},
              clientY: ${startY}
            }));
            
            element.dispatchEvent(new MouseEvent('mousemove', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${endX},
              clientY: ${endY}
            }));
            
            element.dispatchEvent(new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: ${endX},
              clientY: ${endY}
            }));
            
            return true;
          })()
        `, true);
      }
  }, []);

  const navigate = useCallback(async (url: string) => {
    if (!webviewRef.current) return;
    webviewRef.current.loadURL(url);
    await new Promise<void>((resolve) => {
      const f = () => { 
        webviewRef.current?.removeEventListener('did-finish-load', f as any); 
        resolve(); 
      };
      webviewRef.current?.addEventListener('did-finish-load', f as any, { once: true } as any);
    });
  }, []);

  const exec = useCallback(async <T,>(fn: (...fnArgs: any[]) => T | Promise<T>, ...fnArgs: any[]): Promise<T> => {
    const argsStr = JSON.stringify(fnArgs);
    return await webviewRef.current!.executeJavaScript(`(${fn.toString()}).apply(null, ${argsStr})`, true);
  }, []);

  const getUrl = useCallback(async () => {
    return webviewRef.current?.getURL?.() || "";
  }, []);

  const reload = useCallback(async () => {
    webviewRef.current?.reload();
  }, []);

  // Memoize the control object to keep stable identity across renders
  const webViewControl: WebViewControl = useMemo(() => ({
    click,
    doubleClick,
    rightClick,
    hover,
    scroll,
    drag,
    navigate,
    exec,
    getUrl,
    reload,
  }), [click, doubleClick, rightClick, hover, scroll, drag, navigate, exec, getUrl, reload]);

  return {
    webviewRef,
    webViewControl
  };
};
