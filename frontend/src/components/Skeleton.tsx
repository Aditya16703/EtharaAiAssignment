import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = '16px', borderRadius = 'var(--radius-sm)', style }: SkeletonProps) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      backgroundColor: 'var(--bg-panel)',
      backgroundImage: 'linear-gradient(90deg, var(--bg-panel) 0%, var(--bg-hover) 50%, var(--bg-panel) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      ...style,
    }} />
  );
}

// Inject shimmer keyframes once into document
if (typeof document !== 'undefined' && !document.getElementById('skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}
