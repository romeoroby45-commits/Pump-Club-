import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Database file setup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  settings: {
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
  };
  photos: Array<{
    id: string;
    url: string;
    title: string;
    createdAt: string;
  }>;
  reels: Array<{
    id: string;
    url: string;
    title: string;
    createdAt: string;
  }>;
  plans: Array<{
    id: string;
    duration: string;
    price: number;
    currency: string;
    features: string[];
    badge?: string;
    isPopular?: boolean;
    order: number;
  }>;
  subscriptions: Array<{
    id: string;
    fullName: string;
    phoneNumber: string;
    country: string;
    countryCode: string;
    subscriptionDuration: string;
    price: number;
    paymentMethod: string;
    createdAt: string;
  }>;
}

const DEFAULT_DATA: DatabaseSchema = {
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
  photos: [],
  reels: [],
  plans: [
    {
      id: 'plan-1',
      duration: 'شهر واحد (1 Month)',
      price: 800,
      currency: 'EGP',
      features: [
        'دخول يومي غير محدود للأجهزة',
        'غرف تغيير ملابس وخزائن مؤمنة',
        'متابعة قياسات أولية مع المدرب',
        'استخدام منطقة الأثقال الحرة والمشايات'
      ],
      order: 1
    },
    {
      id: 'plan-2',
      duration: '3 شهور (3 Months)',
      price: 2100,
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
  subscriptions: []
};

// Initialize DB file
function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
      reels: Array.isArray(parsed.reels) ? parsed.reels : [],
      plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : DEFAULT_DATA.plans,
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : []
    };
  } catch (err) {
    console.error('Error reading db.json, returning default:', err);
    return DEFAULT_DATA;
  }
}

function writeDb(data: DatabaseSchema): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// REST API Endpoints
app.get('/api/data', (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    settings: db.settings,
    photos: db.photos,
    reels: db.reels,
    plans: db.plans
  });
});

// Admin Authentication
const handleAdminLogin = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { username, password } = req.body || {};
  const trimmedUser = (username || '').trim();
  const trimmedPass = (password || '').trim();

  if (trimmedUser === 'Pump' && trimmedPass === '104070') {
    return res.status(200).json({
      success: true,
      token: 'pump-auth-authenticated-session-key',
      user: { username: 'Pump', role: 'admin' }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
  });
};

app.post('/api/auth/login', handleAdminLogin);
app.post('/api/login', handleAdminLogin);

// Update Settings
app.put('/api/settings', (req: Request, res: Response) => {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  writeDb(db);
  res.json({ success: true, settings: db.settings });
});

// Photos Endpoints
app.get('/api/photos', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, photos: db.photos || [] });
});

app.post('/api/photos', (req: Request, res: Response) => {
  const { url, title } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'رابط الصورة مطلوب' });
  }
  const db = readDb();
  const newPhoto = {
    id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    url: url.trim(),
    title: (title || '').trim(),
    createdAt: new Date().toISOString()
  };
  db.photos.unshift(newPhoto);
  writeDb(db);
  res.json({ success: true, photo: newPhoto, photos: db.photos });
});

app.put('/api/photos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { url, title } = req.body;
  const db = readDb();
  const idx = db.photos.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الصورة غير موجودة' });
  }
  if (url) db.photos[idx].url = url.trim();
  if (title !== undefined) db.photos[idx].title = title.trim();
  writeDb(db);
  res.json({ success: true, photo: db.photos[idx], photos: db.photos });
});

app.delete('/api/photos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.photos = db.photos.filter(p => p.id !== id);
  writeDb(db);
  res.json({ success: true, photos: db.photos });
});

// Reels Endpoints
app.get('/api/reels', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ success: true, reels: db.reels || [] });
});

app.post('/api/reels', (req: Request, res: Response) => {
  const { url, title } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'رابط الفيديو مطلوب' });
  }
  const db = readDb();
  const newReel = {
    id: 'reel-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    url: url.trim(),
    title: (title || '').trim(),
    createdAt: new Date().toISOString()
  };
  db.reels.unshift(newReel);
  writeDb(db);
  res.json({ success: true, reel: newReel, reels: db.reels });
});

