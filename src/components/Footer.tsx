import React from 'react';
import { Instagram, MessageCircle, MapPin } from 'lucide-react';
import { GymSettings } from '../types';

interface FooterProps {
  settings: GymSettings;
  onOpenSettings: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenSettings }) => {
  return (
    <footer className="bg-black border-t border-neutral-900 pt-14 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Brand Text Only - NO LOGO IMAGE HERE (Logo is strictly in Navbar) */}
        <div className="flex flex-col items-center text-center mb-8">
          <span className="font-display font-black text-3xl sm:text-4xl text-white tracking-wider uppercase">
            {settings.gymName || 'PUMP CLUB'}
          </span>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-sm">
            THE PREMIER 24/7 FITNESS & BODYBUILDING DESTINATION
          </p>
        </div>

        {/* Quick Social & Location Icons - ONLY HERE AT THE END OF THE SITE */}
        <div className="flex items-center gap-4 mb-8">
          <a
            href={`https://wa.me/2${(settings.whatsappNumber || '01113220002').replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-emerald-400 hover:border-emerald-500 flex items-center justify-center transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
          <a
            href={settings.instagramUrl || "https://www.instagram.com/pump_club_gym?stkn=MTdrZDdqZDRweTAzeA=="}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-pink-400 hover:border-pink-500 flex items-center justify-center transition-colors"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href={settings.locationUrl || "https://share.google/XTKKfHqCEi3obSBsE"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Google Maps Location"
            className="w-11 h-11 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-red-400 hover:border-red-500 flex items-center justify-center transition-colors"
          >
            <MapPin className="w-5 h-5" />
          </a>
        </div>

        {/* Divider */}
        <div className="w-full max-w-4xl border-t border-neutral-900 my-4" />

        {/* 
          Bottom row with Copyright and 
          "الإعدادات" ONLY as plain clean text (NO Admin, NO borders, NO button styling)
        */}
        <div className="w-full max-w-4xl flex items-center justify-between text-xs text-neutral-500 pt-3">
          <div>
            © {new Date().getFullYear()} {settings.gymName || 'PUMP CLUB'}. All Rights Reserved.
          </div>

          <div>
            <button
              onClick={onOpenSettings}
              className="text-neutral-500 hover:text-neutral-300 transition-colors text-xs cursor-pointer select-none"
            >
              الإعدادات
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
