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
  Bike,
  Car,
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

  const renderRideIcon = () => {
    if (ride.ride_type === 'AUTO') return <Car className="w-5 h-5 text-emerald-700" />;
    return <Bike className="w-5 h-5 text-emerald-700" />;
  };

  if (isSearching) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            {renderRideIcon()}
          </div>

          <div>
            <div className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connecting to Rydex Captains</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">Dispatched to Nearby Fleet</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Switching to Driver tab or nearby active Captain will pop up this request to accept.
            </p>
          </div>
        </div>

        {/* Fare & Route Info */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Pickup:</span>
            <span className="text-slate-800 font-semibold truncate max-w-[200px]">{ride.pickup_address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Dropoff:</span>
            <span className="text-slate-800 font-semibold truncate max-w-[200px]">{ride.dropoff_address}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-400">Estimated Fare:</span>
            <span className="text-sm font-bold text-emerald-700">₹{ride.estimated_fare}</span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-2.5 px-4 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 font-mono"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel Ride Request</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
      {/* Top Header: Status & Estimated Arrival */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            {renderRideIcon()}
          </div>
          <div>
            <div className="text-[11px] font-mono text-emerald-800 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>
                {isArrived
                  ? 'Captain Arrived at Pickup'
                  : isInTransit
                  ? 'Trip in Progress'
                  : 'Captain On The Way'}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-800 mt-0.5">
              {isArrived ? 'Waiting at your spot' : isInTransit ? 'Heading to Dropoff' : 'Arriving in ~2 mins'}
            </h3>
          </div>
        </div>

        {/* Start OTP Callout */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg flex flex-col items-center">
          <div className="text-[9px] font-mono uppercase font-bold tracking-wider opacity-80">Start OTP</div>
          <div className="text-base font-mono font-bold tracking-widest">{ride.otp || '4821'}</div>
        </div>
      </div>

      {/* Captain Profile Details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-base">
              {(captain?.name || 'Ramesh').charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-white text-[9px] font-bold text-slate-700 border border-slate-200 flex items-center gap-0.5 shadow-xs">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span>{captain?.rating || 4.92}</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>{captain?.name || 'Ramesh Gowda'}</span>
              <Shield className="w-3.5 h-3.5 text-emerald-600" title="Verified Rydex Captain" />
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{captain?.vehicle || 'Yamaha FZ-S'}</div>
            <div className="text-[11px] font-mono text-slate-400 font-semibold">{captain?.plate || 'KA 05 EK 4821'}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={`tel:${captain?.phone || '+919845012384'}`}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition-all shadow-xs"
            title="Call Captain"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => alert(`Chat with ${captain?.name || 'Captain'}: "I am at the main gate!"`)}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center transition-all shadow-xs"
            title="Message Captain"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ride Progress Bar */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Total Distance</span>
          <span className="text-slate-800 font-semibold">{ride.distance_km || 6.4} km</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Total Fare (Cash/UPI)</span>
          <span className="text-emerald-700 font-bold text-sm">₹{ride.estimated_fare}</span>
        </div>
      </div>

      {/* Emergency & Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={onCancel}
          className="py-2.5 px-4 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel Ride</span>
        </button>

        <button
          onClick={onComplete}
          className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Complete Ride</span>
        </button>
      </div>
    </div>
  );
};

export default CaptainCard;
