import React, { useRef, useEffect, useState, useCallback } from 'react';

interface StripePaymentWebViewProps {
  paymentUrl: string;
  onPaymentComplete?: () => void;
  onPaymentCancel?: () => void;
  onClose?: () => void;
}

export const StripePaymentWebView: React.FC<StripePaymentWebViewProps> = ({
  paymentUrl,
  onPaymentComplete,
  onPaymentCancel,
  onClose
}) => {
  const webviewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  // paymentUrl이 변경될 때만 WebView src 업데이트
  useEffect(() => {
    if (paymentUrl && paymentUrl !== currentUrl) {
      console.log('🔄 Payment URL changed, updating WebView src:', paymentUrl);
      setCurrentUrl(paymentUrl);
      setIsLoading(true);
      setHasError(false);
    }
  }, [paymentUrl, currentUrl]);

  // 콜백 함수들을 useCallback으로 메모이제이션
  const handlePaymentComplete = useCallback(() => {
    console.log('✅ Payment completed successfully');
    onPaymentComplete?.();
  }, [onPaymentComplete]);

  const handlePaymentCancel = useCallback(() => {
    console.log('❌ Payment cancelled');
    onPaymentCancel?.();
  }, [onPaymentCancel]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      console.log('✅ Stripe payment page loaded');
    };

    const handleError = (event: any) => {
      setIsLoading(false);
      setHasError(true);
      console.error('❌ Stripe payment page failed to load:', event);
    };

    const handleDidNavigate = (e: any) => {
      const url = e?.url || webview.getURL?.() || '';
      console.log('🔄 Navigation detected:', url);
      
      // Stripe 결제 완료 URL 패턴 감지
      if (url.includes('stripe.com') && (url.includes('success') || url.includes('complete'))) {
        handlePaymentComplete();
      }
      
      // 결제 취소 URL 패턴 감지
      if (url.includes('stripe.com') && url.includes('cancel')) {
        handlePaymentCancel();
      }
    };

    const handleDomReady = () => {
      setIsLoading(false);
      console.log('🎯 Stripe payment page DOM ready');
    };

    webview.addEventListener('did-finish-load', handleLoad);
    webview.addEventListener('did-fail-load', handleError);
    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigate);

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad);
      webview.removeEventListener('did-fail-load', handleError);
      webview.removeEventListener('dom-ready', handleDomReady);
      webview.removeEventListener('did-navigate', handleDidNavigate);
      webview.removeEventListener('did-navigate-in-page', handleDidNavigate);
    };
  }, [handlePaymentComplete, handlePaymentCancel]); // 메모이제이션된 콜백 함수들만 의존성으로 사용

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-4xl max-h-[800px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Stripe Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* WebView Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Loading payment page...</p>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <p className="text-red-600 mb-4">Failed to load payment page</p>
                <button 
                  onClick={() => {
                    setHasError(false);
                    setIsLoading(true);
                    if (webviewRef.current) {
                      webviewRef.current.reload();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <webview
            ref={webviewRef}
            src={currentUrl}
            className="w-full h-full"
            partition="persist:stripe"
            webpreferences="contextIsolation=yes, nodeIntegration=no"
            allowpopups={true}
            security="true"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
};
