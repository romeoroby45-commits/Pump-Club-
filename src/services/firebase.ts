import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { GymPhoto, GymReel, GymSettings, SubscriptionPlan, SubscriptionFormData, AppData } from '../types';

// Initialize Firebase App & Services
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as mandated by the Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Initial Default Gym Data
export const INITIAL_SETTINGS: GymSettings = {
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

export const INITIAL_PLANS: SubscriptionPlan[] = [
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
    order: 1,
    isPopular: false
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
];

export const INITIAL_PHOTOS: GymPhoto[] = [
  {
    id: 'photo-default-1',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop',
    title: 'منطقة الأثقال الحرة والمعدات الاحترافية',
    createdAt: new Date().toISOString()
  },
  {
    id: 'photo-default-2',
    url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1375&auto=format&fit=crop',
    title: 'أجهزة الكارديو واللياقة البدنية',
    createdAt: new Date().toISOString()
  },
  {
    id: 'photo-default-3',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop',
    title: 'صالة كمال الأجسام والقوة',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_REELS: GymReel[] = [
  {
    id: 'reel-default-1',
    url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    title: 'تمارين القوة والتحفيز في PUMP CLUB',
    createdAt: new Date().toISOString()
  }
];

// Seed initial data to cloud Firestore if empty
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  const path = 'settings/general';
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, 'settings', 'general'), {
        ...INITIAL_SETTINGS,
        updatedAt: new Date().toISOString()
      });

      // Seed initial plans
      for (const plan of INITIAL_PLANS) {
        await setDoc(doc(db, 'plans', plan.id), plan);
      }

      // Seed initial photos
      for (const photo of INITIAL_PHOTOS) {
        await setDoc(doc(db, 'photos', photo.id), photo);
      }

      // Seed initial reels
      for (const reel of INITIAL_REELS) {
        await setDoc(doc(db, 'reels', reel.id), reel);
      }

      console.log('✅ Seeded initial Pump Club data to cloud Firestore successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Initial seed skipped or permission not granted yet:', error);
    return false;
  }
}

// Real-Time Listeners for Multi-Device Instant Synchronization
export function subscribeToGymData(
  onData: (data: AppData) => void,
  onError?: (err: any) => void
): () => void {
  let currentSettings = INITIAL_SETTINGS;
  let currentPlans = INITIAL_PLANS;
  let currentPhotos = INITIAL_PHOTOS;
  let currentReels = INITIAL_REELS;

  const emit = () => {
    onData({
      settings: currentSettings,
      plans: currentPlans,
      photos: currentPhotos,
      reels: currentReels
    });
  };

  // 1. Settings listener
  const unsubSettings = onSnapshot(
    doc(db, 'settings', 'general'),
    (snapshot) => {
      if (snapshot.exists()) {
        currentSettings = { ...INITIAL_SETTINGS, ...(snapshot.data() as GymSettings) };
      }
      emit();
    },
    (err) => {
      console.warn('Settings snapshot error:', err);
      onError?.(err);
    }
  );

  // 2. Plans listener (ordered)
  const unsubPlans = onSnapshot(
    query(collection(db, 'plans'), orderBy('order', 'asc')),
    (snapshot) => {
      if (!snapshot.empty) {
        const loaded: SubscriptionPlan[] = [];
        snapshot.forEach((d) => {
          loaded.push({ id: d.id, ...(d.data() as Omit<SubscriptionPlan, 'id'>) });
        });
        currentPlans = loaded;
      }
      emit();
    },
    (err) => {
      console.warn('Plans snapshot error:', err);
      onError?.(err);
    }
  );

  // 3. Photos listener (updates in real time on add, edit, or delete)
  const unsubPhotos = onSnapshot(
    collection(db, 'photos'),
    (snapshot) => {
      const loaded: GymPhoto[] = [];
      snapshot.forEach((d) => {
        loaded.push({ id: d.id, ...(d.data() as Omit<GymPhoto, 'id'>) });
      });
      currentPhotos = loaded;
      emit();
    },
    (err) => {
      console.warn('Photos snapshot error:', err);
      onError?.(err);
    }
  );

  // 4. Reels listener (updates in real time on add, edit, or delete)
  const unsubReels = onSnapshot(
    collection(db, 'reels'),
    (snapshot) => {
      const loaded: GymReel[] = [];
      snapshot.forEach((d) => {
        loaded.push({ id: d.id, ...(d.data() as Omit<GymReel, 'id'>) });
      });
      currentReels = loaded;
      emit();
    },
    (err) => {
      console.warn('Reels snapshot error:', err);
      onError?.(err);
    }
  );

  return () => {
    unsubSettings();
    unsubPlans();
    unsubPhotos();
    unsubReels();
  };
}

