import React from 'react';
import { Flame, BellRing } from 'lucide-react';

interface AnnouncementBarProps {
  text: string;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ text }) => {
  const defaultText = text || '🔥 مرحباً بكم في PUMP CLUB • تدريب احترافي بأحدث الأجهزة • عروض واشتراكات حصرية لفترة محدودة • انضم لأبطال بامب كلوب الآن! • 01113220002';

  // Repeat the message so ticker loops seamlessly
  const items = Array(6).fill(defaultText);

  return (
    <div className="relative w-full bg-red-600 text-white overflow-hidden py-3 shadow-[0_0_20px_rgba(220,38,38,0.35)] border-y border-red-500 select-none">
      {/* Edge gradient fades for seamless entry/exit */}
      <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-red-600 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-red-600 to-transparent z-10 pointer-events-none" />

      <div className="flex w-max animate-marquee-rtl font-semibold text-sm sm:text-base tracking-wide items-center">
        {items.map((msg, index) => (
          <div key={index} className="flex items-center gap-4 px-6 shrink-0">
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4 fill-white text-white shrink-0" />
              <span>{msg}</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-white/70 shrink-0" />
            <span className="font-display font-black tracking-widest text-xs uppercase px-2 py-0.5 rounded bg-black/30">
              PUMP CLUB
            </span>
            <span className="w-2 h-2 rounded-full bg-white/70 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
