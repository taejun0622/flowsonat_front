import React, { useEffect, useRef, useState } from 'react';

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
export type BackgroundType = 
  | 'abstract-shape'
  | 'aesthetic-fluid'
  | 'blur-dot'
  | 'blur-gradient'
  | 'triangles-mosaic'
  | 'random-cubes'
  | 'wavy-waves'
  | 'big-blob';

interface DynamicBackgroundProps {
  type: BackgroundType;
  colors?: string[];
  seed?: number;
  loop?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  type,
  colors = ['#D1ADFF', '#98D69B', '#FAE390', '#FFACD8', '#7DD5FF'],
  seed = 1000,
  loop = true,
  className = '',
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundInstanceRef = useRef<Color4BgInstance | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [containerId] = useState(`color4bg-${Math.random().toString(36).substr(2, 9)}`);

  // Check if DOM element is mounted
  useEffect(() => {
    if (containerRef.current) {
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    const loadBackground = async () => {
      try {
        // Dynamically import the specific background module
        let BackgroundClass;
        
        switch (type) {
          case 'abstract-shape':
            BackgroundClass = (await import('color4bg.js/build/jsm/AbstractShapeBg.module.js')).AbstractShapeBg;
            break;
          case 'aesthetic-fluid':
            BackgroundClass = (await import('color4bg.js/build/jsm/AestheticFluidBg.module.js')).AestheticFluidBg;
            break;
          case 'blur-dot':
            BackgroundClass = (await import('color4bg.js/build/jsm/BlurDotBg.module.js')).BlurDotBg;
            break;
          case 'blur-gradient':
            BackgroundClass = (await import('color4bg.js/build/jsm/BlurGradientBg.module.js')).BlurGradientBg;
            break;
          case 'triangles-mosaic':
            BackgroundClass = (await import('color4bg.js/build/jsm/TrianglesMosaicBg.module.js')).TrianglesMosaicBg;
            break;
          case 'random-cubes':
            BackgroundClass = (await import('color4bg.js/build/jsm/RandomCubesBg.module.js')).RandomCubesBg;
            break;
          case 'wavy-waves':
            BackgroundClass = (await import('color4bg.js/build/jsm/WavyWavesBg.module.js')).WavyWavesBg;
            break;
          case 'big-blob':
            BackgroundClass = (await import('color4bg.js/build/jsm/BigBlobBg.module.js')).BigBlobBg;
            break;
          default:
            BackgroundClass = (await import('color4bg.js/build/jsm/AestheticFluidBg.module.js')).AestheticFluidBg;
        }

        // Create background instance using ID string
        const options: Color4BgOptions = {
          dom: containerId,
          colors,
          seed,
          loop
        };

        backgroundInstanceRef.current = new BackgroundClass(options);
      } catch (error) {
        console.error('Failed to load background:', error);
      }
    };

    loadBackground();

    // Cleanup function
    return () => {
      if (backgroundInstanceRef.current?.destroy) {
        backgroundInstanceRef.current.destroy();
      }
    };
  }, [isMounted, type, colors, seed, loop, containerId]);

  return (
    <div 
      ref={containerRef} 
      id={containerId}
      className={`relative w-full h-full ${className}`}
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        zIndex: 0 
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
};

// Predefined background presets
export const BackgroundPresets = {
  ai: {
    colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
    type: 'aesthetic-fluid' as BackgroundType
  },
  modern: {
    colors: ['#ff9a9e', '#fecfef', '#fecfef', '#fad0c4', '#ffd1ff', '#a8edea'],
    type: 'blur-gradient' as BackgroundType
  },
  tech: {
    colors: ['#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'],
    type: 'abstract-shape' as BackgroundType
  },
  calm: {
    colors: ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef'],
    type: 'wavy-waves' as BackgroundType
  }
};

// Convenience component for common use cases
export const AIBackground: React.FC<{ children?: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <DynamicBackground
    type={BackgroundPresets.ai.type}
    colors={BackgroundPresets.ai.colors}
    className={className}
  >
    {children}
  </DynamicBackground>
);

export const ModernBackground: React.FC<{ children?: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <DynamicBackground
    type={BackgroundPresets.modern.type}
    colors={BackgroundPresets.modern.colors}
    className={className}
  >
    {children}
  </DynamicBackground>
);
