import React from 'react';
import { InstagramWebViewManager } from '@/components/InstagramWebViewManager';
import { useLocation } from 'react-router-dom';

const WebViewPage: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const minimal = params.get('minimal') === '1' || params.get('minimal') === 'true';

  return <InstagramWebViewManager minimal={minimal} />;
};

export default WebViewPage;
