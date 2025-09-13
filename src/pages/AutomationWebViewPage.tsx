import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InstagramWebViewManager } from '@/components/InstagramWebViewManager';

const AutomationWebViewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = React.useState(false);

  // Preflight: ensure we have a valid sessionid; if not, go to login page
  useEffect(() => {
    let cancelled = false;

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
          navigate('/webview/login?from=automation', { replace: true });
        } else if (!cancelled) {
          setReady(true);
        }
      } catch {
        // On error, be safe and redirect to login
        if (!cancelled) {
          navigate('/webview/login?from=automation', { replace: true });
        } else if (!cancelled) {
          setReady(true);
        }
      }
    };

    checkCookies();
    return () => { cancelled = true; };
  }, [navigate]);

  const params = new URLSearchParams(location.search);
  const minimal = params.get('minimal') === '1' || params.get('minimal') === 'true';

  if (!ready) return null;

  return <InstagramWebViewManager minimal={minimal} />;
};

export default AutomationWebViewPage;
