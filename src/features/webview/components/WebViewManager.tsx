import React from 'react';
import { WebViewManagerProps, QuickAccessItem } from '../types';
import FullScreenWebView from './FullScreenWebView';
import QuickAccess from './QuickAccess';

const WebViewManager = ({
  defaultUrl = 'https://www.instagram.com'
}: WebViewManagerProps) => {
  const [isWebViewOpen, setIsWebViewOpen] = React.useState(false);
  const [currentUrl, setCurrentUrl] = React.useState(defaultUrl);

  const handleOpenWebView = () => {
    setIsWebViewOpen(true);
  };

  const handleCloseWebView = () => {
    setIsWebViewOpen(false);
  };

  const handleUrlChange = (event: any) => {
    setCurrentUrl(event.target.value);
  };

  const handleQuickAccessSelect = (url: string) => {
    setCurrentUrl(url);
    if (!isWebViewOpen) {
      setIsWebViewOpen(true);
    }
  };

  const quickAccessItems: QuickAccessItem[] = [
    { name: 'Instagram Home', url: 'https://www.instagram.com', description: 'Instagram home page' },
    { name: 'Instagram Explore', url: 'https://www.instagram.com/explore', description: 'Explore page' },
    { name: 'Instagram Reels', url: 'https://www.instagram.com/reels', description: 'Reels page' },
    { name: 'Instagram Messages', url: 'https://www.instagram.com/direct/inbox', description: 'Messages page' },
    { name: 'Instagram Notifications', url: 'https://www.instagram.com/accounts/activity', description: 'Notifications page' },
    { name: 'Instagram Profile', url: 'https://www.instagram.com/accounts/edit', description: 'Edit profile page' }
  ];

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>
        WebView Manager
      </h1>

      <div style={{ marginBottom: '30px' }}>
        <label htmlFor="url-input" style={{ 
          display: 'block', 
          marginBottom: '10px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          URL:
        </label>
        <input
          id="url-input"
          type="text"
          value={currentUrl}
          onChange={handleUrlChange}
          placeholder="Enter URL"
          style={{
            width: '100%',
            padding: '15px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            fontSize: '16px',
            marginBottom: '20px'
          }}
        />

        <button
          onClick={handleOpenWebView}
          style={{
            padding: '15px 30px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          Open in Full Screen
        </button>
      </div>

      <QuickAccess 
        items={quickAccessItems}
        onItemSelect={handleQuickAccessSelect}
      />

      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ marginTop: 0, color: '#495057' }}>Instructions</h4>
        <ul style={{ textAlign: 'left', color: '#6c757d', lineHeight: '1.6' }}>
          <li>Enter a URL or use Quick Access buttons</li>
          <li>Click "Open in Full Screen" to launch</li>
          <li>Use the navigation controls in the webview header</li>
          <li>Click "Close" to return to this page</li>
        </ul>
      </div>

      {isWebViewOpen && (
        <FullScreenWebView
          url={currentUrl}
          onClose={handleCloseWebView}
        />
      )}
    </div>
  );
};

export default WebViewManager;
