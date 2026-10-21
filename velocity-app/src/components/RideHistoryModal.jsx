import React, { useState, useEffect } from 'react';
import { ridesApi } from '../services/api';
import { X, Clock, MapPin, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

export const RideHistoryModal = ({ isOpen, onClose, onSelectRide }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRides();
    }
  }, [isOpen]);

  const loadRides = async () => {
    setLoading(true);
    try {
      const data = await ridesApi.listRides();
      setRides(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFDE00]/10 text-[#FFDE00]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Your Past Velocity Rides</h2>
              <p className="text-[11px] font-mono text-slate-400">All trips, invoices & captain details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRides}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FFDE00]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {rides.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              No rides found. Book your first Velocity ride today!
            </div>
          ) : (
            rides.map((r) => (
              <div
                key={r.ride_id}
                onClick={() => onSelectRide && onSelectRide(r)}
                className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-[#FFDE00]/30 hover:bg-slate-900/90 transition-all cursor-pointer space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {r.ride_type === 'BIKE' ? '🛵' : r.ride_type === 'AUTO' ? '🛺' : '🚗'}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {r.ride_type || 'BIKE'} Taxi
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                      {r.status}
                    </span>
                  </div>

                  <span className="text-sm font-bold font-mono text-[#FFDE00]">
                    ₹{r.estimated_fare}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-300 space-y-1 pl-2 border-l-2 border-slate-700">
                  <div className="truncate">
                    <span className="text-emerald-400 font-bold">From: </span>
                    {r.pickup_address}
                  </div>
                  <div className="truncate">
                    <span className="text-red-400 font-bold">To: </span>
                    {r.dropoff_address}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-500">
                  <span>{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {r.captain?.name && (
                    <span className="text-slate-400">Captain: {r.captain.name}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
