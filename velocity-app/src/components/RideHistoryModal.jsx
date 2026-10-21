import React, { useState, useEffect } from 'react';
import { ridesApi } from '../services/api';
import { X, Clock, MapPin, CheckCircle2, ChevronRight, RefreshCw, Bike, Car } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-xl relative space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your Past Rydex Rides</h2>
              <p className="text-[11px] font-mono text-slate-400">All trips, invoices & captain details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRides}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {rides.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              No rides found. Book your first Rydex ride today!
            </div>
          ) : (
            rides.map((r) => (
              <div
                key={r.ride_id}
                onClick={() => onSelectRide && onSelectRide(r)}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-white border border-slate-200 text-emerald-700">
                      {r.ride_type === 'AUTO' ? <Car className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {r.ride_type || 'BIKE'} Taxi
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                      {r.status}
                    </span>
                  </div>

                  <span className="text-xs font-bold font-mono text-emerald-700">
                    ₹{r.estimated_fare}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-600 space-y-1 pl-2 border-l-2 border-emerald-500">
                  <div className="truncate">
                    <span className="text-emerald-700 font-semibold">From: </span>
                    {r.pickup_address}
                  </div>
                  <div className="truncate">
                    <span className="text-rose-600 font-semibold">To: </span>
                    {r.dropoff_address}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
