import React, { useState, useEffect } from 'react';
import {
  X, Lock, ShieldCheck, Settings, Camera, Film, CreditCard,
  Plus, Trash2, Edit2, Check, ArrowUp, ArrowDown, ExternalLink,
  Save, RefreshCw, LogOut, MessageSquare, AlertCircle
} from 'lucide-react';
import { GymPhoto, GymReel, GymSettings, SubscriptionPlan } from '../types';
import { api } from '../services/api';
import { parseVideoUrl } from '../utils/videoHelper';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GymSettings;
  photos: GymPhoto[];
  reels: GymReel[];
  plans: SubscriptionPlan[];
  onDataUpdated: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  settings,
  photos,
  reels,
  plans,
  onDataUpdated
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('pump_admin_auth') === 'true';
  });

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  type TabType = 'settings' | 'photos' | 'reels' | 'plans' | 'leads';
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  // Form states
  const [settingsForm, setSettingsForm] = useState<GymSettings>({ ...settings });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Photo state
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPhotoTitle, setEditPhotoTitle] = useState('');
  const [photoError, setPhotoError] = useState('');

  // Reel state
  const [newReelUrl, setNewReelUrl] = useState('');
  const [newReelTitle, setNewReelTitle] = useState('');
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [editReelUrl, setEditReelUrl] = useState('');
  const [editReelTitle, setEditReelTitle] = useState('');
  const [reelError, setReelError] = useState('');

  // Plan state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<{
    duration: string;
    price: number;
    badge: string;
    isPopular: boolean;
    featuresText: string;
  }>({
    duration: '',
    price: 0,
    badge: '',
    isPopular: false,
    featuresText: ''
  });
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  // Leads
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'leads') {
      fetchLeads();
    }
  }, [isAuthenticated, activeTab]);

  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const data = await api.getSubscriptions();
      setLeads(data.subscriptions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await api.login(username.trim(), password.trim());
      if (res.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('pump_admin_auth', 'true');
      } else {
        setLoginError(res.error || 'بيانات الدخول غير صحيحة');
      }
    } catch (err: any) {
      setLoginError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pump_admin_auth');
    setUsername('');
    setPassword('');
  };

  // Save General Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess(false);

    try {
      await api.updateSettings(settingsForm);
      setSettingsSuccess(true);
      onDataUpdated();
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Add Photo
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoError('');
    if (!newPhotoUrl.trim()) {
      setPhotoError('يرجى إدخال رابط الصورة');
      return;
    }

    try {
      await api.addPhoto({ url: newPhotoUrl.trim(), title: newPhotoTitle.trim() });
      setNewPhotoUrl('');
      setNewPhotoTitle('');
      onDataUpdated();
    } catch (err: any) {
      setPhotoError(err.message || 'فشل إضافة الصورة');
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    try {
      await api.deletePhoto(id);
      onDataUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الصورة');
    }
  };

  // Edit Photo
  const handleUpdatePhoto = async (id: string) => {
    try {
      await api.updatePhoto(id, { url: editPhotoUrl, title: editPhotoTitle });
      setEditingPhotoId(null);
      onDataUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل تعديل الصورة');
    }
  };

  // Add Reel
  const handleAddReel = async (e: React.FormEvent) => {
    e.preventDefault();
    setReelError('');
    if (!newReelUrl.trim()) {
      setReelError('يرجى إدخال رابط الفيديو');
      return;
    }

    try {
      await api.addReel({ url: newReelUrl.trim(), title: newReelTitle.trim() });
      setNewReelUrl('');
      setNewReelTitle('');
      onDataUpdated();
    } catch (err: any) {
      setReelError(err.message || 'فشل إضافة الفيديو');
    }
  };

  // Delete Reel
  const handleDeleteReel = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    try {
      await api.deleteReel(id);
      onDataUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الفيديو');
    }
  };

  // Edit Reel
  const handleUpdateReel = async (id: string) => {
    try {
      await api.updateReel(id, { url: editReelUrl, title: editReelTitle });
      setEditingReelId(null);
      onDataUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل تعديل الفيديو');
    }
  };

  // Plan Actions
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError('');
    if (!planForm.duration.trim() || planForm.price <= 0) {
      setPlanError('يرجى إدخال مدة الاشتراك وسعر صحيح بالجنيه');
      return;
    }

    const featuresArray = planForm.featuresText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (editingPlanId) {
        await api.updatePlan(editingPlanId, {
          duration: planForm.duration.trim(),
          price: Number(planForm.price),
          badge: planForm.badge.trim() || undefined,
          isPopular: planForm.isPopular,
          features: featuresArray
        });
        setEditingPlanId(null);
      } else {
        await api.addPlan({
          duration: planForm.duration.trim(),
          price: Number(planForm.price),
          currency: 'EGP',
          badge: planForm.badge.trim() || undefined,
          isPopular: planForm.isPopular,
          features: featuresArray
        });
        setIsAddingPlan(false);
      }
      onDataUpdated();
    } catch (err: any) {
      setPlanError(err.message || 'فشل حفظ الاشتراك');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;
    try {
      await api.deletePlan(id);
      onDataUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الاشتراك');
    }
  };

  const handleMovePlan = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= plans.length) return;

    const reordered = [...plans];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    try {
      await api.reorderPlans(reordered.map(p => p.id));
      onDataUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل إعادة الترتيب');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-5xl bg-[#0f0f0f] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-600/30 text-red-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white tracking-wide">
                لوحة تحكم إدارة <span className="text-red-500">PUMP CLUB</span>
              </h3>
              <p className="text-xs text-neutral-400">
                {isAuthenticated ? 'متصل كمسؤول النظام (Admin)' : 'تسجيل دخول الإدارة المحمي'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-red-950 text-neutral-300 hover:text-red-400 border border-neutral-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAuthenticated ? (
          /* LOGIN SCREEN */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center max-w-md mx-auto w-full my-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 mb-6 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
              <Lock className="w-8 h-8" />
            </div>

            <h4 className="text-2xl font-black text-white text-center mb-2">
              تسجيل دخول الإدارة
            </h4>
            <p className="text-xs text-neutral-400 text-center mb-8">
              أدخل اسم المستخدم وكلمة المرور للوصول إلى لوحة التحكم والتعديل على محتوى الموقع
            </p>

            {loginError && (
              <div className="w-full mb-6 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  اسم المستخدم (Username)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Pump"
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  كلمة المرور (Password)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-600"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoggingIn ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-950 overflow-x-auto p-2 gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>الإعدادات العامة</span>
              </button>

              <button
                onClick={() => setActiveTab('photos')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'photos'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>صور الجيم ({photos.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('reels')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'reels'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>الفيديوهات والريلز ({reels.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('plans')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'plans'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>باقات الاشتراكات ({plans.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'leads'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>طلبات الاشتراكات المستلمة ({leads.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

              {/* 1. GENERAL SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
                  {settingsSuccess && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>تم حفظ وتحديث الإعدادات بنجاح في قاعدة البيانات وتطبيقها فوراً على الموقع!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        اسم الجيم (Gym Name)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.gymName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, gymName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-red-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        الوصف المختصر (Tagline)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.gymTagline}
                        onChange={(e) => setSettingsForm({ ...settingsForm, gymTagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      نص الترحيب في الواجهة الرئيسية (Welcome Text)
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.welcomeText}
                      onChange={(e) => setSettingsForm({ ...settingsForm, welcomeText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        رقم الواتساب الرسمي (WhatsApp)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.whatsappNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-red-600 focus:outline-none font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        رابط إنستجرام (Instagram Link)
                      </label>
                      <input
                        type="url"
                        value={settingsForm.instagramUrl}
                        onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-red-600 focus:outline-none font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        رابط موقع الجيم (Google Maps Link)
                      </label>
                      <input
                        type="url"
                        value={settingsForm.locationUrl}
                        onChange={(e) => setSettingsForm({ ...settingsForm, locationUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-red-600 focus:outline-none font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        نص زر الموقع
                      </label>
                      <input
                        type="text"
                        value={settingsForm.locationButtonText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, locationButtonText: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      نص شريط الإعلانات المتحرك (Moving Announcement Ticker)
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.tickerText}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tickerText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      رابط الصورة أو الفيديو المتحرك لخلفية قسم الترحيب (Animated Background URL - GIF / MP4 / Image)
                    </label>
                    <input
                      type="url"
                      value={settingsForm.heroAnimatedBgUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, heroAnimatedBgUrl: e.target.value })}
                      placeholder="https://example.com/gym-animation.mp4 أو رابط صورة متحركة GIF"
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:border-red-600 focus:outline-none font-mono"
                      dir="ltr"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      يدعم روابط الفيديو المباشرة (mp4 / webm) وروابط الصور المتحركة (GIF / WebP).
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingSettings ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 2. PHOTOS MANAGEMENT */}
              {activeTab === 'photos' && (
                <div className="space-y-8">
                  {/* Add Photo Form */}
                  <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-red-500" />
                      <span>إضافة صورة جديدة لصالة الجيم</span>
                    </h4>

                    {photoError && (
                      <p className="text-red-500 text-xs mb-3">{photoError}</p>
                    )}

                    <form onSubmit={handleAddPhoto} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7">
                        <input
                          type="url"
                          required
                          placeholder="رابط الصورة المباشر (Direct Image URL)"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="عنوان أو وصف الصورة"
                          value={newPhotoTitle}
                          onChange={(e) => setNewPhotoTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Photos List */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-4">
                      الصور الحالية ({photos.length})
                    </h4>

                    {photos.length === 0 ? (
                      <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 text-neutral-400 text-xs">
                        لا توجد صور مضافة بعد. أضف روابط الصور الخاصة بصالة PUMP CLUB أعلاه لتظهر فوراً لزوار الموقع.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {photos.map((p) => {
                          const isEditing = editingPhotoId === p.id;
                          return (
                            <div
                              key={p.id}
                              className="rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex flex-col"
                            >
                              <div className="relative aspect-[4/3] bg-neutral-900">
                                <img
                                  src={p.url}
                                  alt={p.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={editPhotoTitle}
                                      onChange={(e) => setEditPhotoTitle(e.target.value)}
                                      placeholder="عنوان الصورة"
                                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
                                    />
                                    <input
                                      type="url"
                                      value={editPhotoUrl}
                                      onChange={(e) => setEditPhotoUrl(e.target.value)}
                                      placeholder="رابط الصورة"
                                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white font-mono"
                                      dir="ltr"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdatePhoto(p.id)}
                                        className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
                                      >
                                        حفظ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingPhotoId(null)}
                                        className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded hover:bg-neutral-700"
                                      >
                                        إلغاء
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="font-bold text-white text-xs truncate">
                                      {p.title || 'بدون عنوان'}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingPhotoId(p.id);
                                          setEditPhotoTitle(p.title);
                                          setEditPhotoUrl(p.url);
                                        }}
                                        className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 text-xs flex items-center gap-1"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>تعديل</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeletePhoto(p.id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950/40 text-xs flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>حذف</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. REELS MANAGEMENT */}
              {activeTab === 'reels' && (
                <div className="space-y-8">
                  {/* Add Reel Form */}
                  <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-red-500" />
                      <span>إضافة مقطع فيديو أو ريل جديد</span>
                    </h4>

                    {reelError && (
                      <p className="text-red-500 text-xs mb-3">{reelError}</p>
                    )}

                    <form onSubmit={handleAddReel} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7">
                        <input
                          type="url"
                          required
                          placeholder="رابط الفيديو (YouTube Shorts / YouTube / رابط MP4 مباشر)"
                          value={newReelUrl}
                          onChange={(e) => setNewReelUrl(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="عنوان المقطع (اختياري)"
                          value={newReelTitle}
                          onChange={(e) => setNewReelTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Reels List */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-4">
                      المقاطع الحالية ({reels.length})
                    </h4>

                    {reels.length === 0 ? (
                      <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 text-neutral-400 text-xs">
                        لا توجد مقاطع مضافة بعد. أضف روابط مقاطع الفيديو أو ريلز النادي أعلاه لتظهر في قسم الفيديوهات.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reels.map((r) => {
                          const isEditing = editingReelId === r.id;
                          const videoInfo = parseVideoUrl(r.url);

                          return (
                            <div
                              key={r.id}
                              className="rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex flex-col"
                            >
                              <div className="aspect-[9/12] bg-black flex items-center justify-center overflow-hidden">
                                {videoInfo.type === 'youtube' && videoInfo.embedUrl ? (
                                  <iframe
                                    src={videoInfo.embedUrl}
                                    title={r.title}
                                    className="w-full h-full border-0"
                                  />
                                ) : videoInfo.type === 'direct' && videoInfo.directUrl ? (
                                  <video
                                    src={videoInfo.directUrl}
                                    controls
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-neutral-500 text-xs p-4 text-center">
                                    {r.url}
                                  </div>
                                )}
                              </div>

                              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={editReelTitle}
                                      onChange={(e) => setEditReelTitle(e.target.value)}
                                      placeholder="عنوان الفيديو"
                                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
                                    />
                                    <input
                                      type="url"
                                      value={editReelUrl}
                                      onChange={(e) => setEditReelUrl(e.target.value)}
                                      placeholder="رابط الفيديو"
                                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white font-mono"
                                      dir="ltr"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateReel(r.id)}
                                        className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
                                      >
                                        حفظ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingReelId(null)}
                                        className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded hover:bg-neutral-700"
                                      >
                                        إلغاء
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="font-bold text-white text-xs truncate">
                                      {r.title || 'بدون عنوان'}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-neutral-900">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingReelId(r.id);
                                          setEditReelTitle(r.title);
                                          setEditReelUrl(r.url);
                                        }}
                                        className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 text-xs flex items-center gap-1"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>تعديل</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteReel(r.id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950/40 text-xs flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>حذف</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. PLANS MANAGEMENT */}
              {activeTab === 'plans' && (
                <div className="space-y-8">
                  {/* Header & Add Plan Trigger */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">إدارة باقات وعضويات النادي</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        يمكنك إضافة أو تعديل أو إعادة ترتيب باقات الاشتراك والأسعار بالجنيه المصري (EGP).
                      </p>
                    </div>

                    {!isAddingPlan && !editingPlanId && (
                      <button
                        onClick={() => {
                          setIsAddingPlan(true);
                          setPlanForm({
                            duration: '',
                            price: 0,
                            badge: '',
                            isPopular: false,
                            featuresText: 'دخول يومي غير محدود\nاستخدام كافة الأجهزة'
                          });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة باقة جديدة</span>
                      </button>
                    )}
                  </div>

                  {/* Add or Edit Plan Form Modal/Box */}
                  {(isAddingPlan || editingPlanId) && (
                    <div className="p-6 rounded-2xl bg-neutral-950 border-2 border-red-600/50 shadow-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-red-500" />
                          <span>{editingPlanId ? 'تعديل باقة الاشتراك' : 'إضافة باقة اشتراك جديدة'}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingPlan(false);
                            setEditingPlanId(null);
                          }}
                          className="text-neutral-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {planError && <p className="text-red-500 text-xs">{planError}</p>}

                      <form onSubmit={handleSavePlan} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-neutral-300 mb-1">
                              مدة الاشتراك (Subscription Duration) *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: شهر واحد (1 Month)"
                              value={planForm.duration}
                              onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-neutral-300 mb-1">
                              السعر بالجنيه المصري (Price in EGP) *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              placeholder="مثال: 800"
                              value={planForm.price || ''}
                              onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-neutral-300 mb-1">
                              شارة مميزة (Badge - اختياري)
                            </label>
                            <input
                              type="text"
                              placeholder="مثال: الأكثر طلباً أو أفضل قيمة"
                              value={planForm.badge}
                              onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              id="isPopular"
                              checked={planForm.isPopular}
                              onChange={(e) => setPlanForm({ ...planForm, isPopular: e.target.checked })}
                              className="accent-red-600 w-4 h-4 rounded"
                            />
                            <label htmlFor="isPopular" className="text-xs text-white font-bold cursor-pointer">
                              إبراز هذه الباقة بإطار أحمر وتأثير متميز (Featured)
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-300 mb-1">
                            مميزات الاشتراك (ميزة في كل سطر)
                          </label>
                          <textarea
                            rows={4}
                            value={planForm.featuresText}
                            onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                            placeholder="دخول يومي غير محدود&#10;خطة تدريب وتغذية&#10;فحص دوري"
                            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingPlan(false);
                              setEditingPlanId(null);
                            }}
                            className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl text-xs hover:bg-neutral-700"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-md"
                          >
                            حفظ الباقة
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Plans Table/List */}
                  <div className="space-y-3">
                    {plans.map((p, index) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMovePlan(index, 'up')}
                              className="p-1 rounded bg-neutral-900 text-neutral-400 hover:text-white disabled:opacity-30"
                              title="تحريك لأعلى"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === plans.length - 1}
                              onClick={() => handleMovePlan(index, 'down')}
                              className="p-1 rounded bg-neutral-900 text-neutral-400 hover:text-white disabled:opacity-30"
                              title="تحريك لأسفل"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-white text-sm">{p.duration}</h5>
                              {p.badge && (
                                <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-600/30 text-[10px] font-bold">
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                              <span className="font-display font-bold text-red-500 text-sm" dir="ltr">
                                {p.price} EGP
                              </span>
                              <span>•</span>
                              <span>{p.features?.length || 0} ميزة مضافة</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlanId(p.id);
                              setIsAddingPlan(false);
                              setPlanForm({
                                duration: p.duration,
                                price: p.price,
                                badge: p.badge || '',
                                isPopular: !!p.isPopular,
                                featuresText: (p.features || []).join('\n')
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePlan(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/60 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. LEADS MANAGEMENT */}
              {activeTab === 'leads' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">طلبات الاشتراكات الواردة</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        سجل المشتركين الذين أرسلوا طلبات انضمام عبر نموذج الموقع
                      </p>
                    </div>

                    <button
                      onClick={fetchLeads}
                      className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLeads ? 'animate-spin' : ''}`} />
                      <span>تحديث</span>
                    </button>
                  </div>

                  {leads.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 text-neutral-400 text-xs">
                      لم يتم تسجيل طلبات اشتراك جديدة حتى الآن.
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-800 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                      {leads.map((lead) => (
                        <div key={lead.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-white text-sm">
                              {lead.fullName}
                            </div>
                            <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-2 mt-1">
                              <span className="font-mono text-red-400" dir="ltr">{lead.phoneNumber}</span>
                              <span>•</span>
                              <span>{lead.country}</span>
                              <span>•</span>
                              <span className="text-neutral-300 font-semibold">{lead.subscriptionDuration}</span>
                              <span>•</span>
                              <span className="font-bold text-emerald-400">{lead.price} EGP</span>
                              <span>•</span>
                              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">
                                {lead.paymentMethod}
                              </span>
                            </div>
                            {lead.createdAt && (
                              <div className="text-[10px] text-neutral-500 mt-1">
                                {new Date(lead.createdAt).toLocaleString('ar-EG')}
                              </div>
                            )}
                          </div>

                          <div>
                            <a
                              href={`https://wa.me/${lead.phoneNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>مراسلة عبر واتساب</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
