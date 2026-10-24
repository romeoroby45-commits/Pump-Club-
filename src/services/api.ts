import { AppData, GymPhoto, GymReel, GymSettings, SubscriptionPlan, SubscriptionFormData } from '../types';
import {
  db,
  auth,
  INITIAL_SETTINGS,
  INITIAL_PLANS,
  INITIAL_PHOTOS,
  INITIAL_REELS,
  seedFirestoreIfEmpty,
  updateCloudSettings,
  addCloudPhoto,
  updateCloudPhoto,
  deleteCloudPhoto,
  addCloudReel,
  updateCloudReel,
  deleteCloudReel,
  addCloudPlan,
  updateCloudPlan,
  deleteCloudPlan,
  reorderCloudPlans,
  submitCloudLead,
  getCloudLeads,
  deleteCloudLead,
  uploadFileToCloudStorage
} from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';

export const api = {
  // Fetch full application data from real Cloud Firestore
  async getAppData(): Promise<AppData> {
    try {
      // 1. Fetch settings doc
      let settings: GymSettings = INITIAL_SETTINGS;
      const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
      if (settingsSnap.exists()) {
        settings = { ...INITIAL_SETTINGS, ...(settingsSnap.data() as GymSettings) };
      } else {
        // Try auto-seed if empty
        seedFirestoreIfEmpty().catch(() => {});
      }

      // 2. Fetch plans
      let plans: SubscriptionPlan[] = [];
      const plansSnap = await getDocs(query(collection(db, 'plans'), orderBy('order', 'asc')));
      if (!plansSnap.empty) {
        plansSnap.forEach((d) => {
          plans.push({ id: d.id, ...(d.data() as Omit<SubscriptionPlan, 'id'>) });
        });
      } else {
        plans = INITIAL_PLANS;
      }

      // 3. Fetch photos
      let photos: GymPhoto[] = [];
      const photosSnap = await getDocs(collection(db, 'photos'));
      photosSnap.forEach((d) => {
        photos.push({ id: d.id, ...(d.data() as Omit<GymPhoto, 'id'>) });
      });

      // 4. Fetch reels
      let reels: GymReel[] = [];
      const reelsSnap = await getDocs(collection(db, 'reels'));
      reelsSnap.forEach((d) => {
        reels.push({ id: d.id, ...(d.data() as Omit<GymReel, 'id'>) });
      });

      return {
        settings,
        plans,
        photos,
        reels
      };
    } catch (err) {
      console.warn('Firestore getAppData fallback to local/api:', err);
      // Fallback to fetch /api/data if network fails
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          return json;
        }
      } catch {
        // ignore
      }
      return {
        settings: INITIAL_SETTINGS,
        plans: INITIAL_PLANS,
        photos: INITIAL_PHOTOS,
        reels: INITIAL_REELS
      };
    }
  },

  // Admin authentication check
  async login(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (cleanUser === 'Pump' && cleanPass === '104070') {
      return {
        success: true,
        token: 'pump-auth-authenticated-session-key',
        user: { username: 'Pump', role: 'admin' }
      } as any;
    }

    // Try server endpoint fallback
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // ignore
    }

    return {
      success: false,
      error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
    };
  },

  // Settings
  async updateSettings(settings: Partial<GymSettings>): Promise<{ success: boolean; settings: GymSettings }> {
    const updated = await updateCloudSettings(settings);
    // Also update server for fallback
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).catch(() => {});

    return { success: true, settings: updated };
  },

  // Photos
  async addPhoto(photo: { url: string; title: string }): Promise<{ success: boolean; photo: GymPhoto; photos: GymPhoto[] }> {
    const newPhoto = await addCloudPhoto(photo);
    const photosSnap = await getDocs(collection(db, 'photos'));
    const allPhotos: GymPhoto[] = [];
    photosSnap.forEach((d) => allPhotos.push({ id: d.id, ...(d.data() as Omit<GymPhoto, 'id'>) }));

    return { success: true, photo: newPhoto, photos: allPhotos };
  },

  async updatePhoto(id: string, photo: { url?: string; title?: string }): Promise<{ success: boolean; photo: GymPhoto; photos: GymPhoto[] }> {
    await updateCloudPhoto(id, photo);
    const photosSnap = await getDocs(collection(db, 'photos'));
    const allPhotos: GymPhoto[] = [];
    photosSnap.forEach((d) => allPhotos.push({ id: d.id, ...(d.data() as Omit<GymPhoto, 'id'>) }));
    const updated = allPhotos.find(p => p.id === id) || { id, url: photo.url || '', title: photo.title || '', createdAt: '' };

    return { success: true, photo: updated, photos: allPhotos };
  },

  async deletePhoto(id: string): Promise<{ success: boolean; photos: GymPhoto[] }> {
    await deleteCloudPhoto(id);
    const photosSnap = await getDocs(collection(db, 'photos'));
    const allPhotos: GymPhoto[] = [];
    photosSnap.forEach((d) => allPhotos.push({ id: d.id, ...(d.data() as Omit<GymPhoto, 'id'>) }));

    return { success: true, photos: allPhotos };
  },

  // Reels
  async addReel(reel: {
    url: string;
    title: string;
    aspectRatio?: string;
    fitMode?: 'cover' | 'contain';
    size?: 'normal' | 'featured';
  }): Promise<{ success: boolean; reel: GymReel; reels: GymReel[] }> {
    const newReel = await addCloudReel(reel);
    const reelsSnap = await getDocs(collection(db, 'reels'));
    const allReels: GymReel[] = [];
    reelsSnap.forEach((d) => allReels.push({ id: d.id, ...(d.data() as Omit<GymReel, 'id'>) }));

    // Sync with local backend
    fetch('/api/reels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reel)
    }).catch(() => {});

    return { success: true, reel: newReel, reels: allReels };
  },

  async updateReel(
    id: string,
    reel: {
      url?: string;
      title?: string;
      aspectRatio?: string;
      fitMode?: 'cover' | 'contain';
      size?: 'normal' | 'featured';
    }
  ): Promise<{ success: boolean; reel: GymReel; reels: GymReel[] }> {
    await updateCloudReel(id, reel);
    const reelsSnap = await getDocs(collection(db, 'reels'));
    const allReels: GymReel[] = [];
    reelsSnap.forEach((d) => allReels.push({ id: d.id, ...(d.data() as Omit<GymReel, 'id'>) }));
    const updated = allReels.find(r => r.id === id) || {
      id,
      url: reel.url || '',
      title: reel.title || '',
      aspectRatio: reel.aspectRatio || '9:16',
      fitMode: reel.fitMode || 'cover',
      size: reel.size || 'normal',
      createdAt: ''
    };

    // Sync with local backend
    fetch(`/api/reels/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reel)
    }).catch(() => {});

    return { success: true, reel: updated, reels: allReels };
  },

  async deleteReel(id: string): Promise<{ success: boolean; reels: GymReel[] }> {
    await deleteCloudReel(id);
    const reelsSnap = await getDocs(collection(db, 'reels'));
    const allReels: GymReel[] = [];
    reelsSnap.forEach((d) => allReels.push({ id: d.id, ...(d.data() as Omit<GymReel, 'id'>) }));

    return { success: true, reels: allReels };
  },

  // Plans
  async addPlan(plan: Omit<SubscriptionPlan, 'id' | 'order'>): Promise<{ success: boolean; plan: SubscriptionPlan; plans: SubscriptionPlan[] }> {
    const newPlan = await addCloudPlan(plan);
    const plansSnap = await getDocs(query(collection(db, 'plans'), orderBy('order', 'asc')));
    const allPlans: SubscriptionPlan[] = [];
    plansSnap.forEach((d) => allPlans.push({ id: d.id, ...(d.data() as Omit<SubscriptionPlan, 'id'>) }));

    return { success: true, plan: newPlan, plans: allPlans };
  },

  async updatePlan(id: string, plan: Partial<SubscriptionPlan>): Promise<{ success: boolean; plan: SubscriptionPlan; plans: SubscriptionPlan[] }> {
    await updateCloudPlan(id, plan);
    const plansSnap = await getDocs(query(collection(db, 'plans'), orderBy('order', 'asc')));
    const allPlans: SubscriptionPlan[] = [];
    plansSnap.forEach((d) => allPlans.push({ id: d.id, ...(d.data() as Omit<SubscriptionPlan, 'id'>) }));
    const updated = allPlans.find(p => p.id === id) || { id, duration: plan.duration || '', price: plan.price || 0, currency: 'EGP', features: plan.features || [], order: plan.order || 1 };

    return { success: true, plan: updated, plans: allPlans };
  },

  async deletePlan(id: string): Promise<{ success: boolean; plans: SubscriptionPlan[] }> {
    await deleteCloudPlan(id);
    const plansSnap = await getDocs(query(collection(db, 'plans'), orderBy('order', 'asc')));
    const allPlans: SubscriptionPlan[] = [];
    plansSnap.forEach((d) => allPlans.push({ id: d.id, ...(d.data() as Omit<SubscriptionPlan, 'id'>) }));

    return { success: true, plans: allPlans };
  },

  async reorderPlans(planIds: string[]): Promise<{ success: boolean; plans: SubscriptionPlan[] }> {
    await reorderCloudPlans(planIds);
    const plansSnap = await getDocs(query(collection(db, 'plans'), orderBy('order', 'asc')));
    const allPlans: SubscriptionPlan[] = [];
    plansSnap.forEach((d) => allPlans.push({ id: d.id, ...(d.data() as Omit<SubscriptionPlan, 'id'>) }));

    return { success: true, plans: allPlans };
  },

  // Subscriptions / Customer Leads
  async submitSubscription(data: SubscriptionFormData): Promise<{ success: boolean }> {
    await submitCloudLead(data);
    // Also log to server endpoint for redundancy
    fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});

    return { success: true };
  },

  async getSubscriptions(): Promise<{ subscriptions: any[] }> {
    try {
      const leads = await getCloudLeads();
      return { subscriptions: leads };
    } catch {
      // Fallback
      const res = await fetch('/api/subscriptions');
      if (res.ok) {
        return res.json();
      }
      return { subscriptions: [] };
    }
  },

  async deleteSubscription(id: string): Promise<{ success: boolean }> {
    await deleteCloudLead(id);
    return { success: true };
  },

  // Permanent File Storage Upload
  async uploadFile(file: File, onProgress?: (percent: number) => void): Promise<string> {
    return uploadFileToCloudStorage(file, onProgress);
  }
};
