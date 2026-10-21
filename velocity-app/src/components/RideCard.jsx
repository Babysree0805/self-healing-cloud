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
        return '🛵';
      case 'AUTO':
        return '🛺';
      case 'CAB_ECONOMY':
        return '🚗';
      case 'CAB_PREMIUM':
        return '🚘';
      default:
        return '🛵';
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
              className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between border ${
                isSelected
                  ? 'bg-[#182030] border-[#FFDE00] shadow-[0_0_20px_-5px_rgba(255,222,0,0.3)]'
                  : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    isSelected ? 'bg-[#FFDE00]/20' : 'bg-white/5'
                  }`}
                >
                  {getIcon(cat.id)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{cat.name}</span>
                    {cat.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFDE00] text-black uppercase">
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3 h-3 text-[#FFDE00]" />
                      <span>{cat.eta_mins} mins away</span>
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-400">{cat.duration_mins} min trip</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold font-mono text-white">
                  ₹{cat.fare}
                </div>
                {cat.helmet_provided && (
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Helmet on-spot</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Error Notice (Subtle, realistic error, not a mock popup) */}
      {bookingError && (
        <div className="p-3.5 rounded-2xl bg-red-950/90 border border-red-700/80 text-xs font-mono text-red-200 flex items-start gap-2.5 shadow-xl animate-in fade-in duration-200">
          <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-red-300">
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
            <div className="text-slate-300 text-[11px] leading-relaxed">
              {bookingError}
            </div>
            <div className="pt-1 text-[10px] text-amber-300 flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span>Autonomous SRE agent healing cluster. Auto-resolves within 10s...</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <button
        onClick={onBookRide}
        disabled={isBooking}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 ${
          isBooking
            ? 'bg-slate-800 text-slate-400 cursor-wait'
            : 'bg-[#FFDE00] hover:bg-[#ffe633] text-black yellow-glow hover:shadow-[0_0_30px_-2px_rgba(255,222,0,0.5)]'
        }`}
      >
        {isBooking ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono">Connecting to Dispatch Gateway...</span>
          </>
        ) : (
          <>
            <span>Book {selectedCategory?.name || 'Velocity Ride'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </>
        )}
      </button>
    </div>
  );
};