app.put('/api/reels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { url, title } = req.body;
  const db = readDb();
  const idx = db.reels.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الفيديو غير موجود' });
  }
  if (url) db.reels[idx].url = url.trim();
  if (title !== undefined) db.reels[idx].title = title.trim();
  writeDb(db);
  res.json({ success: true, reel: db.reels[idx], reels: db.reels });
});

app.delete('/api/reels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.reels = db.reels.filter(r => r.id !== id);
  writeDb(db);
  res.json({ success: true, reels: db.reels });
});

// Plans Endpoints
app.post('/api/plans', (req: Request, res: Response) => {
  const { duration, price, features, badge, isPopular } = req.body;
  if (!duration || price === undefined) {
    return res.status(400).json({ error: 'مدة الاشتراك والسعر مطلوبان' });
  }
  const db = readDb();
  const newPlan = {
    id: 'plan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    duration: String(duration).trim(),
    price: Number(price),
    currency: 'EGP',
    features: Array.isArray(features) ? features : [],
    badge: badge ? String(badge).trim() : undefined,
    isPopular: Boolean(isPopular),
    order: db.plans.length + 1
  };
  db.plans.push(newPlan);
  writeDb(db);
  res.json({ success: true, plan: newPlan, plans: db.plans });
});

app.put('/api/plans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { duration, price, features, badge, isPopular, order } = req.body;
  const db = readDb();
  const idx = db.plans.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الاشتراك غير موجود' });
  }
  if (duration !== undefined) db.plans[idx].duration = String(duration).trim();
  if (price !== undefined) db.plans[idx].price = Number(price);
  if (features !== undefined) db.plans[idx].features = Array.isArray(features) ? features : [];
  if (badge !== undefined) db.plans[idx].badge = badge ? String(badge).trim() : undefined;
  if (isPopular !== undefined) db.plans[idx].isPopular = Boolean(isPopular);
  if (order !== undefined) db.plans[idx].order = Number(order);

  writeDb(db);
  res.json({ success: true, plan: db.plans[idx], plans: db.plans });
});

app.delete('/api/plans/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.plans = db.plans.filter(p => p.id !== id);
  writeDb(db);
  res.json({ success: true, plans: db.plans });
});

app.put('/api/plans-reorder', (req: Request, res: Response) => {
  const { planIds } = req.body;
  if (!Array.isArray(planIds)) {
    return res.status(400).json({ error: 'ترتيب الاشتراكات غير صالح' });
  }
  const db = readDb();
  const planMap = new Map(db.plans.map(p => [p.id, p]));
  const reordered: typeof db.plans = [];
  planIds.forEach((id, idx) => {
    const plan = planMap.get(id);
    if (plan) {
      plan.order = idx + 1;
      reordered.push(plan);
      planMap.delete(id);
    }
  });
  // append any remaining
  planMap.forEach(plan => {
    plan.order = reordered.length + 1;
    reordered.push(plan);
  });
  db.plans = reordered;
  writeDb(db);
  res.json({ success: true, plans: db.plans });
});

// Record customer registration on backend as well
app.post('/api/subscriptions', (req: Request, res: Response) => {
  const { fullName, phoneNumber, country, countryCode, subscriptionDuration, price, paymentMethod } = req.body;
  const db = readDb();
  const sub = {
    id: 'sub-' + Date.now(),
    fullName: fullName || '',
    phoneNumber: phoneNumber || '',
    country: country || '',
    countryCode: countryCode || '',
    subscriptionDuration: subscriptionDuration || '',
    price: Number(price) || 0,
    paymentMethod: paymentMethod || 'Vodafone Cash',
    createdAt: new Date().toISOString()
  };
  db.subscriptions.unshift(sub);
  writeDb(db);
  res.json({ success: true, subscription: sub });
});

app.get('/api/subscriptions', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ subscriptions: db.subscriptions || [] });
});

// Vite or Static Serving
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pump Club server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
