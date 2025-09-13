import React from 'react';
import { InstagramWebViewManager } from '@/components/InstagramWebViewManager';

const LoginWebViewPage: React.FC = () => {
  // Reuse the existing manager which implements:
  // - login detection
  // - confirmation modal
  // - cookie save and navigation back to dashboard
  // Automation features remain inactive while not server-registered.
  return <InstagramWebViewManager minimal={true} />;
};

export default LoginWebViewPage;
