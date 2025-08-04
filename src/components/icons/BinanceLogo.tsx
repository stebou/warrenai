import React from 'react';

interface BinanceLogoProps {
  className?: string;
  variant?: 'testnet' | 'mainnet';
}

export const BinanceLogo: React.FC<BinanceLogoProps> = ({ 
  className = "w-6 h-6", 
  variant = 'mainnet' 
}) => {
  // Colors based on variant
  const colors = {
    testnet: {
      primary: '#F0B90B', // Binance Gold but slightly muted for testnet
      secondary: '#F0B90B'
    },
    mainnet: {
      primary: '#F0B90B', // Official Binance Gold
      secondary: '#F0B90B'
    }
  };

  const currentColors = colors[variant];

  return (
    <svg
      className={className}
      viewBox="0 0 126.611 126.611"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      {/* Binance Official Logo SVG */}
      <g>
        {/* Center Diamond */}
        <polygon
          fill={currentColors.primary}
          points="63.305,29.399 41.777,50.927 63.305,72.455 84.834,50.927"
        />
        
        {/* Left Diamond */}
        <polygon
          fill={currentColors.primary}
          points="21.415,63.305 0,84.834 21.415,106.248 42.944,84.834"
        />
        
        {/* Right Diamond */}
        <polygon
          fill={currentColors.primary}
          points="83.666,63.305 105.195,84.834 126.611,63.305 105.195,41.891"
        />
        
        {/* Top Diamond */}
        <polygon
          fill={currentColors.primary}
          points="63.305,0 41.777,21.529 63.305,43.057 84.834,21.529"
        />
        
        {/* Bottom Diamond */}
        <polygon
          fill={currentColors.primary}
          points="63.305,83.553 41.777,105.082 63.305,126.611 84.834,105.082"
        />
      </g>
    </svg>
  );
};

export default BinanceLogo;