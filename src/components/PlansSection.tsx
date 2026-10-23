import React from 'react';
import { Dumbbell, Check, Flame, Trophy } from 'lucide-react';
import { SubscriptionPlan } from '../types';

interface PlansSectionProps {
  plans: SubscriptionPlan[];
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({ plans, onSelectPlan }) => {
  const sortedPlans = [...plans].sort((a, b) => a.order - b.order);

  return (
    <section id="plans" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-red-600/40 text-red-500 font-bold text-xs uppercase tracking-widest mb-3">
          <Flame className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          <span>عضويات واشتراكات النادي</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-display">
          باقات اشتراك <span className="text-red-500">PUMP CLUB</span>
        </h2>
        <p className="text-neutral-400 text-sm sm:text-base mt-3 leading-relaxed">
          اختر الباقة المناسبة لأهدافك الرياضية. جميع الأسعار بالجنيه المصري (EGP) وتشمل كافة مرافق الصالة والمعدات.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sortedPlans.map((plan) => {
          const isFeatured = plan.isPopular || plan.badge;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                isFeatured
                  ? 'bg-neutral-900/90 border-2 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.25)] lg:-translate-y-2'
                  : 'bg-neutral-950 border border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1 bg-red-600 text-white text-[11px] font-extrabold uppercase rounded-full shadow-md tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3 h-3 text-white" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div className="p-6 sm:p-7">
                {/* Duration */}
                <div className="mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {plan.duration}
                  </h3>
                  <span className="text-xs text-neutral-400">عضوية رياضية متكاملة</span>
                </div>

                {/* Price */}
                <div className="my-6 pb-6 border-b border-neutral-800 flex items-baseline gap-1.5" dir="ltr">
                  <span className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight tabular-nums">
                    {plan.price.toLocaleString('en-US')}
                  </span>
                  <span className="text-red-500 font-bold text-base">
                    {plan.currency || 'EGP'}
                  </span>
                  <span className="text-neutral-500 text-xs mr-2">/ لفترة الاشتراك</span>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-neutral-400 mb-2">مميزات الاشتراك:</p>
                  {plan.features && plan.features.length > 0 ? (
                    plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-300">
                        <div className="w-4 h-4 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-2.5 text-xs text-neutral-400">
                      <Check className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>دخول واستخدام كامل للمعدات</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="p-6 sm:p-7 pt-0">
                <button
                  onClick={() => onSelectPlan(plan)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-95 ${
                    isFeatured
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100 hover:text-white border border-neutral-700'
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>اشترك الآن</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
};
