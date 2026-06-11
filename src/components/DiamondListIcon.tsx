import React from 'react';

const DiamondListIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.4))' }}
  >
    <defs>
      <linearGradient id="goldGradient" x1="4" y1="7" x2="20" y2="17" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="50%" stopColor="#F9E29C" />
        <stop offset="100%" stopColor="#D4AF37" />
      </linearGradient>
      <linearGradient id="diamondGradient" x1="16" y1="14" x2="22" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00f2ff" />
        <stop offset="100%" stopColor="#0099ff" />
      </linearGradient>
    </defs>
    <line x1="4" y1="8" x2="20" y2="8" stroke="url(#goldGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="4" y1="13" x2="20" y2="13" stroke="url(#goldGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="4" y1="18" x2="14" y2="18" stroke="url(#goldGradient)" strokeWidth="2.5" strokeLinecap="round" />
    <path 
      d="M19 14.5L22 17.5L19 20.5L16 17.5L19 14.5Z" 
      fill="url(#diamondGradient)" 
    />
    <circle cx="19" cy="17.5" r="4" fill="#00f2ff" fillOpacity="0.2">
      <animate attributeName="r" values="3.5;5;3.5" dur="3s" repeatCount="indefinite" />
      <animate attributeName="fillOpacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export default DiamondListIcon;
