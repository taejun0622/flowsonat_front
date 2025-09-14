import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InstagramWebViewManager } from '@/components/InstagramWebViewManager';
import { useInstagram } from '@/contexts/InstagramContext';

const AutomationWebViewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { instagramAccount } = useInstagram();
  const [ready, setReady] = React.useState(false);
  const params = new URLSearchParams(location.search);

  // Preflight: ensure we have a valid sessionid; if not, go to login page
  useEffect(() => {
    let cancelled = false;

    // If account is connected, allow manager to mount so it can inject cookies
    if (instagramAccount) {
      setReady(true);
      return () => { cancelled = true; };
    }

    // Otherwise, soft preflight: if no session cookie, go to login
    const checkCookies = async () => {
      try {
        let cookies: Record<string, string> = {};
        const api: any = (window as any).electronAPI;
        if (api && typeof api.getInstagramCookies === 'function') {
          const resp = await api.getInstagramCookies();
          cookies = resp?.cookies || {};
        } else if ((window as any).ipcRenderer?.invoke) {
          const resp = await (window as any).ipcRenderer.invoke('ig:get-instagram-cookies');
          cookies = resp?.cookies || {};
        }
        const hasSession = !!cookies['sessionid'];
        if (!hasSession && !cancelled) {
          // Preserve autoCollectFollowing parameter when redirecting to login
          const autoCollectFollowing = params.get('autoCollectFollowing') === '1';
          const loginUrl = autoCollectFollowing
            ? '/webview/login?from=automation&autoCollectFollowing=1'
            : '/webview/login?from=automation';
          navigate(loginUrl, { replace: true });
        } else if (!cancelled) {
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          // Preserve autoCollectFollowing parameter when redirecting to login
          const autoCollectFollowing = params.get('autoCollectFollowing') === '1';
          const loginUrl = autoCollectFollowing
            ? '/webview/login?from=automation&autoCollectFollowing=1'
            : '/webview/login?from=automation';
          navigate(loginUrl, { replace: true });
        }
      }
    };

    checkCookies();
    return () => { cancelled = true; };
  }, [navigate, instagramAccount, params]);

  const minimal = params.get('minimal') === '1' || params.get('minimal') === 'true';

  console.log('[AutomationWebViewPage] Debug state:', { ready, instagramAccount: !!instagramAccount, minimal });

  if (!ready) {
    console.log('[AutomationWebViewPage] Not ready, returning null');
    return <div className="p-4 text-center">
      <div className="text-lg font-semibold">Loading automation page...</div>
      <div className="text-sm text-gray-600 mt-2">
        Checking Instagram connection...
      </div>
    </div>;
  }

  console.log('[AutomationWebViewPage] Ready! Rendering InstagramWebViewManager');
  return <InstagramWebViewManager minimal={minimal} />;
};

export default AutomationWebViewPage;
