/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { GymPhotosSection } from './components/GymPhotosSection';
import { AnnouncementBar } from './components/AnnouncementBar';
import { PlansSection } from './components/PlansSection';
import { ReelsSection } from './components/ReelsSection';
import { LocationContactSection } from './components/LocationContactSection';
import { Footer } from './components/Footer';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminModal } from './components/AdminModal';
import { AppData, SubscriptionPlan, GymSettings } from './types';
import { api } from './services/api';

const DEFAULT_SETTINGS: GymSettings = {
  gymName: 'PUMP CLUB',
  gymTagline: 'WHERE STRENGTH MEETS GREATNESS',
  welcomeTitle: 'PUMP CLUB',
  welcomeText: 'Welcome to Pump Club. Unleash your maximum potential with world-class machinery, championship-level coaching, and an intense athletic atmosphere built for serious progress.',
  whatsappNumber: '01113220002',
  instagramUrl: 'https://www.instagram.com/pump_club_gym?stkn=MTdrZDdqZDRweTAzeA==',
  locationUrl: 'https://share.google/XTKKfHqCEi3obSBsE',
  locationButtonText: 'موقع الجيم 📍',
  tickerText: '🔥 مرحباً بكم في PUMP CLUB • تدريب احترافي بأحدث الأجهزة • عروض واشتراكات حصرية لفترة محدودة • انضم لأبطال بامب كلوب الآن! • 01113220002',
  logoUrl: 'https://i.postimg.cc/QNWQb6ND/1000254467-removebg-preview.png',
  heroBadgeText: 'ELITE FITNESS & BODYBUILDING',
  ctaButtonText: 'JOIN NOW / اشترك الآن',
  heroAnimatedBgUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop'
};

export default function App() {
  const [data, setData] = useState<AppData>({
    settings: DEFAULT_SETTINGS,
    photos: [],
    reels: [],
    plans: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedPlanForSubscribe, setSelectedPlanForSubscribe] = useState<SubscriptionPlan | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const appData = await api.getAppData();
      setData({
        settings: { ...DEFAULT_SETTINGS, ...(appData.settings || {}) },
        photos: appData.photos || [],
        reels: appData.reels || [],
        plans: appData.plans || []
      });
    } catch (err) {
      console.warn('Could not fetch app data, using fallback defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenSubscribe = (plan?: SubscriptionPlan) => {
    setSelectedPlanForSubscribe(plan || null);
    setIsSubscribeModalOpen(true);
  };

  const handleCloseSubscribe = () => {
    setIsSubscribeModalOpen(false);
    setSelectedPlanForSubscribe(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* 0. Top Navigation (NO admin button here as requested) */}
      <Navbar
        settings={data.settings}
        onOpenSubscribe={() => handleOpenSubscribe()}
      />

      {/* Main Content Flow */}
      <main className="flex-1">
        {/* 1. Hero / Welcome Section */}
        <HeroSection
          settings={data.settings}
          onOpenSubscribe={() => handleOpenSubscribe()}
        />

        {/* 2. Gym Photos Section */}
        <GymPhotosSection
          photos={data.photos}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
        />

        {/* 3. Moving Navigation / Announcement Bar */}
        <AnnouncementBar text={data.settings.tickerText} />

        {/* 4. Membership Plans */}
        <PlansSection
          plans={data.plans}
          onSelectPlan={(plan) => handleOpenSubscribe(plan)}
        />

        {/* 5. Reels / Videos Section */}
        <ReelsSection
          reels={data.reels}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
        />

        {/* 6. Location & Contact Section */}
        <LocationContactSection
          settings={data.settings}
          onOpenSubscribe={() => handleOpenSubscribe()}
        />
      </main>

      {/* 7. Footer with the MANDATORY bottom "الإعدادات" (Settings) button */}
      <Footer
        settings={data.settings}
        onOpenSettings={() => setIsAdminModalOpen(true)}
      />

      {/* Customer Subscription Form Modal with WhatsApp integration */}
      <SubscriptionModal
        isOpen={isSubscribeModalOpen}
        onClose={handleCloseSubscribe}
        plans={data.plans}
        initialPlan={selectedPlanForSubscribe}
        whatsappNumber={data.settings.whatsappNumber}
      />

      {/* Admin Dashboard Modal (Login: Pump / 104070) */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        settings={data.settings}
        photos={data.photos}
        reels={data.reels}
        plans={data.plans}
        onDataUpdated={loadData}
      />
    </div>
  );
}
