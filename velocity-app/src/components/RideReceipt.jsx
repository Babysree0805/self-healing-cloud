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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-xl space-y-5 text-center">
        {/* Celebration Icon */}
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold">
            Trip Completed
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">You Have Arrived!</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thank you for riding with Rydex
          </p>
        </div>

        {/* Fare Bill Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Total Fare Charged</span>
            <span className="text-lg font-bold text-emerald-700">₹{ride.estimated_fare || 64.0}</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Fare ({ride.ride_type || 'BIKE'})</span>
              <span className="text-slate-700">₹29.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Distance Travelled ({ride.distance_km || 5.4} km)</span>
              <span className="text-slate-700">₹{Math.max(0, (ride.estimated_fare || 64.0) - 29).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rydex Safety & Helmet Fee</span>
              <span className="text-emerald-700 font-semibold">FREE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Mode</span>
              <span className="text-slate-800 font-semibold">UPI / Cash on Drop</span>
            </div>
          </div>
        </div>

        {/* Rate Captain */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">
            Rate your trip with {ride.captain?.name || 'Captain'}
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setRating(star);
                  setFeedbackGiven(true);
                }}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    star <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {feedbackGiven && (
            <div className="text-[11px] font-mono text-emerald-700 font-medium">
              Thanks for the 5-star rating!
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide transition-all shadow-xs"
        >
          Close Receipt
        </button>
      </div>
    </div>
  );
};
