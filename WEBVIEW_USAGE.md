# WebView 기능 사용법

이 프로젝트는 Electron 앱에서 전체 화면 웹뷰를 지원합니다. 웹뷰는 모달이 아닌 Electron 앱 창을 꽉 채우는 방식으로 동작합니다.

## 주요 기능

- **전체 화면 웹뷰**: Electron 앱 창을 꽉 채우는 웹뷰
- **네비게이션 컨트롤**: 뒤로가기, 새로고침, 브라우저에서 열기
- **로딩 상태 표시**: 웹뷰 로딩 중 스피너 표시
- **에러 처리**: 로딩 실패 시 재시도 버튼 제공
- **보안 설정**: contextIsolation, nodeIntegration 비활성화

## 사용법

### 1. WebViewLauncher 컴포넌트 사용

```tsx
import { WebViewLauncher } from '@/components/WebViewLauncher';

// 기본 사용법
<WebViewLauncher url="https://www.google.com">
  Google 열기
</WebViewLauncher>

// 스타일 커스터마이징
<WebViewLauncher 
  url="https://www.github.com"
  variant="outline"
  size="sm"
  className="custom-class"
>
  GitHub 열기
</WebViewLauncher>
```

### 2. useWebView 훅 사용

```tsx
import { useWebView } from '@/hooks/useWebView';

const MyComponent = () => {
  const { openWebView, openInBrowser, isElectron } = useWebView();

  const handleOpenWebView = () => {
    openWebView('https://www.example.com');
  };

  const handleOpenInBrowser = () => {
    openInBrowser('https://www.example.com');
  };

  return (
    <div>
      <button onClick={handleOpenWebView}>웹뷰에서 열기</button>
      <button onClick={handleOpenInBrowser}>브라우저에서 열기</button>
      {isElectron && <p>Electron 환경에서 실행 중</p>}
    </div>
  );
};
```

### 3. 직접 WebView 컴포넌트 사용

```tsx
import { WebView } from '@/components/WebView';

const MyWebViewPage = () => {
  const handleLoad = () => {
    console.log('웹뷰 로딩 완료');
  };

  const handleError = (error) => {
    console.error('웹뷰 로딩 실패:', error);
  };

  return (
    <div className="w-full h-screen">
      <WebView
        src="https://www.example.com"
        onLoad={handleLoad}
        onError={handleError}
        className="w-full h-full"
      />
    </div>
  );
};
```

## 라우팅

웹뷰 페이지는 `/webview` 경로에서 접근할 수 있으며, URL 파라미터를 통해 표시할 웹사이트를 지정합니다:

```
/webview?url=https://www.google.com
```

## 보안 설정

웹뷰는 다음과 같은 보안 설정으로 구성되어 있습니다:

- `contextIsolation: true`: 메인 프로세스와 렌더러 프로세스 격리
- `nodeIntegration: false`: Node.js API 비활성화
- `webSecurity: true`: 웹 보안 활성화
- `allowRunningInsecureContent: false`: 안전하지 않은 콘텐츠 실행 비활성화

## Electron 설정

`electron/main.ts`에서 웹뷰 태그가 활성화되어 있습니다:

```typescript
webPreferences: {
  preload: path.join(__dirname, 'preload.mjs'),
  webviewTag: true, // 웹뷰 태그 활성화
  nodeIntegration: false,
  contextIsolation: true,
  webSecurity: true,
  allowRunningInsecureContent: false
}
```

## 예제

대시보드의 "WebView" 탭에서 다양한 웹뷰 예제를 확인할 수 있습니다:

- Google 열기
- GitHub 열기
- Instagram 열기
- 브라우저에서 열기

## 주의사항

1. 웹뷰는 Electron 환경에서만 동작합니다.
2. 일부 웹사이트는 웹뷰에서 제대로 로드되지 않을 수 있습니다.
3. 웹뷰 내에서 JavaScript 실행이 제한될 수 있습니다.
4. 보안상의 이유로 일부 기능이 비활성화되어 있습니다.
