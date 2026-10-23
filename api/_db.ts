import fs from 'fs';
import path from 'path';

export const DEFAULT_DATA = {
  settings: {
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
  },
  photos: [] as Array<{ id: string; url: string; title: string; createdAt: string }>,
  reels: [] as Array<{ id: string; url: string; title: string; createdAt: string }>,
  plans: [
    {
      id: 'plan-1',
      duration: 'شهر واحد (1 Month)',
      price: 650,
      currency: 'EGP',
      features: [
        'دخول يومي غير محدود للأجهزة',
        'غرف تغيير ملابس وخزائن مؤمنة',
        'متابعة قياسات أولية مع المدرب',
        'استخدام منطقة الأثقال الحرة والمشايات'
      ],
      order: 1,
      isPopular: false
    },
    {
      id: 'plan-2',
      duration: '3 شهور (3 Months)',
      price: 1300,
      currency: 'EGP',
      features: [
        'دخول يومي غير محدود طوال الفترة',
        'خطة تدريبية وتوجيه تغذية مخصص',
        'فحص قياسات جسم InBody شهرياً مجاناً',
        'دعوة صديق مجانية لمرتين',
        'إمكانية تجميد الاشتراك لمدة 10 أيام'
      ],
      badge: 'الأكثر طلباً',
      isPopular: true,
      order: 2
    },
    {
      id: 'plan-3',
      duration: '6 شهور (6 Months)',
      price: 3800,
      currency: 'EGP',
      features: [
        'دخول شامل ومفتوح لجميع الصالات',
        'برنامج متكامل للياقة وبناء العضلات',
        'فحص دوري ونظام متابعة مستمر',
        'جلسة تدريب شخصي مجانية (PT Session)',
        'إمكانية تجميد الاشتراك لمدة 20 يوماً'
      ],
      order: 3
    },
    {
      id: 'plan-4',
      duration: 'سنة كاملة (1 Year)',
      price: 6500,
      currency: 'EGP',
      features: [
        'عضوية VIP سنوية كاملة بدون قيود',
        '3 جلسات تدريب شخصي مع كابتن النادي',
        'متابعة وتحديث شهري للبرامج التدريبية',
        'إمكانية تجميد الاشتراك لمدة 45 يوماً',
        'أفضل قيمة توفير مقابل السعر'
      ],
      badge: 'أفضل توفير',
      order: 4
    }
  ],
  subscriptions: [] as Array<any>
};

export function readServerlessDb(): any {
  // First check /tmp
  const tmpPath = path.join('/tmp', 'pump_db.json');
  if (fs.existsSync(tmpPath)) {
    try {
      const raw = fs.readFileSync(tmpPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        return {
          settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
          photos: Array.isArray(parsed.photos) ? parsed.photos : [],
          reels: Array.isArray(parsed.reels) ? parsed.reels : [],
          plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : DEFAULT_DATA.plans,
          subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : []
        };
      }
    } catch (e) {
      console.error('Error reading tmp db:', e);
    }
  }

  // Second check project data/db.json
  const rootDataPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(rootDataPath)) {
    try {
      const raw = fs.readFileSync(rootDataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        return {
          settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
          photos: Array.isArray(parsed.photos) ? parsed.photos : [],
          reels: Array.isArray(parsed.reels) ? parsed.reels : [],
          plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : DEFAULT_DATA.plans,
          subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : []
        };
      }
    } catch (e) {
      console.error('Error reading root db:', e);
    }
  }

  return DEFAULT_DATA;
}

export function writeServerlessDb(data: any): boolean {
  let written = false;

  // Attempt 1: write to project root data/db.json
  try {
    const rootDataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(rootDataDir)) {
      fs.mkdirSync(rootDataDir, { recursive: true });
    }
    const rootDataPath = path.join(rootDataDir, 'db.json');
    fs.writeFileSync(rootDataPath, JSON.stringify(data, null, 2), 'utf-8');
    written = true;
  } catch {
    // Expected on read-only serverless roots (Vercel Lambda)
  }

  // Attempt 2: write to /tmp/pump_db.json (always writable in Serverless)
  try {
    const tmpPath = path.join('/tmp', 'pump_db.json');
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    written = true;
  } catch (e) {
    console.error('Error writing /tmp db:', e);
  }

  return written;
}
