import { CursorStyle } from '../types';

export const modernCursorStyles: Record<string, string> = {
  default: `
    width: 24px;
    height: 24px;
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.5);
    position: fixed;
    pointer-events: none;
    z-index: 99999;
    transition: all 0.1s ease;
    transform: translate(-50%, -50%);
    display: block;
  `,
  pointer: `
    width: 28px;
    height: 28px;
    background: linear-gradient(45deg, #ff6b6b 0%, #ee5a24 100%);
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 6px 16px rgba(255, 107, 107, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.5);
    position: fixed;
    pointer-events: none;
    z-index: 99999;
    transition: all 0.15s ease;
    transform: translate(-50%, -50%) scale(1.2);
    display: block;
  `,
  text: `
    width: 3px;
    height: 24px;
    background: linear-gradient(to bottom, #667eea, #764ba2);
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.6);
    position: fixed;
    pointer-events: none;
    z-index: 99999;
    transition: all 0.1s ease;
    transform: translate(-50%, -50%);
    animation: blink 1s infinite;
    display: block;
  `,
  grab: `
    width: 32px;
    height: 32px;
    background: linear-gradient(45deg, #4ecdc4 0%, #44a08d 100%);
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 8px 20px rgba(78, 205, 196, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.5);
    position: fixed;
    pointer-events: none;
    z-index: 99999;
    transition: all 0.2s ease;
    transform: translate(-50%, -50%);
    display: block;
  `,
  grabbing: `
    width: 36px;
    height: 36px;
    background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%);
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 10px 24px rgba(255, 154, 158, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.5);
    position: fixed;
    pointer-events: none;
    z-index: 99999;
    transition: all 0.2s ease;
    transform: translate(-50%, -50%) scale(1.1);
    display: block;
  `,
  crosshair: `
    width: 24px;
    height: 24px;
    background: linear-gradient(45deg, #a8edea 0%, #fed6e3 100%);
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 4px 12px rgba(168, 237, 234, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.5);
    position: fixed;
    pointer-events: none;
    z-index: 99999;
    transition: all 0.1s ease;
    transform: translate(-50%, -50%);
    display: block;
  `,
  wait: `
    width: 28px;
    height: 28px;
    background: linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%);
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 6px 16px rgba(255, 236, 210, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.5);
    position: fixed;
    pointer-events: none;
    z-index: 99999;
    transition: all 0.1s ease;
    transform: translate(-50%, -50%);
    animation: spin 1s linear infinite;
    display: block;
  `,
  move: `
    width: 30px;
    height: 30px;
    background: linear-gradient(45deg, #d299c2 0%, #fef9d7 100%);
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 6px 16px rgba(210, 153, 194, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.5);
    position: fixed;
    pointer-events: none;
    z-index: 99999;
    transition: all 0.15s ease;
    transform: translate(-50%, -50%);
    display: block;
  `
};

export const cursorAnimations = `
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  @keyframes spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
  
  @keyframes pulse {
    0% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
    100% { transform: translate(-50%, -50%) scale(1); }
  }
`;

export const getCursorStyle = (cursorType: CursorStyle['type']): string => {
  return modernCursorStyles[cursorType] || modernCursorStyles.default;
};
