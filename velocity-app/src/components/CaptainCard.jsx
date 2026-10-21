import React from 'react';
import {
  Phone,
  MessageSquare,
  Shield,
  Star,
  Clock,
  Navigation,
  XCircle,
  CheckCircle2,
  Lock,
  Radio,
  Sparkles,
} from 'lucide-react';

export const CaptainCard = ({
  ride,
  onCancel,
  onComplete,
}) => {
  if (!ride) return null;

  const isSearching = ride.status === 'REQUESTED' || !ride.captain;
  const isArrived = ride.status === 'ARRIVED_PICKUP';
  const isInTransit = ride.status === 'IN_TRANSIT';

  const captain = ride.captain || {
    name: 'Ramesh Gowda',
    vehicle: 'Yamaha FZ-S (Yellow/Black)',
    plate: 'KA 05 EK 4821',
    rating: 4.92,
    phone: '+91 98450 12384',
    total_rides: 1420
  };

  const rideTypeIcon = ride.ride_type === 'BIKE' ? '🛵' : ride.ride_type === 'AUTO' ? '🛺' : '🚗';

  if (isSearching) {
    return (
      <div className="glass-card rounded-2xl p-6 border-2 border-[#FFDE00]/40 shadow-[0_0_35px_rgba(255,222,0,0.2)] space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans">
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#FFDE00] animate-ping opacity-75" />
            <div className="w-12 h-12 rounded-full bg-[#FFDE00]/20 border border-[#FFDE00] flex items-center justify-center text-[#FFDE00] text-xl">
              {rideTypeIcon}
            </div>
          </div>

          <div>
            <div className="text-xs font-mono font-bold text-[#FFDE00] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFDE00] animate-pulse" />
              <span>Connecting to Rydex Captains</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">Dispatched to Nearby Fleet</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Switching to Driver tab or nearby active Captain will pop up this request to accept.
            </p>
          </div>
        </div>

        {/* Fare & Route Info */}
        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5 space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Pickup:</span>
            <span className="text-white font-semibold truncate max-w-[200px]">{ride.pickup_address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Dropoff:</span>
            <span className="text-white font-semibold truncate max-w-[200px]">{ride.dropoff_address}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-white/10">
            <span className="text-slate-400">Estimated Fare:</span>
            <span className="text-sm font-bold text-[#FFDE00]">₹{ride.estimated_fare}</span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 font-mono"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel Ride Request</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Header: Status & Estimated Arrival */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFDE00]/10 border border-[#FFDE00]/30 flex items-center justify-center text-xl">
            {rideTypeIcon}
          </div>
          <div>
            <div className="text-[11px] font-mono text-[#FFDE00] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFDE00] animate-ping" />
              <span>
                {isArrived
                  ? 'Captain Arrived at Pickup!'
                  : isInTransit
                  ? 'Trip in Progress'
                  : 'Captain On The Way'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">
              {isArrived ? 'Waiting at your spot' : isInTransit ? 'Heading to Dropoff' : 'Arriving in ~2 mins'}
            </h3>
          </div>
        </div>

        {/* Start OTP Callout */}
        <div className="bg-[#FFDE00] text-black px-3.5 py-1.5 rounded-xl flex flex-col items-center shadow-lg">
          <div className="text-[9px] font-mono uppercase font-bold tracking-wider opacity-80">Start OTP</div>
          <div className="text-lg font-mono font-extrabold tracking-widest">{ride.otp || '4821'}</div>
        </div>
      </div>

      {/* Captain Profile Details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 to-[#FFDE00] p-0.5 shadow-md">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                {(captain?.name || 'Ramesh').charAt(0)}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[9px] font-bold text-black flex items-center gap-0.5 shadow">
              <Star className="w-2.5 h-2.5 fill-black" />
              <span>{captain?.rating || 4.92}</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{captain?.name || 'Ramesh Gowda'}</span>
              <Shield className="w-3.5 h-3.5 text-[#FFDE00]" title="Verified Rydex Captain" />
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">{captain?.vehicle || 'Yamaha FZ-S'}</div>
            <div className="text-[11px] font-mono text-slate-400 font-semibold">{captain?.plate || 'KA 05 EK 4821'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${captain?.phone || '+919845012384'}`}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#FFDE00] hover:text-black text-slate-200 border border-white/10 flex items-center justify-center transition-all shadow-md active:scale-95"
            title="Call Captain"
          >
            <Phone className="w-4 h-4" />
          </a>
          <button
            onClick={() => alert(`Chat with ${captain?.name || 'Captain'}: "I am at the main gate!"`)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#FFDE00] hover:text-black text-slate-200 border border-white/10 flex items-center justify-center transition-all shadow-md active:scale-95"
            title="Message Captain"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ride Progress Bar */}
      <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Total Distance</span>
          <span className="text-white font-semibold">{ride.distance_km || 6.4} km</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Total Fare (Cash/UPI)</span>
          <span className="text-[#FFDE00] font-bold text-sm">₹{ride.estimated_fare}</span>
        </div>
      </div>

      {/* Emergency & Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={onCancel}
          className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel Ride</span>
        </button>

        <button
          onClick={onComplete}
          className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Complete Ride</span>
        </button>
      </div>
    </div>
  );
};

export default CaptainCard;
