import React from 'react';

interface PebloLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
  minHeight?: string | number;
  style?: React.CSSProperties;
}

export const PebloLoader: React.FC<PebloLoaderProps> = ({
  text = 'Loading...',
  size = 'md',
  layout = 'vertical',
  minHeight = '200px',
  style,
}) => {
  const logoHeights = {
    sm: '32px',
    md: '48px',
    lg: '64px',
  };

  const shadowWidths = {
    sm: '36px',
    md: '54px',
    lg: '72px',
  };

  const fontSizes = {
    sm: '13px',
    md: '14px',
    lg: '16px',
  };

  const logoH = logoHeights[size];
  const shadowW = shadowWidths[size];
  const fontS = fontSizes[size];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: layout === 'vertical' ? '14px' : '16px',
        padding: '32px 20px',
        minHeight: minHeight,
        width: '100%',
        ...style,
      }}
      className="peblo-loader-container"
    >
      {/* Logo & Ground Shadow Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Popping Animated PeBlo Logo */}
        <img
          src="/logo.png"
          alt="PeBlo Loading"
          className="peblo-pop-bounce"
          style={{
            height: logoH,
            width: 'auto',
            objectFit: 'contain',
            userSelect: 'none',
            display: 'block',
          }}
        />

        {/* Dynamic Pulsing Ground Shadow */}
        <div
          className="peblo-shadow-pulse"
          style={{
            width: shadowW,
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'rgba(84, 52, 136, 0.25)',
            marginTop: '4px',
          }}
        />
      </div>

      {/* Loading Label with Bouncing Dots */}
      {text && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#543488',
            fontWeight: 700,
            fontSize: fontS,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.01em',
          }}
        >
          <span>{text}</span>
          <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
            <span className="peblo-dot-1" style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#543488' }} />
            <span className="peblo-dot-2" style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#543488' }} />
            <span className="peblo-dot-3" style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#543488' }} />
          </span>
        </div>
      )}
    </div>
  );
};
