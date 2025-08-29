// React named export shim for TS setups where @types/react exposes only default export
// This augments the module to include commonly used named exports and types.
declare module 'react' {
  export const useState: typeof import('react')['useState'];
  export const useEffect: typeof import('react')['useEffect'];
  export const useRef: typeof import('react')['useRef'];
  export const useMemo: typeof import('react')['useMemo'];
  export const useCallback: typeof import('react')['useCallback'];
  export const forwardRef: typeof import('react')['forwardRef'];
  export const createContext: typeof import('react')['createContext'];
  export const useContext: typeof import('react')['useContext'];
  export const StrictMode: typeof import('react')['StrictMode'];

  export type ReactNode = import('react').ReactNode;
  export type FormEvent<T = Element> = import('react').FormEvent<T>;
  export type ChangeEvent<T = Element> = import('react').ChangeEvent<T>;
  export type RefObject<T> = import('react').RefObject<T>;
  export type HTMLAttributes<T> = import('react').HTMLAttributes<T>;
  export type ButtonHTMLAttributes<T> = import('react').ButtonHTMLAttributes<T>;
  export type InputHTMLAttributes<T> = import('react').InputHTMLAttributes<T>;
  export type ElementRef<T extends import('react').ElementType> = import('react').ElementRef<T>;
  export type ComponentPropsWithoutRef<T extends import('react').ElementType> = import('react').ComponentPropsWithoutRef<T>;
  export type ReactElement<T = any> = import('react').ReactElement<T>;
}

