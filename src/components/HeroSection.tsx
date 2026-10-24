import React from 'react';
import { GymSettings } from '../types';

interface HeroSectionProps {
  settings: GymSettings;
  onOpenSubscribe?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ settings }) => {
  const bgUrl = settings.heroAnimatedBgUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop";
  const isVideo = /\.(mp4|webm)($|\?)/i.test(bgUrl);
  // Default to 30% overlay opacity for clear, vibrant image visibility while keeping text legible
  const overlayOpacity = typeof settings.heroOverlayOpacity === 'number'
    ? Math.max(0, Math.min(100, settings.heroOverlayOpacity))
    : 30;

  return (
    <section id="hero" className="relative min-h-[75vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-black py-20 px-4">
      {/* 
        Main Hero Media: Full natural brightness and clarity as requested.
        Can be an image, animated media, or video loop.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {isVideo ? (
          <video
            src={bgUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center filter brightness-100 contrast-105"
          />
        ) : (
          <img
            src={bgUrl}
            alt="Pump Club Athletic Atmosphere"
            className="w-full h-full object-cover object-center filter brightness-100 contrast-105 transform scale-105 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
        )}

        {/* 
          Dashboard-controlled Overlay Opacity Scrim:
          Allows admin to adjust from 0% (fully transparent / crystal clear) to darker levels.
        */}
        <div
          className="absolute inset-0 bg-black transition-opacity duration-300"
          style={{ opacity: overlayOpacity / 100 }}
        />

        {/* Elegant top & bottom edge blending without red glare */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Content Area - Clean, elegant English welcome with no red overlay glare */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center px-4">
        
        {/* Elegant monochrome badge (red highlight removed) */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-700/80 text-neutral-200 text-xs sm:text-sm font-bold tracking-widest uppercase mb-6 shadow-xl shadow-black/50">
          <span>THE ULTIMATE 24/7 FITNESS & BODYBUILDING DESTINATION</span>
        </div>

        {/* Elegant typography (red text replaced with refined white/silver styling) */}
        <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl tracking-tight text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] mb-4">
          WELCOME TO <span className="text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]">PUMP CLUB</span>
        </h1>

        <p className="font-display font-bold text-lg sm:text-2xl text-neutral-100 tracking-wide uppercase mb-4 max-w-2xl drop-shadow-[0_2px_15px_rgba(0,0,0,0.95)]">
          WHERE DISCIPLINE MEETS UNSTOPPABLE POWER
        </p>

        <p className="text-neutral-200 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed font-normal drop-shadow-[0_2px_15px_rgba(0,0,0,0.95)]">
          Forge your ultimate physique with world-class bodybuilding equipment, 24-hour round-the-clock access, and an electrifying training atmosphere built for champions.
        </p>
      </div>
    </section>
  );
};
