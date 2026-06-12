import React from 'react';

interface ManaLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
}

export default function ManaLogo({ size = 48, className = '', showText = false }: ManaLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Handcrafted, pixel-perfect, highly scalable SVG representing the original Maná Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
        referrerPolicy="no-referrer"
      >
        {/* Step 1: Deep Blue Silhouette of the Open Book */}
        <path
          d="M 50 20 
             C 38 16, 18 12, 5 9 
             L 5 80 
             C 18 76, 33 79, 39 80 
             C 44 80, 44 81, 46 84 
             L 50 84
             L 54 84 
             C 56 81, 56 80, 61 80 
             C 67 79, 82 76, 95 80 
             L 95 9 
             C 82 12, 62 16, 50 20 Z"
          fill="#2B3890"
        />

        {/* Step 2: White Interior Page of the Left Wing */}
        <path
          d="M 47.5 24.5 
             C 38 21.5, 22 18.5, 12.5 14.5 
             L 12.5 71.5 
             C 22 75.5, 38 74.5, 47.5 73.5 Z"
          fill="#FFFFFF"
        />

        {/* Step 3: Red Globe Circle overlapping the center */}
        <circle cx="50" cy="48" r="23" fill="#E31C24" />

        {/* Step 4: White dynamic curved brush strokes sweep across the red globe */}
        {/* These strokes dip gracefully in the middle and extend slightly out on the sides */}
        
        {/* Stroke 1 (Topmost) */}
        <path
          d="M 24 35
             C 32 30, 65 30, 77 36
             C 71 33, 31 32, 24 35 Z"
          fill="#FFFFFF"
        />

        {/* Stroke 2 */}
        <path
          d="M 20 40
             C 30 36, 73 35, 79.5 41
             C 71 37, 28 37, 20 40 Z"
          fill="#FFFFFF"
        />

        {/* Stroke 3 (Middle) */}
        <path
          d="M 18 46
             C 28 42, 75 41, 80 48
             C 70 43, 26 43, 18 46 Z"
          fill="#FFFFFF"
        />

        {/* Stroke 4 */}
        <path
          d="M 20 53
             C 28 49, 73 48, 77 56
             C 69 50, 28 50, 20 53 Z"
          fill="#FFFFFF"
        />

        {/* Stroke 5 (Bottommost) */}
        <path
          d="M 23 60
             C 30 56, 68 55, 73 63
             C 65 57, 31 57, 23 60 Z"
          fill="#FFFFFF"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <h2 className="text-white font-black text-xl tracking-tight leading-none">Maná</h2>
          <span className="text-[10px] text-emerald-450 font-bold uppercase tracking-widest block mt-1">
            Escola Sabatina
          </span>
        </div>
      )}
    </div>
  );
}
