export interface MousePosition {
  x: number;
  y: number;
}

export interface BrowserAction {
  type: 'click' | 'doubleClick' | 'rightClick' | 'hover' | 'scroll' | 'drag';
  position: MousePosition;
  data?: any;
}

export interface CursorStyle {
  type: 'default' | 'pointer' | 'text' | 'grab' | 'grabbing' | 'crosshair' | 'wait' | 'move';
  custom?: string;
}

export interface BrowserExtensionState {
  isActive: boolean;
  cursorStyle: CursorStyle;
  mousePosition: MousePosition;
  isDragging: boolean;
  selectedElement: HTMLElement | null;
}

export interface WebViewControl {
  navigate?: (url: string) => Promise<void>;
  exec?: <T>(fn: (...args: any[]) => T | Promise<T>, ...args: any[]) => Promise<T>;
  getUrl?: () => Promise<string>;
  reload?: () => Promise<void>;
  click: (x: number, y: number) => void;
  doubleClick: (x: number, y: number) => void;
  rightClick: (x: number, y: number) => void;
  hover: (x: number, y: number) => void;
  scroll: (deltaX: number, deltaY: number) => void;
  drag: (startX: number, startY: number, endX: number, endY: number) => void;
}
