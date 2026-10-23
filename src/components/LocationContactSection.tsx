import React from 'react';
import { GymSettings } from '../types';

interface LocationContactSectionProps {
  settings?: GymSettings;
  onOpenSubscribe?: () => void;
}

export const LocationContactSection: React.FC<LocationContactSectionProps> = () => {
  const features = [
    {
      en: '24/7 ACCESS',
      ar: 'دخول الجيم على مدار 24 ساعة',
      id: '01'
    },
    {
      en: 'MIXED GYM',
      ar: 'جيم ميكس',
      id: '02'
    },
    {
      en: 'PREMIUM EQUIPMENT',
      ar: 'أجهزة ومعدات متطورة',
      id: '03'
    },
    {
      en: 'PROFESSIONAL ATMOSPHERE',
      ar: 'أجواء تدريب احترافية',
      id: '04'
    },
    {
      en: 'BODYBUILDING & FITNESS',
      ar: 'متخصص في كمال الأجسام واللياقة البدنية',
      id: '05'
    }
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* 
        MANDATORY: ONE single connected section.
        NO separate cards, NO boxes.
        Clean, modern, premium black and red design.
      */}
      <div className="relative rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800/80 p-8 sm:p-14 lg:p-16 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        
        {/* Subtle Luxury Red Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-700/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-red-500 font-display">
              PUMP CLUB ATTRIBUTES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-display mt-2">
              مميزات الجيم
            </h2>
            <div className="w-16 h-1 bg-red-600 mx-auto mt-4 rounded-full" />
          </div>

          {/* 
            MANDATORY: 
            Single connected flow with stylish, premium English font as primary text, 
            and Arabic translation directly underneath.
            Clean, divider-separated, no individual boxes.
          */}
          <div className="divide-y divide-neutral-900 border-y border-neutral-900">
            {features.map((item) => (
              <div
                key={item.id}
                className="py-7 sm:py-9 flex items-center justify-between gap-4 group hover:bg-neutral-900/30 px-3 sm:px-6 transition-colors duration-200"
              >
                {/* Left/Main Block: English first & prominent, Arabic directly underneath */}
                <div className="text-left" dir="ltr">
                  <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-wider uppercase transition-colors duration-200 group-hover:text-red-500">
                    {item.en}
                  </h3>
                  <p className="text-neutral-400 font-semibold text-sm sm:text-base md:text-lg mt-1 tracking-normal" dir="rtl">
                    {item.ar}
                  </p>
                </div>

                {/* Minimal red index accent */}
                <div className="text-neutral-700 group-hover:text-red-600/70 font-mono text-xs sm:text-sm font-bold tracking-widest transition-colors shrink-0">
                  {item.id}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
