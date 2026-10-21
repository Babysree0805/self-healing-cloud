import React, { useState } from 'react';
import {
  CheckCircle2,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  Receipt,
  Download,
} from 'lucide-react';

export const RideReceipt = ({ ride, onClose }) => {
  const [rating, setRating] = useState(5);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  if (!ride) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6 text-center">
        {/* Celebration Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
            Trip Completed
          </div>
          <h2 className="text-2xl font-black text-white mt-1">You Have Arrived!</h2>
          <p className="text-xs text-slate-400 mt-1">
            Hope you had a safe and fast ride with Velocity
          </p>
        </div>

        {/* Fare Bill Card */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/5 text-left space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-slate-400">Total Fare Charged</span>
            <span className="text-xl font-bold text-[#FFDE00]">₹{ride.estimated_fare || 64.0}</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Fare ({ride.ride_type || 'BIKE'})</span>
              <span>₹29.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Distance Travelled ({ride.distance_km || 5.4} km)</span>
              <span>₹{Math.max(0, (ride.estimated_fare || 64.0) - 29).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Velocity Safety & Helmet Fee</span>
              <span className="text-emerald-400">FREE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Mode</span>
              <span className="text-white font-semibold">UPI / Cash on Drop</span>
            </div>
          </div>
        </div>

        {/* Rate Captain */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300">
            Rate your trip with {ride.captain?.name || 'Captain'}
          </div>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setRating(star);
                  setFeedbackGiven(true);
                }}
                className="p-1.5 transition-transform active:scale-125"
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    star <= rating
                      ? 'fill-[#FFDE00] text-[#FFDE00]'
                      : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {feedbackGiven && (
            <div className="text-[11px] font-mono text-emerald-400 animate-in fade-in">
              Thanks for the 5-star rating!
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#FFDE00] hover:bg-[#ffe633] text-black font-bold text-sm tracking-wide transition-all shadow-lg active:scale-95"
        >
          Book Another Ride
        </button>
      </div>
    </div>
  );
};
