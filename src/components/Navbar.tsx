import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { GymSettings } from '../types';

interface NavbarProps {
  settings: GymSettings;
  onOpenSubscribe?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'الرئيسية', href: '#hero' },
    { label: 'مميزات الجيم', href: '#features' },
    { label: 'صور الصالة', href: '#photos' },
    { label: 'الفيديوهات والريلز', href: '#reels' },
    { label: 'باقات الاشتراكات', href: '#plans' },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070707]/95 backdrop-blur-md border-b border-neutral-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
        
        {/* Clean, minimal, professional navigation links on the LEFT */}
        <nav className="hidden lg:flex items-center gap-7 order-1">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleLinkClick(link.href)}
              className="text-neutral-300 hover:text-red-500 text-sm sm:text-base font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Mobile menu hamburger button on the LEFT */}
        <div className="flex lg:hidden items-center order-1">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 text-neutral-300 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none cursor-pointer"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* 
          MANDATORY: 
          Name PUMP CLUB ONLY.
          NO logo shape, NO icon, NO image.
          Clean, premium typography fitting the black and red design.
        */}
        <div className="flex items-center h-full py-1.5 shrink-0 order-2">
          <a
            href="#hero"
            onClick={(e) => { e.preventDefault(); handleLinkClick('#hero'); }}
            className="group flex items-center select-none cursor-pointer"
            aria-label="PUMP CLUB"
          >
            <span className="font-display font-black tracking-wider text-2xl sm:text-3xl md:text-4xl uppercase text-white transition-colors duration-200">
              PUMP <span className="text-red-600 group-hover:text-red-500 transition-colors">CLUB</span>
            </span>
          </a>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-neutral-800 bg-[#0a0a0a] px-5 pt-3 pb-6 space-y-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleLinkClick(link.href)}
                className="text-right px-4 py-3 text-neutral-200 hover:bg-neutral-900 hover:text-red-500 rounded-xl text-sm font-semibold transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