// Authentication Helpers
export async function signInAdminWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (err) {
    console.error('Google Sign-in failed:', err);
    throw err;
  }
}

export async function logOutAdmin(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Database Mutation APIs (Cloud Firestore)
export async function updateCloudSettings(settings: Partial<GymSettings>): Promise<GymSettings> {
  const path = 'settings/general';
  try {
    const fullSettings: GymSettings = {
      ...INITIAL_SETTINGS,
      ...settings,
      updatedAt: new Date().toISOString()
    } as any;

    await setDoc(doc(db, 'settings', 'general'), fullSettings, { merge: true });
    return fullSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Photos CRUD
export async function addCloudPhoto(photo: { url: string; title: string }): Promise<GymPhoto> {
  const id = 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const path = `photos/${id}`;
  const newPhoto: GymPhoto = {
    id,
    url: photo.url.trim(),
    title: (photo.title || '').trim(),
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'photos', id), newPhoto);
    return newPhoto;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCloudPhoto(id: string, updates: { url?: string; title?: string }): Promise<void> {
  const path = `photos/${id}`;
  try {
    const data: Record<string, any> = {};
    if (updates.url !== undefined) data.url = updates.url.trim();
    if (updates.title !== undefined) data.title = updates.title.trim();
    await updateDoc(doc(db, 'photos', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudPhoto(id: string): Promise<void> {
  const path = `photos/${id}`;
  try {
    let targetUrl = '';
    try {
      const snap = await getDoc(doc(db, 'photos', id));
      if (snap.exists()) {
        targetUrl = snap.data()?.url || '';
      }
    } catch (e) {
      console.warn('Could not read photo before delete:', e);
    }

    // 1. Delete from Cloud Firestore
    await deleteDoc(doc(db, 'photos', id));

    // 2. Delete physical file from permanent storage if uploaded file
    if (targetUrl && targetUrl.startsWith('/uploads/')) {
      fetch(`/api/upload?url=${encodeURIComponent(targetUrl)}`, { method: 'DELETE' }).catch(() => {});
    }

    // 3. Sync with local server
    fetch(`/api/photos/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Reels CRUD
export async function addCloudReel(reel: { url: string; title: string }): Promise<GymReel> {
  const id = 'reel-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const path = `reels/${id}`;
  const newReel: GymReel = {
    id,
    url: reel.url.trim(),
    title: (reel.title || '').trim(),
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'reels', id), newReel);
    return newReel;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCloudReel(id: string, updates: { url?: string; title?: string }): Promise<void> {
  const path = `reels/${id}`;
  try {
    const data: Record<string, any> = {};
    if (updates.url !== undefined) data.url = updates.url.trim();
    if (updates.title !== undefined) data.title = updates.title.trim();
    await updateDoc(doc(db, 'reels', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudReel(id: string): Promise<void> {
  const path = `reels/${id}`;
  try {
    let targetUrl = '';
    try {
      const snap = await getDoc(doc(db, 'reels', id));
      if (snap.exists()) {
        targetUrl = snap.data()?.url || '';
      }
    } catch (e) {
      console.warn('Could not read reel before delete:', e);
    }

    // 1. Delete from Cloud Firestore
    await deleteDoc(doc(db, 'reels', id));

    // 2. Delete physical file from permanent storage if uploaded file
    if (targetUrl && targetUrl.startsWith('/uploads/')) {
      fetch(`/api/upload?url=${encodeURIComponent(targetUrl)}`, { method: 'DELETE' }).catch(() => {});
    }

    // 3. Sync with local server
    fetch(`/api/reels/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Plans CRUD
export async function addCloudPlan(plan: Omit<SubscriptionPlan, 'id' | 'order'>): Promise<SubscriptionPlan> {
  const id = 'plan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const path = `plans/${id}`;

  // Get current count for order
  let nextOrder = 1;
  try {
    const plansSnap = await getDocs(collection(db, 'plans'));
    nextOrder = plansSnap.size + 1;
  } catch {
    // fallback
  }

  const newPlan: SubscriptionPlan = {
    id,
    duration: plan.duration.trim(),
    price: Number(plan.price),
    currency: plan.currency || 'EGP',
    features: plan.features || [],
    badge: plan.badge?.trim() || undefined,
    isPopular: Boolean(plan.isPopular),
    order: nextOrder
  };

  try {
    await setDoc(doc(db, 'plans', id), newPlan);
    return newPlan;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCloudPlan(id: string, updates: Partial<SubscriptionPlan>): Promise<void> {
  const path = `plans/${id}`;
  try {
    const data: Record<string, any> = {};
    if (updates.duration !== undefined) data.duration = updates.duration.trim();
    if (updates.price !== undefined) data.price = Number(updates.price);
    if (updates.currency !== undefined) data.currency = updates.currency;
    if (updates.features !== undefined) data.features = updates.features;
    if (updates.badge !== undefined) data.badge = updates.badge.trim() || undefined;
    if (updates.isPopular !== undefined) data.isPopular = Boolean(updates.isPopular);
    if (updates.order !== undefined) data.order = Number(updates.order);

    await updateDoc(doc(db, 'plans', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudPlan(id: string): Promise<void> {
  const path = `plans/${id}`;
  try {
    await deleteDoc(doc(db, 'plans', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function reorderCloudPlans(planIds: string[]): Promise<void> {
  try {
    for (let i = 0; i < planIds.length; i++) {
      const pId = planIds[i];
      await updateDoc(doc(db, 'plans', pId), { order: i + 1 });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'plans/reorder');
  }
}

// Customer Leads (Subscription Inquiries)
export async function submitCloudLead(lead: SubscriptionFormData): Promise<{ id: string }> {
  const id = 'lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const path = `subscriptions/${id}`;

  const leadDoc = {
    id,
    fullName: lead.fullName.trim(),
    phoneNumber: lead.phoneNumber.trim(),
    country: lead.country || '',
    countryCode: lead.countryCode || '',
    subscriptionDuration: lead.subscriptionDuration || '',
    price: Number(lead.price) || 0,
    paymentMethod: lead.paymentMethod || 'Vodafone Cash',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'subscriptions', id), leadDoc);
    return { id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getCloudLeads(): Promise<any[]> {
  const path = 'subscriptions';
  try {
    const snap = await getDocs(collection(db, 'subscriptions'));
    const leads: any[] = [];
    snap.forEach((d) => leads.push(d.data()));
    leads.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return leads;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteCloudLead(id: string): Promise<void> {
  const path = `subscriptions/${id}`;
  try {
    await deleteDoc(doc(db, 'subscriptions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Upload file directly to permanent storage with progress reporting
export async function uploadFileToCloudStorage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.url) {
            resolve(res.url);
          } else {
            reject(new Error(res.error || 'فشل معالجة الملف على الخادم'));
          }
        } catch {
          reject(new Error('استجابة الخادم غير صالحة'));
        }
      } else {
        reject(new Error(`فشل رفع الملف (${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('خطأ في الاتصال بالخادم أثناء رفع الملف'));
    };

    xhr.send(formData);
  });
}
