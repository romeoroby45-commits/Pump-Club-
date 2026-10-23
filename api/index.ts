import { readServerlessDb, writeServerlessDb } from './_db';

export default async function handler(req: any, res: any) {
  // Set universal JSON and CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Parse request URL and path segments
  const rawUrl = req.url || '';
  const urlObj = new URL(rawUrl, 'http://localhost');
  const pathname = urlObj.pathname.replace(/^\/api\/?/, '');
  const segments = pathname.split('/').filter(Boolean);

  const route = segments[0] || '';
  const subRoute = segments[1] || '';

  // Parse request body safely
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  // ID can come from URL segment, query param, or body
  const id = subRoute || (urlObj.searchParams.get('id') as string) || (req.query?.id as string) || body?.id;

  const db = readServerlessDb();

  try {
    // 1. Admin Authentication: POST /api/auth/login or POST /api/login
    if ((route === 'auth' && subRoute === 'login') || route === 'login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'طريقة الطلب غير مسموح بها' });
      }

      const username = (body?.username || '').trim();
      const password = (body?.password || '').trim();

      if (username === 'Pump' && password === '104070') {
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
    }

    // 2. Initial Data: GET /api/data
    if (route === 'data') {
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'طريقة الطلب غير مسموح بها' });
      }
      return res.status(200).json({
        settings: db.settings,
        photos: db.photos || [],
        reels: db.reels || [],
        plans: db.plans || []
      });
    }

    // 3. Settings: GET or PUT /api/settings
    if (route === 'settings') {
      if (req.method === 'GET') {
        return res.status(200).json({ success: true, settings: db.settings });
      }
      if (req.method === 'PUT') {
        db.settings = { ...db.settings, ...(body || {}) };
        writeServerlessDb(db);
        return res.status(200).json({ success: true, settings: db.settings });
      }
      return res.status(405).json({ success: false, error: 'طريقة الطلب غير مسموح بها' });
    }

    // 4. Photos: /api/photos or /api/photos/:id
    if (route === 'photos') {
      if (req.method === 'GET') {
        return res.status(200).json({ success: true, photos: db.photos || [] });
      }

      if (req.method === 'POST') {
        const url = body?.url;
        const title = body?.title;

        if (!url || typeof url !== 'string' || !url.trim()) {
          return res.status(400).json({ success: false, error: 'رابط الصورة مطلوب' });
        }

        const newPhoto = {
          id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          url: url.trim(),
          title: (title || '').trim(),
          createdAt: new Date().toISOString()
        };

        if (!Array.isArray(db.photos)) {
          db.photos = [];
        }

        db.photos.unshift(newPhoto);
        writeServerlessDb(db);

        return res.status(200).json({
          success: true,
          photo: newPhoto,
          photos: db.photos
        });
      }

      if (req.method === 'PUT') {
        if (!id) {
          return res.status(400).json({ success: false, error: 'معرف الصورة مطلوب' });
        }

        const idx = db.photos.findIndex((p: any) => p.id === id);
        if (idx === -1) {
          return res.status(404).json({ success: false, error: 'الصورة غير موجودة' });
        }

        if (body?.url) db.photos[idx].url = String(body.url).trim();
        if (body?.title !== undefined) db.photos[idx].title = String(body.title).trim();

        writeServerlessDb(db);
        return res.status(200).json({
          success: true,
          photo: db.photos[idx],
          photos: db.photos
        });
      }

      if (req.method === 'DELETE') {
        if (!id) {
          return res.status(400).json({ success: false, error: 'معرف الصورة مطلوب' });
        }

        db.photos = db.photos.filter((p: any) => p.id !== id);
        writeServerlessDb(db);
        return res.status(200).json({ success: true, photos: db.photos });
      }

      return res.status(405).json({ success: false, error: `طريقة الطلب ${req.method} غير مسموح بها` });
    }

    // 5. Reels: /api/reels or /api/reels/:id
    if (route === 'reels') {
      if (req.method === 'GET') {
        return res.status(200).json({ success: true, reels: db.reels || [] });
      }

      if (req.method === 'POST') {
        const url = body?.url;
        const title = body?.title;

        if (!url || typeof url !== 'string' || !url.trim()) {
          return res.status(400).json({ success: false, error: 'رابط الفيديو مطلوب' });
        }

        const newReel = {
          id: 'reel-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          url: url.trim(),
          title: (title || '').trim(),
          createdAt: new Date().toISOString()
        };

        if (!Array.isArray(db.reels)) {
          db.reels = [];
        }

        db.reels.unshift(newReel);
        writeServerlessDb(db);

        return res.status(200).json({
          success: true,
          reel: newReel,
          reels: db.reels
        });
      }

      if (req.method === 'PUT') {
        if (!id) {
          return res.status(400).json({ success: false, error: 'معرف الفيديو مطلوب' });
        }

        const idx = db.reels.findIndex((r: any) => r.id === id);
        if (idx === -1) {
          return res.status(404).json({ success: false, error: 'الفيديو غير موجود' });
        }

        if (body?.url) db.reels[idx].url = String(body.url).trim();
        if (body?.title !== undefined) db.reels[idx].title = String(body.title).trim();

        writeServerlessDb(db);
        return res.status(200).json({
          success: true,
          reel: db.reels[idx],
          reels: db.reels
        });
      }

      if (req.method === 'DELETE') {
        if (!id) {
          return res.status(400).json({ success: false, error: 'معرف الفيديو مطلوب' });
        }

        db.reels = db.reels.filter((r: any) => r.id !== id);
        writeServerlessDb(db);
        return res.status(200).json({ success: true, reels: db.reels });
      }

      return res.status(405).json({ success: false, error: `طريقة الطلب ${req.method} غير مسموح بها` });
    }

    // 6. Plans: /api/plans or /api/plans/:id
    if (route === 'plans') {
      if (req.method === 'GET') {
        return res.status(200).json({ success: true, plans: db.plans || [] });
      }

      if (req.method === 'POST') {
        const { duration, price, features, badge, isPopular } = body || {};

        if (!duration || price === undefined) {
          return res.status(400).json({ success: false, error: 'مدة الاشتراك والسعر مطلوبان' });
        }

        const newPlan = {
          id: 'plan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          duration: String(duration).trim(),
          price: Number(price),
          currency: 'EGP',
          features: Array.isArray(features) ? features : [],
          badge: badge ? String(badge).trim() : undefined,
          isPopular: Boolean(isPopular),
          order: (db.plans?.length || 0) + 1
        };

        if (!Array.isArray(db.plans)) {
          db.plans = [];
        }

        db.plans.push(newPlan);
        writeServerlessDb(db);

        return res.status(200).json({
          success: true,
          plan: newPlan,
          plans: db.plans
        });
      }

      if (req.method === 'PUT') {
        if (!id) {
          return res.status(400).json({ success: false, error: 'معرف الاشتراك مطلوب' });
        }

        const idx = db.plans.findIndex((p: any) => p.id === id);
        if (idx === -1) {
          return res.status(404).json({ success: false, error: 'الاشتراك غير موجود' });
        }

        const { duration, price, features, badge, isPopular, order } = body;
        if (duration !== undefined) db.plans[idx].duration = String(duration).trim();
        if (price !== undefined) db.plans[idx].price = Number(price);
        if (features !== undefined) db.plans[idx].features = Array.isArray(features) ? features : [];
        if (badge !== undefined) db.plans[idx].badge = badge ? String(badge).trim() : undefined;
        if (isPopular !== undefined) db.plans[idx].isPopular = Boolean(isPopular);
        if (order !== undefined) db.plans[idx].order = Number(order);

        writeServerlessDb(db);
        return res.status(200).json({
          success: true,
          plan: db.plans[idx],
          plans: db.plans
        });
      }

      if (req.method === 'DELETE') {
        if (!id) {
          return res.status(400).json({ success: false, error: 'معرف الاشتراك مطلوب' });
        }

        db.plans = db.plans.filter((p: any) => p.id !== id);
        writeServerlessDb(db);
        return res.status(200).json({ success: true, plans: db.plans });
      }

      return res.status(405).json({ success: false, error: `طريقة الطلب ${req.method} غير مسموح بها` });
    }

    // 7. Plan Reordering: PUT /api/plans-reorder
    if (route === 'plans-reorder') {
      if (req.method !== 'PUT') {
        return res.status(405).json({ success: false, error: 'طريقة الطلب غير مسموح بها' });
      }

      const { planIds } = body || {};
      if (!Array.isArray(planIds)) {
        return res.status(400).json({ success: false, error: 'ترتيب الاشتراكات غير صالح' });
      }

      const planMap = new Map<string, any>((db.plans || []).map((p: any) => [p.id, p]));
      const reordered: any[] = [];

      planIds.forEach((pId: string, idx: number) => {
        const plan = planMap.get(pId);
        if (plan) {
          plan.order = idx + 1;
          reordered.push(plan);
          planMap.delete(pId);
        }
      });

      planMap.forEach((plan: any) => {
        reordered.push(plan);
      });

      db.plans = reordered;
      writeServerlessDb(db);

      return res.status(200).json({ success: true, plans: db.plans });
    }

    // 8. Subscriptions: /api/subscriptions
    if (route === 'subscriptions') {
      if (req.method === 'GET') {
        return res.status(200).json({ success: true, subscriptions: db.subscriptions || [] });
      }

      if (req.method === 'POST') {
        const { fullName, phoneNumber, country, countryCode, subscriptionDuration, price, paymentMethod } = body || {};

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

        if (!Array.isArray(db.subscriptions)) {
          db.subscriptions = [];
        }

        db.subscriptions.unshift(sub);
        writeServerlessDb(db);

        return res.status(200).json({ success: true, subscription: sub });
      }

      return res.status(405).json({ success: false, error: `طريقة الطلب ${req.method} غير مسموح بها` });
    }

    return res.status(404).json({ success: false, error: `الرابط /api/${pathname} غير موجود` });
  } catch (error: any) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'حدث خطأ داخلي في الخادم'
    });
  }
}
