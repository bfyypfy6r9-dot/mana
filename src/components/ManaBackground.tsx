import React from 'react';

export default function ManaBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden bg-[#FAF6F0]">
      {/* Soft orange/peach ambient blur blobs representing the orange background shapes of the image */}
      <div 
        className="absolute top-0 right-0 w-[55vw] h-[55vh] rounded-full bg-[#E58E58]/12 blur-[100px] translate-x-[10%] translate-y-[-10%]" 
        style={{ contentVisibility: 'auto' }}
      />
      <div 
        className="absolute bottom-0 left-[5%] w-[60vw] h-[50vh] rounded-full bg-[#F39C12]/8 blur-[120px] translate-y-[20%]" 
        style={{ contentVisibility: 'auto' }}
      />
      <div 
        className="absolute top-[25%] left-[-10%] w-[45vw] h-[45vh] rounded-full bg-[#E67E22]/6 blur-[110px]" 
        style={{ contentVisibility: 'auto' }}
      />

      {/* Decorative vectors: elegant curves that match the organic waves of the banner */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.22]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path 
          d="M -100,250 C 350,150 550,550 950,300 C 1250,180 1550,450 2050,250" 
          fill="none" 
          stroke="#E58E58" 
          strokeWidth="1.5" 
          strokeOpacity="0.4"
          className="animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <path 
          d="M -50,480 C 450,320 650,750 1050,480 C 1350,320 1650,600 2150,380" 
          fill="none" 
          stroke="#F1935C" 
          strokeWidth="1.2" 
          strokeOpacity="0.3"
          strokeDasharray="6 4"
        />
        <path 
          d="M 100,-10 C 400,200 800,50 1200,300 C 1500,450 1800,100 2100,50" 
          fill="none" 
          stroke="#E67E22" 
          strokeWidth="1" 
          strokeOpacity="0.2"
        />
      </svg>

      {/* Extreme light watermark graphic of Sabbath School community and books */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.035] md:opacity-[0.05] p-6 text-center">
        <div className="flex flex-col items-center max-w-lg mt-16">
          {/* Subtle outline representing the open Sabbath School book with a globe/heart element */}
          <svg width="220" height="220" viewBox="0 0 100 100" fill="none" className="text-[#92400e]" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M 50 20 C 38 16, 18 12, 5 9 L 5 80 C 18 76, 33 79, 39 80 C 44 80, 44 81, 46 84 L 54 84 C 56 81, 56 80, 61 80 C 67 79, 82 76, 95 80 L 95 9 C 82 12, 62 16, 50 20 Z" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinejoin="round" 
            />
            <path d="M 50 20 L 50 84" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="50" cy="48" r="23" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
            {/* Soft study curves */}
            <path d="M 15 25 C 28 29, 38 29, 45 28" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 15 40 C 28 44, 38 44, 45 43" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 15 55 C 28 59, 38 59, 45 58" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 55 28 C 62 29, 72 29, 85 25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 55 43 C 62 44, 72 44, 85 40" stroke="currentColor" strokeWidth="1.5" />
            <path d="M 55 58 C 62 59, 72 59, 85 55" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="text-4xl font-extrabold tracking-[0.3em] text-[#92400e] font-sans mt-4 uppercase">MANÁ</span>
          <span className="text-[10px] font-black tracking-[0.4em] text-[#78350f] uppercase mt-2 block whitespace-nowrap">
            Cada Dia, Cada Um, Cada Manhã
          </span>
        </div>
      </div>
    </div>
  );
}
