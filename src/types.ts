export interface GymSettings {
  gymName: string;
  gymTagline: string;
  welcomeTitle: string;
  welcomeText: string;
  whatsappNumber: string;
  instagramUrl: string;
  locationUrl: string;
  locationButtonText: string;
  tickerText: string;
  logoUrl: string;
  heroBadgeText: string;
  ctaButtonText: string;
  heroAnimatedBgUrl: string;
}

export interface GymPhoto {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

export interface GymReel {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  duration: string;
  price: number;
  currency: string;
  features: string[];
  badge?: string;
  isPopular?: boolean;
  order: number;
}

export interface CountryInfo {
  name: string;
  nameEn: string;
  code: string;
  dialCode: string;
  flag: string;
}

export type PaymentMethod = 'Vodafone Cash' | 'InstaPay';

export interface SubscriptionFormData {
  fullName: string;
  phoneNumber: string;
  country: string;
  countryCode: string;
  subscriptionDuration: string;
  price: number;
  paymentMethod: PaymentMethod;
}

export interface AppData {
  settings: GymSettings;
  photos: GymPhoto[];
  reels: GymReel[];
  plans: SubscriptionPlan[];
}
