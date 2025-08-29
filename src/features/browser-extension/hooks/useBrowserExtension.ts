import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserExtensionState, MousePosition, CursorStyle, BrowserAction } from '../types';
import { getCursorStyle } from '../utils/cursorStyles';

interface UseBrowserExtensionProps {
  webviewRef: React.RefObject<HTMLWebViewElement>;
  onWebViewLoad?: () => void;
  onWebViewError?: (error: string) => void;
}

export const useBrowserExtension = ({ 
  webviewRef, 
  onWebViewLoad, 
  onWebViewError 
}: UseBrowserExtensionProps) => {
  const [state, setState] = useState<BrowserExtensionState>({
    isActive: false,
    cursorStyle: { type: 'default' },
    mousePosition: { x: 0, y: 0 },
    isDragging: false,
    selectedElement: null
  });

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<MousePosition>({ x: 0, y: 0 });
  const isWebViewLoadedRef = useRef(false);

  // 커서 요소 생성 및 초기화
  const createCursor = useCallback(() => {
    // 기존 커서가 있다면 제거
    const existingCursor = document.getElementById('modern-cursor');
    if (existingCursor) {
      document.body.removeChild(existingCursor);
    }

    // 새 커서 생성
    const cursor = document.createElement('div');
    cursor.id = 'modern-cursor';
    cursor.style.cssText = getCursorStyle('default');
    
    // 초기 위치 설정 (화면 중앙)
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    cursor.style.left = `${centerX}px`;
    cursor.style.top = `${centerY}px`;
    
    document.body.appendChild(cursor);
    cursorRef.current = cursor;
    
    console.log('Cursor created at:', centerX, centerY);
  }, []);

  // 커서 요소 생성
  useEffect(() => {
    createCursor();

    return () => {
      if (cursorRef.current) {
        try {
          document.body.removeChild(cursorRef.current);
        } catch (e) {
          console.log('Cursor already removed');
        }
      }
    };
  }, [createCursor]);

  // webview 로드 완료 시 자동으로 extension 활성화
  const handleWebViewLoaded = useCallback(() => {
    console.log('WebView loaded, auto-activating extension...');
    isWebViewLoadedRef.current = true;
    onWebViewLoad?.();
    
    // 약간의 지연 후 extension 활성화 (webview가 완전히 준비될 때까지)
    setTimeout(() => {
      setState((prev: BrowserExtensionState) => ({ ...prev, isActive: true }));
      console.log('Extension auto-activated');
      
      // 커서를 다시 생성하고 표시
      createCursor();
    }, 500);
  }, [onWebViewLoad, createCursor]);

  // webview 에러 처리
  const handleWebViewError = useCallback((event: any) => {
    const errorMessage = 'Failed to load page';
    console.error('WebView error:', errorMessage);
    onWebViewError?.(errorMessage);
  }, [onWebViewError]);

  // webview 로드 이벤트 리스너 등록
  useEffect(() => {
    const webview = webviewRef.current;
    if (webview) {
      webview.addEventListener('did-finish-load', handleWebViewLoaded);
      webview.addEventListener('did-fail-load', handleWebViewError);
      
      return () => {
        webview.removeEventListener('did-finish-load', handleWebViewLoaded);
        webview.removeEventListener('did-fail-load', handleWebViewError);
      };
    }
  }, [webviewRef, handleWebViewLoaded, handleWebViewError]);

  // 마우스 이벤트 핸들러
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!state.isActive || !cursorRef.current) return;

    const { clientX, clientY } = event;
    setState((prev: BrowserExtensionState) => ({ ...prev, mousePosition: { x: clientX, y: clientY } }));

    // 커서 위치 업데이트
    cursorRef.current.style.left = `${clientX}px`;
    cursorRef.current.style.top = `${clientY}px`;

    // 웹뷰 내부 요소 감지
    const webview = webviewRef.current;
    if (webview) {
      const rect = webview.getBoundingClientRect();
      const webviewX = clientX - rect.left;
      const webviewY = clientY - rect.top;

      if (webviewX >= 0 && webviewX <= rect.width && webviewY >= 0 && webviewY <= rect.height) {
        // 웹뷰 내부에서의 커서 스타일 변경
        const element = document.elementFromPoint(clientX, clientY);
        if (element) {
          const computedStyle = window.getComputedStyle(element);
          const cursorType = computedStyle.cursor as CursorStyle['type'];
          
          if (cursorType !== state.cursorStyle.type) {
            setState((prev: BrowserExtensionState) => ({ ...prev, cursorStyle: { type: cursorType } }));
            cursorRef.current.style.cssText = getCursorStyle(cursorType);
            cursorRef.current.style.left = `${clientX}px`;
            cursorRef.current.style.top = `${clientY}px`;
          }
        }
      }
    }
  }, [state.isActive, state.cursorStyle.type, webviewRef]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!state.isActive) return;

    const { clientX, clientY, button } = event;
    isDraggingRef.current = true;
    dragStartRef.current = { x: clientX, y: clientY };

    setState((prev: BrowserExtensionState) => ({ ...prev, isDragging: true }));

    // 웹뷰 클릭 이벤트 전달
    const webview = webviewRef.current;
    if (webview) {
      const rect = webview.getBoundingClientRect();
      const webviewX = clientX - rect.left;
      const webviewY = clientY - rect.top;

      if (webviewX >= 0 && webviewX <= rect.width && webviewY >= 0 && webviewY <= rect.height) {
        const action: BrowserAction = {
          type: button === 2 ? 'rightClick' : 'click',
          position: { x: webviewX, y: webviewY }
        };
        
        executeBrowserAction(action);
      }
    }
  }, [state.isActive, webviewRef]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!state.isActive) return;

    isDraggingRef.current = false;
    setState((prev: BrowserExtensionState) => ({ ...prev, isDragging: false }));

    // 더블클릭 감지
    if (event.detail === 2) {
      const webview = webviewRef.current;
      if (webview) {
        const rect = webview.getBoundingClientRect();
        const webviewX = event.clientX - rect.left;
        const webviewY = event.clientY - rect.top;

        const action: BrowserAction = {
          type: 'doubleClick',
          position: { x: webviewX, y: webviewY }
        };
        
        executeBrowserAction(action);
      }
    }
  }, [state.isActive, webviewRef]);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (!state.isActive) return;

    const webview = webviewRef.current;
    if (webview) {
      const rect = webview.getBoundingClientRect();
      const webviewX = event.clientX - rect.left;
      const webviewY = event.clientY - rect.top;

      if (webviewX >= 0 && webviewX <= rect.width && webviewY >= 0 && webviewY <= rect.height) {
        const action: BrowserAction = {
          type: 'scroll',
          position: { x: webviewX, y: webviewY },
          data: { deltaX: event.deltaX, deltaY: event.deltaY }
        };
        
        executeBrowserAction(action);
      }
    }
  }, [state.isActive, webviewRef]);

  // 브라우저 액션 실행
  const executeBrowserAction = useCallback((action: BrowserAction) => {
    const webview = webviewRef.current;
    if (!webview) return;

    switch (action.type) {
      case 'click':
        webview.sendInputEvent({
          type: 'mouseDown',
          x: action.position.x,
          y: action.position.y,
          button: 'left',
          clickCount: 1
        });
        webview.sendInputEvent({
          type: 'mouseUp',
          x: action.position.x,
          y: action.position.y,
          button: 'left',
          clickCount: 1
        });
        break;
      case 'doubleClick':
        webview.sendInputEvent({
          type: 'mouseDown',
          x: action.position.x,
          y: action.position.y,
          button: 'left',
          clickCount: 2
        });
        webview.sendInputEvent({
          type: 'mouseUp',
          x: action.position.x,
          y: action.position.y,
          button: 'left',
          clickCount: 2
        });
        break;
      case 'rightClick':
        webview.sendInputEvent({
          type: 'mouseDown',
          x: action.position.x,
          y: action.position.y,
          button: 'right',
          clickCount: 1
        });
        webview.sendInputEvent({
          type: 'mouseUp',
          x: action.position.x,
          y: action.position.y,
          button: 'right',
          clickCount: 1
        });
        break;
      case 'scroll':
        if (action.data) {
          webview.sendInputEvent({
            type: 'scrollWheel',
            x: action.position.x,
            y: action.position.y,
            deltaX: action.data.deltaX,
            deltaY: action.data.deltaY
          });
        }
        break;
    }
  }, [webviewRef]);

  // 익스텐션 활성화/비활성화
  const toggleExtension = useCallback(() => {
    setState((prev: BrowserExtensionState) => ({ ...prev, isActive: !prev.isActive }));
  }, []);

  // 이벤트 리스너 등록/해제
  useEffect(() => {
    if (state.isActive) {
      console.log('Activating extension, setting up event listeners...');
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('wheel', handleWheel);
      document.addEventListener('contextmenu', (e) => e.preventDefault());

      // 기본 커서 숨기기
      document.body.style.cursor = 'none';
      
      // 커서가 없다면 생성
      if (!cursorRef.current) {
        createCursor();
      }
      
      // 커서를 화면 중앙에 표시
      if (cursorRef.current) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        cursorRef.current.style.left = `${centerX}px`;
        cursorRef.current.style.top = `${centerY}px`;
        cursorRef.current.style.display = 'block';
        setState((prev: BrowserExtensionState) => ({ 
          ...prev, 
          mousePosition: { x: centerX, y: centerY } 
        }));
        console.log('Cursor positioned at center:', centerX, centerY);
      }
    } else {
      console.log('Deactivating extension, removing event listeners...');
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);

      // 기본 커서 복원
      document.body.style.cursor = 'auto';
      
      // 커서 숨기기
      if (cursorRef.current) {
        cursorRef.current.style.display = 'none';
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
      document.body.style.cursor = 'auto';
    };
  }, [state.isActive, handleMouseMove, handleMouseDown, handleMouseUp, handleWheel, createCursor]);

  return {
    state,
    toggleExtension,
    executeBrowserAction,
    isWebViewLoaded: isWebViewLoadedRef.current
  };
};
