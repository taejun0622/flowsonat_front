import React from 'react';

// Type definitions for color4bg.js
interface Color4BgOptions {
  dom: string | HTMLElement;
  colors: string[];
  seed?: number;
  loop?: boolean;
}

interface Color4BgInstance {
  destroy?: () => void;
}

// Background type options
export type BackgroundType = 'blur-dot';

interface DynamicBackgroundProps {
  type: BackgroundType;
  colors?: string[];
  seed?: number;
  loop?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const DynamicBackground = ({
  type,
  colors = ['#D1ADFF', '#98D69B', '#FAE390', '#FFACD8', '#7DD5FF'],
  seed = 1000,
  loop = true,
  className = '',
  children
}: DynamicBackgroundProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const backgroundInstanceRef = React.useRef<Color4BgInstance | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [containerId] = React.useState(`color4bg-${Math.random().toString(36).substr(2, 9)}`);

  // Check if DOM element is mounted
  React.useEffect(() => {
    if (containerRef.current) {
      setIsMounted(true);
    }
  }, []);

  React.useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    const loadBackground = async () => {
      try {
        console.log('🎨 Loading background component...', { type, containerId });
        
        // Dynamically import the specific background module
        let BackgroundClass;
        
        switch (type) {
          case 'blur-dot':
            BackgroundClass = (await import('color4bg.js/build/jsm/BlurDotBg.module.js')).BlurDotBg;
            break;
          default:
            BackgroundClass = (await import('color4bg.js/build/jsm/BlurDotBg.module.js')).BlurDotBg;
        }

        console.log('✅ Background class loaded successfully');

        // Create background instance using ID string
        const options: Color4BgOptions = {
          dom: containerId,
          colors,
          seed,
          loop
        };

        backgroundInstanceRef.current = new BackgroundClass(options);
        console.log('✅ Background instance created successfully');
      } catch (error) {
        console.error('❌ Failed to load background:', error);
        console.warn('⚠️ Continuing without background animation');
        // Don't throw the error, just log it and continue
        // This ensures the app doesn't crash if the background fails to load
      }
    };

    loadBackground();

    // Cleanup function
    return () => {
      if (backgroundInstanceRef.current?.destroy) {
        try {
          backgroundInstanceRef.current.destroy();
        } catch (error) {
          console.warn('Failed to destroy background instance:', error);
        }
      }
    };
  }, [isMounted, type, colors, seed, loop, containerId]);

  return (
    <div 
      ref={containerRef} 
      id={containerId}
      className={`fixed inset-0 w-screen h-screen ${className}`}
      style={{ 
        position: 'fixed', 
        top: 0,
        left: 0,
        width: '100vw', 
        height: '100vh',
        zIndex: 0,
        // Fallback background in case the dynamic background fails
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div 
        style={{ 
          position: 'relative', 
          zIndex: 1, 
          width: '100%', 
          height: '100%'
        }}
      >
        {children}
      </div>
    </div>
  );
};
