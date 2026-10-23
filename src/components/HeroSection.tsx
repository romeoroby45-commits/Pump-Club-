import React from 'react';
import { GymSettings } from '../types';

interface HeroSectionProps {
  settings: GymSettings;
  onOpenSubscribe?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ settings }) => {
  const bgUrl = settings.heroAnimatedBgUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop";
  const isVideo = /\.(mp4|webm)($|\?)/i.test(bgUrl);

  return (
    <section id="hero" className="relative min-h-[75vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-black py-20 px-4">
      {/* 
        MANDATORY: Animated Background / Media manageable from Admin Dashboard.
        Can be an animated GIF, animated photo, or video loop.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {isVideo ? (
          <video
            src={bgUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center filter brightness-60 contrast-110"
          />
        ) : (
          <img
            src={bgUrl}
            alt="Pump Club Athletic Atmosphere"
            className="w-full h-full object-cover object-center filter brightness-60 contrast-110 transform scale-105 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
        )}

        {/* 
          MANDATORY: Measured High-Contrast Dark Overlay Scrim 
          Guarantees text readability over any animated background
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
        
        {/* Subtle athletic red atmospheric glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Content Area - Clean English Welcome - NO LOGO HERE (Logo is strictly in Navbar) */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center px-4">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-600/40 text-red-400 text-xs sm:text-sm font-black tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
          <span>THE ULTIMATE 24/7 FITNESS & BODYBUILDING DESTINATION</span>
        </div>

        <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl tracking-tight text-white uppercase drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] mb-4">
          WELCOME TO <span className="text-red-500">PUMP CLUB</span>
        </h1>

        <p className="font-display font-bold text-lg sm:text-2xl text-neutral-200 tracking-wide uppercase mb-4 max-w-2xl drop-shadow-md">
          WHERE DISCIPLINE MEETS UNSTOPPABLE POWER
        </p>

        <p className="text-neutral-300 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed drop-shadow-md font-normal">
          Forge your ultimate physique with world-class bodybuilding equipment, 24-hour round-the-clock access, and an electrifying training atmosphere built for champions.
        </p>

        {/* 
          NO 3 BUTTONS OR CARDS HERE AS STRICTLY REQUESTED:
          1. Join Now removed.
          2. Location removed.
          3. Plans removed.
          No replacement put in this place.
        */}

      </div>
    </section>
  );
};
