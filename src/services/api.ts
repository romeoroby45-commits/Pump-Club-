import { AppData, GymPhoto, GymReel, GymSettings, SubscriptionPlan, SubscriptionFormData } from '../types';

async function safeFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  defaultErrorMessage = 'حدث خطأ في الاتصال بالخادم'
): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('الرابط المطلوب غير موجود على الخادم (404)');
      }
      throw new Error(`خطأ في استجابة الخادم (${res.status})`);
    }
    throw new Error('استجابة الخادم ليست بصيغة JSON صالحة');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || defaultErrorMessage);
  }
  return data as T;
}

export const api = {
  async getAppData(): Promise<AppData> {
    const res = await fetch('/api/data');
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json') || !res.ok) {
      throw new Error('فشل تحميل بيانات الموقع');
    }
    return res.json();
  },

  async login(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    // Check endpoints in order
    const candidateEndpoints = ['/api/auth/login', '/api/login'];
    let lastNetworkError: string | null = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ username: cleanUser, password: cleanPass })
        });

        const contentType = res.headers.get('content-type') || '';

        // If the server responded with non-JSON (e.g. 404 HTML "The page cannot be found")
        if (!contentType.includes('application/json')) {
          console.warn(`[Login] Endpoint ${endpoint} returned non-JSON (${res.status}).`);
          continue;
        }

        // Response is valid JSON
        const data = await res.json();

        // 401 Unauthorized or explicit success: false
        if (res.status === 401 || data.success === false) {
          return {
            success: false,
            error: data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة'
          };
        }

        // Other HTTP error statuses
        if (!res.ok) {
          return {
            success: false,
            error: data.error || `خطأ في الخادم (${res.status})`
          };
        }

        return data;
      } catch (err: any) {
        lastNetworkError = err?.message || 'فشل الاتصال بالخادم';
      }
    }

    // In case all endpoints returned non-JSON or were unreachable
    return {
      success: false,
      error: lastNetworkError
        ? `تعذر الاتصال بالخادم: ${lastNetworkError}`
        : 'تعذر الوصول إلى خادم تسجيل الدخول (404 Page Not Found). تأكد من إعدادات النشر على Vercel.'
    };
  },

  async updateSettings(settings: Partial<GymSettings>): Promise<{ success: boolean; settings: GymSettings }> {
    return safeFetchJson<{ success: boolean; settings: GymSettings }>(
      '/api/settings',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      },
      'فشل تحديث الإعدادات'
    );
  },

  // Photos
  async addPhoto(photo: { url: string; title: string }): Promise<{ success: boolean; photo: GymPhoto; photos: GymPhoto[] }> {
    return safeFetchJson<{ success: boolean; photo: GymPhoto; photos: GymPhoto[] }>(
      '/api/photos',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photo)
      },
      'فشل إضافة الصورة'
    );
  },

  async updatePhoto(id: string, photo: { url?: string; title?: string }): Promise<{ success: boolean; photo: GymPhoto; photos: GymPhoto[] }> {
    return safeFetchJson<{ success: boolean; photo: GymPhoto; photos: GymPhoto[] }>(
      `/api/photos/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...photo, id })
      },
      'فشل تعديل الصورة'
    );
  },

  async deletePhoto(id: string): Promise<{ success: boolean; photos: GymPhoto[] }> {
    return safeFetchJson<{ success: boolean; photos: GymPhoto[] }>(
      `/api/photos/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      },
      'فشل حذف الصورة'
    );
  },

  // Reels
  async addReel(reel: { url: string; title: string }): Promise<{ success: boolean; reel: GymReel; reels: GymReel[] }> {
    return safeFetchJson<{ success: boolean; reel: GymReel; reels: GymReel[] }>(
      '/api/reels',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reel)
      },
      'فشل إضافة الفيديو'
    );
  },

  async updateReel(id: string, reel: { url?: string; title?: string }): Promise<{ success: boolean; reel: GymReel; reels: GymReel[] }> {
    return safeFetchJson<{ success: boolean; reel: GymReel; reels: GymReel[] }>(
      `/api/reels/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reel, id })
      },
      'فشل تعديل الفيديو'
    );
  },

  async deleteReel(id: string): Promise<{ success: boolean; reels: GymReel[] }> {
    return safeFetchJson<{ success: boolean; reels: GymReel[] }>(
      `/api/reels/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      },
      'فشل حذف الفيديو'
    );
  },

  // Plans
  async addPlan(plan: Omit<SubscriptionPlan, 'id' | 'order'>): Promise<{ success: boolean; plan: SubscriptionPlan; plans: SubscriptionPlan[] }> {
    return safeFetchJson<{ success: boolean; plan: SubscriptionPlan; plans: SubscriptionPlan[] }>(
      '/api/plans',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      },
      'فشل إضافة الاشتراك'
    );
  },

  async updatePlan(id: string, plan: Partial<SubscriptionPlan>): Promise<{ success: boolean; plan: SubscriptionPlan; plans: SubscriptionPlan[] }> {
    return safeFetchJson<{ success: boolean; plan: SubscriptionPlan; plans: SubscriptionPlan[] }>(
      `/api/plans/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, id })
      },
      'فشل تعديل الاشتراك'
    );
  },

  async deletePlan(id: string): Promise<{ success: boolean; plans: SubscriptionPlan[] }> {
    return safeFetchJson<{ success: boolean; plans: SubscriptionPlan[] }>(
      `/api/plans/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      },
      'فشل حذف الاشتراك'
    );
  },

  async reorderPlans(planIds: string[]): Promise<{ success: boolean; plans: SubscriptionPlan[] }> {
    return safeFetchJson<{ success: boolean; plans: SubscriptionPlan[] }>(
      '/api/plans-reorder',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planIds })
      },
      'فشل حفظ ترتيب الاشتراكات'
    );
  },

  // Subscriptions inquiries
  async submitSubscription(data: SubscriptionFormData): Promise<{ success: boolean }> {
    return safeFetchJson<{ success: boolean }>(
      '/api/subscriptions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      },
      'فشل إرسال طلب الاشتراك'
    );
  },

  async getSubscriptions(): Promise<{ subscriptions: any[] }> {
    return safeFetchJson<{ subscriptions: any[] }>(
      '/api/subscriptions',
      {},
      'فشل جلب قائمة الاشتراكات'
    );
  }
};
