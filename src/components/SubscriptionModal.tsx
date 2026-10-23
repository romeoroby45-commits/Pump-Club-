import React, { useState, useEffect } from 'react';
import { X, Check, Dumbbell, Send, Smartphone, Globe, CreditCard, ChevronDown } from 'lucide-react';
import { SubscriptionPlan, PaymentMethod, SubscriptionFormData } from '../types';
import { COUNTRIES, DEFAULT_COUNTRY } from '../data/countries';
import { api } from '../services/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  initialPlan?: SubscriptionPlan | null;
  whatsappNumber: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  plans,
  initialPlan,
  whatsappNumber
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Vodafone Cash');
  const [searchCountry, setSearchCountry] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setSelectedPlanId(initialPlan.id);
    } else if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [initialPlan, plans]);

  if (!isOpen) return null;

  const currentPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.includes(searchCountry) ||
    c.nameEn.toLowerCase().includes(searchCountry.toLowerCase()) ||
    c.dialCode.includes(searchCountry)
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'يرجى إدخال الاسم بالكامل';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'يرجى إدخال رقم الهاتف';
    } else if (phoneNumber.replace(/[^0-9]/g, '').length < 6) {
      newErrors.phoneNumber = 'رقم الهاتف غير صالح';
    }
    if (!currentPlan) {
      newErrors.plan = 'يرجى اختيار باقة الاشتراك';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Format clean phone number with dial code
    const cleanRawPhone = phoneNumber.trim().replace(/^0+/, ''); // strip leading zero
    const formattedFullPhone = `${selectedCountry.dialCode} ${cleanRawPhone}`;

    const submissionData: SubscriptionFormData = {
      fullName: fullName.trim(),
      phoneNumber: formattedFullPhone,
      country: selectedCountry.name,
      countryCode: selectedCountry.dialCode,
      subscriptionDuration: currentPlan ? currentPlan.duration : 'اشتراك بامب كلوب',
      price: currentPlan ? currentPlan.price : 0,
      paymentMethod
    };

    // Save lead to persistent backend database
    try {
      await api.submitSubscription(submissionData);
    } catch (err) {
      console.error('Failed to log subscription to server:', err);
    }

    // Construct the WhatsApp message exactly as requested
    const message = `طلب اشتراك جديد - Pump Club 🏋️‍♂️

Customer Name: ${submissionData.fullName}
Phone: ${submissionData.phoneNumber}
Country: ${submissionData.country} (${selectedCountry.nameEn})
Country Code: ${submissionData.countryCode}
Subscription: ${submissionData.subscriptionDuration}
Price: ${submissionData.price} EGP
Payment Method: ${submissionData.paymentMethod}

يرجى تأكيد الاشتراك وتفاصيل الدفع. شكراً!`;

    // Target WhatsApp contact: 01113220002 -> international format 201113220002
    const rawTargetNumber = (whatsappNumber || '01113220002').replace(/[^0-9]/g, '');
    const targetWithCountryCode = rawTargetNumber.startsWith('2') ? rawTargetNumber : `20${rawTargetNumber.replace(/^0+/, '')}`;

    const whatsappUrl = `https://wa.me/${targetWithCountryCode}?text=${encodeURIComponent(message)}`;

    setIsSubmitting(false);
    onClose();

    // Open WhatsApp in new tab/app
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={() => {
          if (isCountryDropdownOpen) setIsCountryDropdownOpen(false);
        }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-700 to-red-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">
                استمارة الاشتراك في PUMP CLUB
              </h3>
              <p className="text-xs text-red-100">
                أدخل بياناتك لتأكيد الاشتراك والتواصل المباشر عبر واتساب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

          {/* Plan Selection Summary */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              باقة الاشتراك المختارة
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {plans.map((p) => {
                const isSelected = p.id === selectedPlanId;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-red-600 bg-red-600/10 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                        : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-red-500' : 'text-white'}`}>
                        {p.duration}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    <div className="text-sm font-extrabold text-white" dir="ltr">
                      <span className="font-display tabular-nums">{p.price}</span> <span className="text-xs text-red-400">EGP</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.plan && <p className="text-red-500 text-xs mt-1">{errors.plan}</p>}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              الاسم بالكامل (Customer Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: محمد أحمد علي"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-sm"
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* Country & Calling Code Selection */}
          <div className="relative">
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              الدولة وكود الاتصال الدولي (Country & Code) <span className="text-red-500">*</span>
            </label>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCountryDropdownOpen(!isCountryDropdownOpen);
              }}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white flex items-center justify-between text-sm hover:border-neutral-700"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{selectedCountry.flag}</span>
                <span className="font-bold">{selectedCountry.name}</span>
                <span className="text-neutral-400 text-xs">({selectedCountry.nameEn})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-red-400 font-display font-bold text-xs" dir="ltr">
                  {selectedCountry.dialCode}
                </span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </div>
            </button>

            {/* Country Dropdown */}
            {isCountryDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute z-30 top-full left-0 right-0 mt-1 bg-neutral-950 border border-neutral-700 rounded-xl shadow-2xl max-h-60 overflow-hidden flex flex-col"
              >
                <div className="p-2 border-b border-neutral-800">
                  <input
                    type="text"
                    placeholder="ابحث عن دولة أو كود..."
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-xs focus:outline-none focus:border-red-600"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto divide-y divide-neutral-900">
                  {filteredCountries.map((country) => (
                    <button
                      type="button"
                      key={country.code}
                      onClick={() => {
                        setSelectedCountry(country);
                        setIsCountryDropdownOpen(false);
                        setSearchCountry('');
                      }}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-right hover:bg-neutral-900 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{country.flag}</span>
                        <span className="text-white font-medium">{country.name}</span>
                        <span className="text-neutral-500">({country.nameEn})</span>
                      </div>
                      <span className="font-display font-bold text-red-400" dir="ltr">
                        {country.dialCode}
                      </span>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="p-4 text-center text-xs text-neutral-500">
                      لم يتم العثور على الدولة
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">
              رقم الهاتف (Phone Number) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center" dir="ltr">
              <span className="absolute left-3 px-2 py-1 rounded bg-neutral-800 text-red-400 font-bold text-xs select-none">
                {selectedCountry.dialCode}
              </span>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="1113220002"
                className="w-full pl-20 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              أدخل رقم الهاتف بدون الصفر الأول إذا كان مسبوقاً بكود الدولة.
            </p>
            {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-2">
              طريقة الدفع المختارة (Payment Method) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'Vodafone Cash'
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Vodafone Cash'}
                  onChange={() => setPaymentMethod('Vodafone Cash')}
                  className="accent-red-600"
                />
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-white">Vodafone Cash</span>
                  <span className="text-[11px] text-red-400 font-medium">فودافون كاش</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'InstaPay'
                    ? 'border-red-600 bg-red-600/10'
                    : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'InstaPay'}
                  onChange={() => setPaymentMethod('InstaPay')}
                  className="accent-red-600"
                />
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-white">InstaPay</span>
                  <span className="text-[11px] text-red-400 font-medium">إنستاباي</span>
                </div>
              </label>
            </div>
          </div>

          {/* Summary Box */}
          {currentPlan && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
              <div className="text-neutral-300">
                <span className="text-neutral-400">إجمالي المبلغ المطلوب: </span>
                <span className="text-white font-extrabold text-sm">{currentPlan.duration}</span>
              </div>
              <div className="text-red-500 font-display font-black text-lg" dir="ltr">
                {currentPlan.price} EGP
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-base rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            <span>إرسال وتأكيد الاشتراك عبر واتساب</span>
          </button>

          <p className="text-center text-[11px] text-neutral-500">
            سيتم فتح محادثة واتساب رسمية مباشرة مع إدارة النادي على الرقم: <span className="text-neutral-400 font-mono" dir="ltr">01113220002</span>
          </p>

        </form>
      </div>
    </div>
  );
};
