import React from 'react';
import {
  Bike,
  Car,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

export const RideCard = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  onBookRide,
  isBooking,
  bookingError,
}) => {
  const getIcon = (type) => {
    switch (type) {
      case 'BIKE':
        return <Bike className="w-5 h-5 text-emerald-700" />;
      case 'AUTO':
        return <Car className="w-5 h-5 text-emerald-700" />;
      case 'CAB_ECONOMY':
      case 'CAB_PREMIUM':
        return <Car className="w-5 h-5 text-emerald-700" />;
      default:
        return <Bike className="w-5 h-5 text-emerald-700" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Category List */}
      <div className="space-y-2.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className={`p-3.5 rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-between border ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isSelected ? 'bg-emerald-100 border border-emerald-300' : 'bg-slate-100 border border-slate-200'
                  }`}
                >
                  {getIcon(cat.id)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                    {cat.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>{cat.eta_mins} mins away</span>
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-400">{cat.duration_mins} min trip</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-bold font-mono text-slate-900">
                  ₹{cat.fare}
                </div>
                {cat.helmet_provided && (
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Helmet on-spot</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Error Notice */}
      {bookingError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800 flex items-start gap-2.5 shadow-xs">
          <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-rose-900">
              {bookingError.includes('429')
                ? 'Traffic Congestion Ingress Throttled'
                : bookingError.includes('Database') || bookingError.includes('500')
                ? 'Database Lock Contention Detected'
                : bookingError.includes('504') || bookingError.includes('Timeout')
                ? 'Gateway Timeout - CPU Throttled'
                : bookingError.includes('503') || bookingError.includes('Crash')
                ? 'Service Unavailable (CrashLoopBackOff)'
                : 'Booking Request Blocked'}
            </div>
            <div className="text-rose-700 text-[11px] leading-relaxed">
              {bookingError}
            </div>
            <div className="pt-1 text-[10px] text-amber-800 flex items-center gap-1.5 font-medium">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Autonomous SRE agent healing cluster. Auto-resolves within 10s...</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <button
        onClick={onBookRide}
        disabled={isBooking}
        className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 ${
          isBooking
            ? 'bg-slate-200 text-slate-500 cursor-wait'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        {isBooking ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono">Connecting to Dispatch Gateway...</span>
          </>
        ) : (
          <>
            <span>Book {selectedCategory?.name || 'Rydex Ride'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </>
        )}
      </button>
    </div>
  );
};
