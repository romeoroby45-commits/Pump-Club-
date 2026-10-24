import React, { useState, useEffect } from 'react';
import {
  X, Lock, ShieldCheck, Settings, Camera, Film, CreditCard,
  Plus, Trash2, Edit2, Check, ArrowUp, ArrowDown, ExternalLink,
  Save, RefreshCw, LogOut, MessageSquare, AlertCircle, Upload,
  Cloud, CheckCircle2, Play, Eye, FileVideo, ImageIcon, Loader2
} from 'lucide-react';
import { GymPhoto, GymReel, GymSettings, SubscriptionPlan } from '../types';
import { api } from '../services/api';
import { parseVideoUrl } from '../utils/videoHelper';
import {
  auth,
  signInAdminWithGoogle,
  logOutAdmin,
  subscribeToAuthState,
  seedFirestoreIfEmpty
} from '../services/firebase';

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
  const [currentUser, setCurrentUser] = useState<any>(null);

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
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Photo state & Direct Upload Preview
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number>(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPhotoTitle, setEditPhotoTitle] = useState('');
  const [photoError, setPhotoError] = useState('');

  // Reel/Video state & Direct Upload Preview
  const [newReelUrl, setNewReelUrl] = useState('');
  const [newReelTitle, setNewReelTitle] = useState('');
  const [reelFile, setReelFile] = useState<File | null>(null);
  const [reelPreviewUrl, setReelPreviewUrl] = useState<string | null>(null);
  const [reelUploadProgress, setReelUploadProgress] = useState<number>(0);
  const [isUploadingReel, setIsUploadingReel] = useState(false);
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [editReelUrl, setEditReelUrl] = useState('');
  const [editReelTitle, setEditReelTitle] = useState('');
  const [reelError, setReelError] = useState('');

  // Deletion operation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = subscribeToAuthState((u) => {
      setCurrentUser(u);
      if (u) {
        setIsAuthenticated(true);
        sessionStorage.setItem('pump_admin_auth', 'true');
      }
    });
    return () => unsub();
  }, []);

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

  // Handle Login with Username & Password
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

  // Handle Google Admin Login (Official Firebase Auth)
  const handleGoogleLogin = async () => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const user = await signInAdminWithGoogle();
      setCurrentUser(user);
      setIsAuthenticated(true);
      sessionStorage.setItem('pump_admin_auth', 'true');
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setLoginError(err.message || 'فشل تسجيل الدخول عبر Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('pump_admin_auth');
    setUsername('');
    setPassword('');
    try {
      await logOutAdmin();
    } catch {}
  };

  // Photo file selection & instant preview
  const handleSelectPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');

    if (file.size > 50 * 1024 * 1024) {
      setPhotoError('حجم الصورة كبير جداً (الحد الأقصى 50 ميجابايت)');
      return;
    }

    if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreviewUrl(previewUrl);
    setPhotoUploadProgress(0);
    if (!newPhotoTitle) {
      setNewPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleCancelPhotoPreview = () => {
    if (photoPreviewUrl && photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setPhotoUploadProgress(0);
  };

  // Reel/Video file selection & instant preview
  const handleSelectReelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReelError('');

    if (file.size > 150 * 1024 * 1024) {
      setReelError('حجم الفيديو كبير جداً (الحد الأقصى 150 ميجابايت)');
      return;
    }

    if (reelPreviewUrl && reelPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(reelPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setReelFile(file);
    setReelPreviewUrl(previewUrl);
    setReelUploadProgress(0);
    if (!newReelTitle) {
      setNewReelTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleCancelReelPreview = () => {
    if (reelPreviewUrl && reelPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(reelPreviewUrl);
    }
    setReelFile(null);
    setReelPreviewUrl(null);
    setReelUploadProgress(0);
  };

  // Seed default data to Firestore if empty
  const handleSeedFirestore = async () => {
    setIsSeeding(true);
    setSeedSuccess(false);
    try {
      await seedFirestoreIfEmpty();
      setSeedSuccess(true);
      onDataUpdated();
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل تهيئة السحاب');
    } finally {
      setIsSeeding(false);
    }
  };

  // Delete customer lead
  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    try {
      await api.deleteSubscription(id);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الطلب');
    }
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

  // Add Photo (From file upload OR direct URL)
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoError('');

    if (!photoFile && !newPhotoUrl.trim()) {
      setPhotoError('يرجى اختيار صورة من جهازك أو إدخال رابط الصورة');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      let finalUrl = newPhotoUrl.trim();
      if (photoFile) {
        finalUrl = await api.uploadFile(photoFile, (pct) => setPhotoUploadProgress(pct));
      }

      await api.addPhoto({ url: finalUrl, title: newPhotoTitle.trim() });
      handleCancelPhotoPreview();
      setNewPhotoUrl('');
      setNewPhotoTitle('');
      onDataUpdated();
    } catch (err: any) {
      setPhotoError(err.message || 'فشل إضافة الصورة');
    } finally {
      setIsUploadingPhoto(false);
      setPhotoUploadProgress(0);
    }
  };

  // Delete Photo permanently from Firestore and storage
  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة نهائياً من الموقع والخادم؟')) return;
    setDeletingId(id);
    try {
      await api.deletePhoto(id);
      onDataUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الصورة');
    } finally {
      setDeletingId(null);
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

  // Add Reel (From file upload OR direct/YouTube URL)
  const handleAddReel = async (e: React.FormEvent) => {
    e.preventDefault();
    setReelError('');

    if (!reelFile && !newReelUrl.trim()) {
      setReelError('يرجى اختيار فيديو من جهازك أو إدخال رابط الفيديو');
      return;
    }

    setIsUploadingReel(true);
    try {
      let finalUrl = newReelUrl.trim();
      if (reelFile) {
        finalUrl = await api.uploadFile(reelFile, (pct) => setReelUploadProgress(pct));
      }

      await api.addReel({ url: finalUrl, title: newReelTitle.trim() });
      handleCancelReelPreview();
      setNewReelUrl('');
      setNewReelTitle('');
      onDataUpdated();
    } catch (err: any) {
      setReelError(err.message || 'فشل إضافة الفيديو');
    } finally {
      setIsUploadingReel(false);
      setReelUploadProgress(0);
    }
  };

  // Delete Reel permanently from Firestore and storage
  const handleDeleteReel = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفيديو نهائياً من الموقع والخادم؟')) return;
    setDeletingId(id);
    try {
      await api.deleteReel(id);
      onDataUpdated();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الفيديو');
    } finally {
      setDeletingId(null);
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
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-white tracking-wide">
                  لوحة تحكم إدارة <span className="text-red-500">PUMP CLUB</span>
                </h3>
                {isAuthenticated && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-[10px] text-emerald-400 font-bold">
                    <Cloud className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>سحابي مباشر (Cloud Live)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                {isAuthenticated ? (
                  <>
                    <span>متصل كمسؤول النظام (Admin)</span>
                    {currentUser?.email && (
                      <span className="text-emerald-400 font-mono text-[11px]">
                        • {currentUser.email}
                      </span>
                    )}
                  </>
                ) : (
                  'تسجيل دخول الإدارة المحمي بقاعدة البيانات السحابية'
                )}
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
            <p className="text-xs text-neutral-400 text-center mb-6">
              سجل دخولك لإدارة محتوى الصالة وحفظ كافة التعديلات مباشرة في قاعدة البيانات السحابية
            </p>

            {loginError && (
              <div className="w-full mb-6 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Google One-Click Admin Sign-in Button */}
            <button
              type="button"
              disabled={isLoggingIn}
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 active:scale-98 text-neutral-900 font-bold text-xs rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer mb-5 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>تسجيل الدخول السريع بحساب Google (المعتمد)</span>
            </button>

            <div className="w-full flex items-center gap-3 mb-5">
              <div className="h-[1px] bg-neutral-800 flex-1"></div>
              <span className="text-[11px] text-neutral-500 font-semibold">أو بكلمة المرور</span>
              <div className="h-[1px] bg-neutral-800 flex-1"></div>
            </div>

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

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingSettings ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSeedFirestore}
                      disabled={isSeeding}
                      className="flex items-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      title="مزامنة وتهيئة البيانات الأساسية في قاعدة البيانات السحابية"
                    >
                      <Cloud className="w-4 h-4 text-emerald-400" />
                      <span>{isSeeding ? 'جاري تهيئة السحاب...' : 'مزامنة السحاب الأولية'}</span>
                    </button>

                    {seedSuccess && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تمت مزامنة وتهيئة البيانات السحابية بنجاح!</span>
                      </span>
                    )}
                  </div>
                </form>
              )}

              {/* 2. PHOTOS MANAGEMENT */}
              {activeTab === 'photos' && (
                <div className="space-y-8">
                  {/* Add Photo Form & Direct Device Upload */}
                  <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-red-500" />
                          <span>إضافة صورة جديدة لصالة الجيم</span>
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          يمكنك اختيار الصورة مباشرة من معرض هاتفك أو حاسوبك، أو إدخال رابط خارجي
                        </p>
                      </div>

                      {/* Direct Upload Button */}
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl cursor-pointer transition-colors w-full sm:w-fit">
                        <Upload className="w-4 h-4" />
                        <span>اختيار صورة من الموبايل أو الكمبيوتر</span>
                        <input
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.heic"
                          className="hidden"
                          disabled={isUploadingPhoto}
                          onChange={handleSelectPhotoFile}
                        />
                      </label>
                    </div>

                    {photoError && (
                      <div className="p-3 mb-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{photoError}</span>
                      </div>
                    )}

                    {/* Preview Area for Selected File */}
                    {photoPreviewUrl && (
                      <div className="mb-4 p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-32 h-24 shrink-0 rounded-lg overflow-hidden bg-black border border-neutral-700">
                          <img
                            src={photoPreviewUrl}
                            alt="معاينة الصورة"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 w-full space-y-1 text-center sm:text-right">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>معاينة الصورة المختارة قبل الحفظ</span>
                            </span>
                            <button
                              type="button"
                              onClick={handleCancelPhotoPreview}
                              disabled={isUploadingPhoto}
                              className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                            >
                              إلغاء المعاينة
                            </button>
                          </div>
                          {photoFile && (
                            <p className="text-[11px] text-neutral-400 font-mono">
                              {photoFile.name} • {(photoFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          )}
                          {isUploadingPhoto && (
                            <div className="w-full pt-1 space-y-1">
                              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-red-600 h-full transition-all duration-300"
                                  style={{ width: `${photoUploadProgress}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-red-400 font-mono text-left" dir="ltr">
                                جاري الرفع والحفظ: {photoUploadProgress}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleAddPhoto} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-7">
                          <input
                            type="url"
                            placeholder="أو اكتب رابط مباشر للصورة (اختياري إذا قمت باختيار ملف أعلاه)"
                            value={newPhotoUrl}
                            onChange={(e) => {
                              setNewPhotoUrl(e.target.value);
                              if (e.target.value && photoFile) {
                                handleCancelPhotoPreview();
                              }
                            }}
                            disabled={isUploadingPhoto || !!photoFile}
                            className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none font-mono disabled:opacity-50"
                            dir="ltr"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="عنوان أو وصف الصورة"
                            value={newPhotoTitle}
                            onChange={(e) => setNewPhotoTitle(e.target.value)}
                            disabled={isUploadingPhoto}
                            className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={isUploadingPhoto || (!photoFile && !newPhotoUrl.trim())}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          >
                            {isUploadingPhoto ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري الحفظ...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>{photoFile ? 'رفع وحفظ' : 'إضافة'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Photos List */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-neutral-400" />
                      <span>الصور الحالية ({photos.length})</span>
                    </h4>

                    {photos.length === 0 ? (
                      <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 text-neutral-400 text-xs">
                        لا توجد صور مضافة بعد. ارفع صور الجيم من هاتفك أو حاسوبك أعلاه لتظهر فوراً لزوار الموقع في معرض الصور.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {photos.map((p) => {
                          const isEditing = editingPhotoId === p.id;
                          const isDeleting = deletingId === p.id;
                          return (
                            <div
                              key={p.id}
                              className="rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex flex-col group transition-all"
                            >
                              <div className="relative aspect-[4/3] bg-neutral-900 overflow-hidden">
                                <img
                                  src={p.url}
                                  alt={p.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
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
                                        className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 cursor-pointer"
                                      >
                                        حفظ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingPhotoId(null)}
                                        className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded hover:bg-neutral-700 cursor-pointer"
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
                                        className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 text-xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>تعديل</span>
                                      </button>

                                      <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => handleDeletePhoto(p.id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 disabled:opacity-50 rounded hover:bg-red-950/40 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        {isDeleting ? (
                                          <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>جاري الحذف...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>حذف نهائي</span>
                                          </>
                                        )}
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

              {/* 3. REELS / VIDEO MANAGEMENT */}
              {activeTab === 'reels' && (
                <div className="space-y-8">
                  {/* Add Reel Form & Direct Device Upload */}
                  <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <FileVideo className="w-4 h-4 text-red-500" />
                          <span>إضافة مقطع فيديو أو ريل جديد</span>
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          اختر ملف فيديو مباشرة من هاتفك أو جهازك (MP4 / WebM / MOV)، أو الصق رابط YouTube / Shorts
                        </p>
                      </div>

                      {/* Direct Upload Button */}
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl cursor-pointer transition-colors w-full sm:w-fit">
                        <Upload className="w-4 h-4" />
                        <span>اختيار فيديو من الموبايل أو الكمبيوتر</span>
                        <input
                          type="file"
                          accept="video/*,video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v,.mkv,.3gp"
                          className="hidden"
                          disabled={isUploadingReel}
                          onChange={handleSelectReelFile}
                        />
                      </label>
                    </div>

                    {reelError && (
                      <div className="p-3 mb-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{reelError}</span>
                      </div>
                    )}

                    {/* Interactive Preview for Uploaded File Video */}
                    {reelPreviewUrl && (
                      <div className="mb-4 p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            <span>معاينة مشغل الفيديو المختار قبل الحفظ</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleCancelReelPreview}
                            disabled={isUploadingReel}
                            className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                          >
                            إلغاء المعاينة
                          </button>
                        </div>

                        <div className="aspect-video max-h-56 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-neutral-700">
                          <video
                            src={reelPreviewUrl}
                            controls
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {reelFile && (
                          <p className="text-[11px] text-neutral-400 font-mono text-center sm:text-right">
                            {reelFile.name} • {(reelFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        )}

                        {isUploadingReel && (
                          <div className="w-full pt-1 space-y-1">
                            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-red-600 h-full transition-all duration-300"
                                style={{ width: `${reelUploadProgress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-red-400 font-mono text-left" dir="ltr">
                              جاري رفع وحفظ الفيديو: {reelUploadProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preview for URL if provided */}
                    {!reelPreviewUrl && newReelUrl.trim() && (
                      <div className="mb-4 p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>معاينة الرابط المدخل</span>
                        </span>
                        {(() => {
                          const vInfo = parseVideoUrl(newReelUrl.trim());
                          return (
                            <div className="aspect-video max-h-48 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-neutral-700">
                              {vInfo.type === 'youtube' && vInfo.embedUrl ? (
                                <iframe
                                  src={vInfo.embedUrl}
                                  title="YouTube preview"
                                  className="w-full h-full border-0"
                                />
                              ) : (
                                <video
                                  src={newReelUrl.trim()}
                                  controls
                                  playsInline
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <form onSubmit={handleAddReel} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-7">
                          <input
                            type="url"
                            placeholder="أو اكتب رابط فيديو (YouTube Shorts / YouTube / رابط MP4 مباشر)"
                            value={newReelUrl}
                            onChange={(e) => {
                              setNewReelUrl(e.target.value);
                              if (e.target.value && reelFile) {
                                handleCancelReelPreview();
                              }
                            }}
                            disabled={isUploadingReel || !!reelFile}
                            className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none font-mono disabled:opacity-50"
                            dir="ltr"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="عنوان المقطع (اختياري)"
                            value={newReelTitle}
                            onChange={(e) => setNewReelTitle(e.target.value)}
                            disabled={isUploadingReel}
                            className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs focus:border-red-600 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={isUploadingReel || (!reelFile && !newReelUrl.trim())}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          >
                            {isUploadingReel ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري الرفع...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                <span>{reelFile ? 'رفع وحفظ' : 'إضافة'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Reels List */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Film className="w-4 h-4 text-neutral-400" />
                      <span>المقاطع الحالية ({reels.length})</span>
                    </h4>

                    {reels.length === 0 ? (
                      <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 text-neutral-400 text-xs">
                        لا توجد مقاطع مضافة بعد. ارفع فيديوهات تدريبات وأبطال الجيم أعلاه لتظهر في قسم الفيديوهات والريلز.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reels.map((r) => {
                          const isEditing = editingReelId === r.id;
                          const isDeleting = deletingId === r.id;
                          const videoInfo = parseVideoUrl(r.url);

                          return (
                            <div
                              key={r.id}
                              className="rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex flex-col group transition-all"
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
                                    playsInline
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
                                        className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 cursor-pointer"
                                      >
                                        حفظ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingReelId(null)}
                                        className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded hover:bg-neutral-700 cursor-pointer"
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
                                        className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 text-xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>تعديل</span>
                                      </button>

                                      <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => handleDeleteReel(r.id)}
                                        className="p-1.5 text-red-400 hover:text-red-300 disabled:opacity-50 rounded hover:bg-red-950/40 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        {isDeleting ? (
                                          <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>جاري الحذف...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>حذف نهائي</span>
                                          </>
                                        )}
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

                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/${lead.phoneNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/60 transition-colors"
                              title="حذف الطلب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
