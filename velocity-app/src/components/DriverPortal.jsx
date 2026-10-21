import React, { useState, useEffect } from 'react';
import { RealTimeMap } from './RealTimeMap';
import { driverApi, ridesApi, locationApi, chaosApi } from '../services/api';
import {
  Bike,
  Navigation,
  Phone,
  MessageSquare,
  Shield,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Wallet,
  Zap,
  MapPin,
  Compass,
  Radio,
  User,
  Package,
  Car,
  QrCode,
  DollarSign,
  Award,
  Sparkles,
} from 'lucide-react';

export const DriverPortal = ({ driverUser, faultActive, activeFaults = [], onHealFault }) => {
  // Captain Profile State
  const [selectedCaptainId, setSelectedCaptainId] = useState(driverUser?.driver_id || 'DRV-001');
  const [statsPeriod, setStatsPeriod] = useState('DAILY'); // 'DAILY' | 'MONTHLY'

  const [captainStats, setCaptainStats] = useState({
    driver_id: 'DRV-001',
    name: driverUser?.name || 'Ramesh Gowda',
    vehicle: driverUser?.vehicle || 'Yamaha FZ-S (Yellow/Black)',
    plate: 'KA 05 EK 4821',
    rating: 4.92,
    // Daily Analytics
    today_earnings: 1680.0,
    today_trips: 14,
    today_accepted_rides: 14,
    today_acceptance_rate: 98.4,
    today_duty_hours: 6.5,
    today_incentive_target: 15,
    today_incentive_bonus: 300.0,
    // Monthly Analytics
    monthly_earnings: 42850.0,
    monthly_trips: 348,
    monthly_accepted_rides: 348,
    monthly_acceptance_rate: 97.8,
    monthly_duty_days: 24,
    monthly_incentive_bonus: 3800.0,
    wallet_balance: 4210.50,
  });

  // Duty Status (Online / Offline)
  const [isOnline, setIsOnline] = useState(true);
  const [dutyLoading, setDutyLoading] = useState(false);

  // Service Preferences
  const [allowedServices, setAllowedServices] = useState({
    BIKE: true,
    AUTO: true,
    PARCEL: true,
  });

  // Incoming Order Dispatch Alert (from real passenger request)
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [countdown, setCountdown] = useState(15);

  // Active Trip Lifecycle
  // null | 'EN_ROUTE_PICKUP' | 'ARRIVED_PICKUP' | 'IN_TRANSIT' | 'PAYMENT_COLLECTION'
  const [activeTrip, setActiveTrip] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [cashoutNotice, setCashoutNotice] = useState('');
  const [dutyError, setDutyError] = useState('');
  const [cashoutError, setCashoutError] = useState('');
  const [activeChaosInfo, setActiveChaosInfo] = useState(null);

  // Fetch initial driver stats
  useEffect(() => {
    loadDriverData();
  }, [selectedCaptainId]);

  const loadDriverData = async () => {
    try {
      const stats = await driverApi.getStats(selectedCaptainId);
      if (stats) {
        setCaptainStats((prev) => ({
          ...prev,
          ...stats,
          today_accepted_rides: stats.today_accepted_rides ?? prev.today_accepted_rides ?? 14,
          monthly_accepted_rides: stats.monthly_accepted_rides ?? prev.monthly_accepted_rides ?? 348,
          today_acceptance_rate: stats.today_acceptance_rate ?? prev.today_acceptance_rate ?? 98.4,
          monthly_acceptance_rate: stats.monthly_acceptance_rate ?? prev.monthly_acceptance_rate ?? 97.8,
          monthly_earnings: stats.monthly_earnings ?? prev.monthly_earnings ?? 42850.0,
          monthly_trips: stats.monthly_trips ?? prev.monthly_trips ?? 348,
          monthly_duty_days: stats.monthly_duty_days ?? prev.monthly_duty_days ?? 24,
          monthly_incentive_bonus: stats.monthly_incentive_bonus ?? prev.monthly_incentive_bonus ?? 3800.0,
        }));
      }
    } catch (e) {
      console.warn('Using local captain stats fallback');
    }
  };

  const handleToggleDuty = async () => {
    setDutyLoading(true);
    setDutyError('');
    const targetStatus = !isOnline;

    // Check if Crash GPS fault is actively running on driver-service
    let isCrashActive = faultActive;
    if (activeChaosInfo && (activeChaosInfo.fault_type === 'SERVICE_CRASH' || activeChaosInfo.fault_type === 'NETWORK_PARTITION')) {
      isCrashActive = true;
    } else {
      const activeChaos = localStorage.getItem('rydex_active_chaos');
      if (activeChaos) {
        try {
          const parsed = JSON.parse(activeChaos);
          if (parsed.expires_at > Date.now() && (parsed.fault_type === 'SERVICE_CRASH' || parsed.fault_type === 'NETWORK_PARTITION')) {
            isCrashActive = true;
          }
        } catch (err) {}
      }
    }

    if (isCrashActive) {
      const remaining = activeChaosInfo?.remaining || 6;
      setDutyError(`503 Service Unavailable: Pod for 'driver-service' in CrashLoopBackOff (SIGSEGV Exit Code 137). Autonomous SRE restarting container (${remaining}s remaining)...`);
      setDutyLoading(false);
      setIsOnline(false);
      return;
    }

    try {
      await driverApi.setDuty(selectedCaptainId, targetStatus);
    } catch (e) {
      console.warn('Backend offline or 404 — driver duty toggled in Cloud Demo Mode');
    }

    setIsOnline(targetStatus);
    setDutyLoading(false);
  };

  // REAL PASSENGER RIDE MATCHING: Poll pending rides from backend
  useEffect(() => {
    if (!isOnline || activeTrip || incomingOrder) return;

    let isSubscribed = true;

    const pollPendingRides = async () => {
      try {
        const pending = await ridesApi.getPendingRides();
        if (!isSubscribed) return;

        if (Array.isArray(pending) && pending.length > 0) {
          const matched = pending.find((r) => allowedServices[r.ride_type] ?? true);
          if (matched && matched.ride_id !== incomingOrder?.ride_id) {
            setIncomingOrder({
              ride_id: matched.ride_id,
              orderId: matched.ride_id,
              type: matched.ride_type,
              typeLabel: matched.ride_type === 'BIKE' ? 'Rydex Bike' : (matched.ride_type === 'AUTO' ? 'Rydex Auto' : 'Rydex Parcel'),
              customerName: matched.rider_id === 'priya_sharma' ? 'Priya Sharma' : (matched.rider_id || 'Rydex Passenger'),
              customerRating: 4.94,
              pickupAddress: matched.pickup_address || 'MG Road Metro Station, Bengaluru',
              dropoffAddress: matched.dropoff_address || 'Koramangala Sony Signal, Bengaluru',
              pickupDistanceKm: 0.8,
              pickupTimeMins: 3,
              tripDistanceKm: matched.distance_km || 4.8,
              estimatedEarnings: matched.estimated_fare || 78.0,
              paymentMode: matched.payment_method || 'UPI',
              otp: matched.otp || '4821',
            });
            setCountdown(15);
          }
        }
      } catch (err) {
        // Cloud Demo Mode: check shared local storage for real-time ride matching across tabs
        const localRideStr = localStorage.getItem('rydex_active_ride');
        if (localRideStr) {
          try {
            const localRide = JSON.parse(localRideStr);
            if (localRide.status === 'REQUESTED' && localRide.ride_id !== incomingOrder?.ride_id) {
              setIncomingOrder({
                ride_id: localRide.ride_id,
                orderId: localRide.ride_id,
                type: localRide.ride_type || 'BIKE',
                typeLabel: localRide.ride_type === 'AUTO' ? 'Rydex Auto' : (localRide.ride_type === 'PARCEL' ? 'Rydex Parcel' : 'Rydex Bike'),
                customerName: 'Priya Sharma (Rider)',
                customerRating: 4.94,
                pickupAddress: localRide.pickup_location?.address || 'MG Road Metro Station, Bengaluru',
                dropoffAddress: localRide.dropoff_location?.address || 'Koramangala Sony Signal, Bengaluru',
                pickupDistanceKm: 0.8,
                pickupTimeMins: 3,
                tripDistanceKm: 4.8,
                estimatedEarnings: localRide.fare || 78.0,
                paymentMode: 'UPI',
                otp: '4821',
              });
              setCountdown(15);
            }
          } catch (e) {}
        }
      }
    };

    pollPendingRides();
    const interval = setInterval(pollPendingRides, 1500);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [isOnline, activeTrip, incomingOrder, allowedServices]);

  // Countdown timer for incoming order
  useEffect(() => {
    if (!incomingOrder) return;
    if (countdown <= 0) {
      setIncomingOrder(null);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingOrder, countdown]);

  const handleAcceptOrder = async () => {
    if (!incomingOrder) return;
    const orderToAccept = incomingOrder;
    try {
      if (orderToAccept.ride_id) {
        await ridesApi.acceptRide(orderToAccept.ride_id, selectedCaptainId);
      }
    } catch (e) {
      console.warn('Accept ride API error, proceeding locally:', e.message);
    }

    // Sync status to local storage for multi-tab cloud demo
    const localRideStr = localStorage.getItem('rydex_active_ride');
    if (localRideStr) {
      try {
        const parsed = JSON.parse(localRideStr);
        parsed.status = 'DRIVER_ASSIGNED';
        localStorage.setItem('rydex_active_ride', JSON.stringify(parsed));
      } catch (err) {}
    }

    setActiveTrip({
      ...orderToAccept,
      step: 'EN_ROUTE_PICKUP',
      startTime: new Date().toLocaleTimeString(),
    });
    setCaptainStats((prev) => ({
      ...prev,
      today_accepted_rides: (prev.today_accepted_rides || 14) + 1,
      monthly_accepted_rides: (prev.monthly_accepted_rides || 348) + 1,
    }));
    setIncomingOrder(null);
  };

  const handleDeclineOrder = () => {
    setIncomingOrder(null);
  };

  const handleArrivedAtPickup = async () => {
    if (!activeTrip) return;
    try {
      if (activeTrip.ride_id) {
        await ridesApi.captainArrived(activeTrip.ride_id);
      }
    } catch (e) {
      // ignore
    }
    setActiveTrip({ ...activeTrip, step: 'ARRIVED_PICKUP' });
  };

  const handleVerifyOtpAndStart = async () => {
    const valid =
      enteredOtp.trim() === String(activeTrip?.otp) ||
      enteredOtp.trim() === '1234' ||
      enteredOtp.trim().length === 4;

    if (valid) {
      setOtpError('');
      try {
        if (activeTrip?.ride_id) {
          await ridesApi.startTrip(activeTrip.ride_id, enteredOtp.trim());
        }
      } catch (e) {
        // ignore
      }
      setActiveTrip({ ...activeTrip, step: 'IN_TRANSIT' });
      setEnteredOtp('');
    } else {
      setOtpError(`Invalid OTP. Ask passenger for ${activeTrip?.otp || '4-digit OTP'}`);
    }
  };

  const handleCompleteTrip = async () => {
    setDutyError('');
    const fare = Number(activeTrip?.estimatedEarnings || 78.0);
    try {
      if (activeTrip?.ride_id) {
        await ridesApi.completeRide(activeTrip.ride_id);
      }
      await driverApi.completeTrip(selectedCaptainId, fare);
    } catch (e) {
      const errMsg = e.response?.data?.detail || e.message;
      if (errMsg && errMsg.includes('trip-service')) {
        setDutyError(errMsg);
        return;
      }
    }

    // Sync status to local storage for multi-tab cloud demo
    const localRideStr = localStorage.getItem('rydex_active_ride');
    if (localRideStr) {
      try {
        const parsed = JSON.parse(localRideStr);
        parsed.status = 'COMPLETED';
        localStorage.setItem('rydex_active_ride', JSON.stringify(parsed));
      } catch (err) {}
    }

    setCaptainStats((prev) => ({
      ...prev,
      today_earnings: Math.round(((prev.today_earnings || 0) + fare) * 100) / 100,
      monthly_earnings: Math.round(((prev.monthly_earnings || 0) + fare) * 100) / 100,
      today_trips: (prev.today_trips || 0) + 1,
      monthly_trips: (prev.monthly_trips || 0) + 1,
      wallet_balance: Math.round(((prev.wallet_balance || 0) + fare) * 100) / 100,
    }));
    setActiveTrip({ ...activeTrip, step: 'PAYMENT_COLLECTION' });
  };

  const handleFinishPaymentAndClose = () => {
    setActiveTrip(null);
    setEnteredOtp('');
    setOtpError('');
  };

  // Continuously sync active chaos fault from localStorage, storage events, and props
  useEffect(() => {
    const updateActiveChaos = () => {
      // 1. Check shared localStorage chaos state
      try {
        const stored = localStorage.getItem('rydex_active_chaos');
        if (stored) {
          const parsed = JSON.parse(stored);
          const remainingSec = (parsed.expires_at - Date.now()) / 1000;
          if (remainingSec > 0) {
            setActiveChaosInfo({
              fault_type: parsed.fault_type,
              service: parsed.service,
              remaining: Math.max(1, Math.ceil(remainingSec)),
              remainingExact: Math.max(0, Math.round(remainingSec * 10) / 10)
            });
            return;
          } else {
            localStorage.removeItem('rydex_active_chaos');
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {}

      // 2. Check activeFaults prop
      if (activeFaults && activeFaults.length > 0) {
        const f = activeFaults[0];
        setActiveChaosInfo({
          fault_type: f.failure_type,
          service: f.service_name,
          remaining: 6,
          remainingExact: 6.0
        });
        return;
      }

      // 3. Clear active chaos if healed and display recovery message
      setActiveChaosInfo((prev) => {
        if (prev) {
          setCashoutError('');
          setDutyError('');
          setCashoutNotice('Autonomous SRE Recovery Completed: Pod restored & healthy. Instant Cashout unblocked.');
          setTimeout(() => setCashoutNotice(''), 5000);
        }
        return null;
      });
    };

    updateActiveChaos();
    const interval = setInterval(updateActiveChaos, 200);
    const handleStorage = () => updateActiveChaos();
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [activeFaults, faultActive]);

  const handleInstantCashout = async () => {
    setDutyError('');
    setCashoutError('');

    // Check if Memory Leak or DB fault is currently active on trip-service
    let currentChaos = activeChaosInfo;
    if (!currentChaos) {
      try {
        const stored = localStorage.getItem('rydex_active_chaos');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.expires_at > Date.now()) {
            currentChaos = {
              fault_type: parsed.fault_type,
              remaining: Math.max(1, Math.ceil((parsed.expires_at - Date.now()) / 1000))
            };
          }
        }
      } catch (e) {}
    }

    if (currentChaos && (currentChaos.fault_type === 'MEMORY_LEAK' || currentChaos.fault_type === 'DB_BOTTLENECK')) {
      const isMem = currentChaos.fault_type === 'MEMORY_LEAK';
      const errMsg = isMem
        ? `500 Internal Server Error: Pod for 'trip-service' OOMKilled (Exit Code 137). Unbounded heap memory leak. Autonomous SRE Canary Rollback in progress (${currentChaos.remaining}s remaining)...`
        : `500 Internal Server Error: Database Lock Contention on 'trips' table. Connection pool exhausted (max 100 reached). Payout settlement blocked. Autonomous SRE recycling pool (${currentChaos.remaining}s remaining)...`;
      
      setCashoutError(errMsg);
      setDutyError(errMsg);
      return; // STRICT RETURN: Cashout is 100% BLOCKED while fault is active!
    }

    const balance = captainStats?.wallet_balance || 0;
    if (balance <= 0) return;
    setCashoutNotice(`₹${balance.toFixed(2)} transferred to Bank A/C (HDFC **4921) via IMPS.`);
    setTimeout(() => setCashoutNotice(''), 4500);
    setCaptainStats((prev) => ({ ...prev, wallet_balance: 0 }));
  };

  // Manual Trigger to simulate a passenger ride request if user tests driver screen alone
  const handleSimulatePassengerRequest = async () => {
    try {
      await ridesApi.requestRide({
        rider_id: 'Priya Sharma (Live App)',
        pickup_location: { address: 'Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408 },
        dropoff_location: { address: 'Koramangala Sony Signal', lat: 12.9352, lng: 77.6245 },
        ride_type: 'BIKE',
        payment_method: 'UPI',
      });
    } catch (e) {
      const demoRide = {
        ride_id: `RYD-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'REQUESTED',
        ride_type: 'BIKE',
        fare: 78.0,
        pickup_location: { address: 'Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408 },
        dropoff_location: { address: 'Koramangala Sony Signal', lat: 12.9352, lng: 77.6245 },
        otp: '4821',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('rydex_active_ride', JSON.stringify(demoRide));
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden h-full bg-[#F8FAF9] text-slate-900">
      {/* Left Column: Captain Status, Orders & Active Trip Cockpit */}
      <div className="w-full lg:w-[460px] xl:w-[500px] h-full overflow-y-auto bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 p-5 md:p-6 space-y-6 z-20 shadow-xs">
        <div className="space-y-6">
          {/* Captain Header Card */}
          <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-base text-emerald-800">
                    {captainStats?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-white text-[9px] font-bold text-slate-700 border border-slate-200 flex items-center gap-0.5 shadow-xs">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{captainStats?.rating || 4.92}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{captainStats?.name || 'Captain Ramesh'}</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                      VERIFIED
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{captainStats?.vehicle || 'Yamaha FZ-S'}</div>
                  <div className="text-[11px] font-mono text-slate-400 font-medium">{captainStats?.plate || 'KA 05 EK 4821'}</div>
                </div>
              </div>

              {/* Online / Offline Toggle */}
              <button
                onClick={handleToggleDuty}
                disabled={dutyLoading}
                className={`py-2 px-3.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-2 transition-all ${
                  isOnline
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-slate-400'}`} />
                <span>{isOnline ? 'ON DUTY' : 'OFFLINE'}</span>
              </button>
            </div>

            {/* Duty or Cashout Error Banner */}
            {dutyError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-rose-900">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Captain Operation Rejected</span>
                </div>
                <div className="text-[11px] text-rose-700 leading-relaxed">
                  {dutyError}
                </div>
                <div className="pt-1 text-[10px] text-rose-600 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3 h-3 text-rose-500" />
                  <span>Autonomous SRE agent is restoring cluster service (auto-heals in &le; 10s)...</span>
                </div>
              </div>
            )}

            {/* Cashout Notice Banner */}
            {cashoutNotice && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cashoutNotice}</span>
              </div>
            )}
          </div>

          {/* Daily vs Monthly Analytics Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Earnings & Rides</span>
            </span>

            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-mono">
              <button
                onClick={() => setStatsPeriod('DAILY')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statsPeriod === 'DAILY'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Today (Daily)
              </button>
              <button
                onClick={() => setStatsPeriod('MONTHLY')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statsPeriod === 'MONTHLY'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar (Daily vs Monthly View) */}
          {statsPeriod === 'DAILY' ? (
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Revenue</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">₹{(captainStats?.today_earnings || 0).toLocaleString()}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Accepted</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{captainStats?.today_accepted_rides || 14}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Rate</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">{captainStats?.today_acceptance_rate || 98.4}%</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Hours</div>
                <div className="text-sm font-bold text-slate-700 mt-0.5">{captainStats?.today_duty_hours || 6.5}h</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Revenue</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">₹{(captainStats?.monthly_earnings || 0).toLocaleString()}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Accepted</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{captainStats?.monthly_accepted_rides || 348}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Rate</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">{captainStats?.monthly_acceptance_rate || 97.8}%</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-medium">Days</div>
                <div className="text-sm font-bold text-slate-700 mt-0.5">{captainStats?.monthly_duty_days || 24}d</div>
              </div>
            </div>
          )}

          {/* Incentive Progress Target */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>{statsPeriod === 'DAILY' ? 'Daily Incentive Target' : 'Monthly Milestone Target'}</span>
              </span>
              <span className="text-slate-800 font-bold">
                {statsPeriod === 'DAILY'
                  ? `${captainStats?.today_trips || 14} / ${captainStats?.today_incentive_target || 15} Trips`
                  : `${captainStats?.monthly_trips || 348} / 380 Trips`}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{
                  width: `${
                    statsPeriod === 'DAILY'
                      ? Math.min(100, ((captainStats?.today_trips || 14) / (captainStats?.today_incentive_target || 15)) * 100)
                      : Math.min(100, ((captainStats?.monthly_trips || 348) / 380) * 100)
                  }%`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>
                {statsPeriod === 'DAILY'
                  ? `Complete ${Math.max(0, (captainStats?.today_incentive_target || 15) - (captainStats?.today_trips || 14))} more rides today`
                  : `${Math.max(0, 380 - (captainStats?.monthly_trips || 348))} rides to monthly milestone bonus`}
              </span>
              <span className="text-emerald-700 font-semibold">
                {statsPeriod === 'DAILY' ? `+₹${captainStats?.today_incentive_bonus || 300} Cash Bonus` : `+₹${captainStats?.monthly_incentive_bonus || 3800} Bonus`}
              </span>
            </div>
          </div>

          {/* ACTIVE TRIP COCKPIT OR WAITING RADAR */}
          {activeTrip ? (
            <div className="p-4 rounded-xl bg-white border border-emerald-300 shadow-sm space-y-4">
              {/* Trip Phase Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    {activeTrip?.type === 'AUTO' ? <Car className="w-4 h-4" /> : activeTrip?.type === 'PARCEL' ? <Package className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
                      {activeTrip.step === 'EN_ROUTE_PICKUP' && 'Phase 1: Head to Pickup'}
                      {activeTrip.step === 'ARRIVED_PICKUP' && 'Phase 2: At Pickup Spot'}
                      {activeTrip.step === 'IN_TRANSIT' && 'Phase 3: Trip in Progress'}
                      {activeTrip.step === 'PAYMENT_COLLECTION' && 'Phase 4: Collect Payment'}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">{activeTrip?.typeLabel || 'Rydex Ride'}</div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-400">Earnings</div>
                  <div className="text-sm font-bold text-emerald-700">₹{activeTrip?.estimatedEarnings || activeTrip?.estimated_fare || 78}</div>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                    {(activeTrip?.customerName || 'Passenger').charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{activeTrip?.customerName || 'Priya Sharma'}</div>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{activeTrip?.customerRating || 4.9}</span> &bull; <span>{activeTrip?.paymentMode || 'UPI'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => alert(`Calling customer ${activeTrip?.customerName || 'Passenger'}: +91 98450 91823`)}
                    className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-xs"
                    title="Call Customer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => alert(`Chat with ${activeTrip?.customerName || 'Passenger'}`)}
                    className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-xs"
                    title="Chat"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Location Route */}
              <div className="space-y-2 font-mono text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Pickup</span>
                    <span className="font-medium text-slate-800">{activeTrip?.pickupAddress || activeTrip?.pickup_address || 'Pickup Point'}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200/70 pt-2 flex items-start gap-2 text-slate-700">
                  <Navigation className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Drop</span>
                    <span className="font-medium text-slate-800">{activeTrip?.dropoffAddress || activeTrip?.dropoff_address || 'Dropoff Point'}</span>
                  </div>
                </div>
              </div>

              {/* Action Stages */}
              {activeTrip.step === 'EN_ROUTE_PICKUP' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Pickup Navigation:</span>
                    <span className="text-slate-800 font-bold">{activeTrip?.pickupDistanceKm || 0.8} km (~3 mins)</span>
                  </div>
                  <button
                    onClick={handleArrivedAtPickup}
                    className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I Have Arrived At Pickup</span>
                  </button>
                </div>
              )}

              {activeTrip.step === 'ARRIVED_PICKUP' && (
                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono">
                    Ask passenger for their 4-digit Start OTP before beginning ride.
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
                      Enter Passenger Start OTP
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        placeholder={`e.g. ${activeTrip?.otp || '4821'}`}
                        className="flex-1 px-4 py-2 rounded-lg bg-slate-50 border border-slate-300 text-center font-mono text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleVerifyOtpAndStart}
                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                      >
                        Start Trip
                      </button>
                    </div>
                    {otpError && <div className="text-[11px] font-mono text-rose-600 mt-1">{otpError}</div>}
                  </div>
                </div>
              )}

              {activeTrip.step === 'IN_TRANSIT' && (
                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400">SPEED</div>
                      <div className="text-sm font-bold text-slate-800">42 km/h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">REMAINING</div>
                      <div className="text-sm font-bold text-emerald-700">{activeTrip?.tripDistanceKm || 4.8} km</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">ETA</div>
                      <div className="text-sm font-bold text-slate-800">~12 min</div>
                    </div>
                  </div>

                  <button
                    onClick={handleCompleteTrip}
                    className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reached Destination &bull; Complete Ride</span>
                  </button>
                </div>
              )}

              {activeTrip.step === 'PAYMENT_COLLECTION' && (
                <div className="space-y-4 pt-1 text-center font-mono">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase">Collect Cash / QR Payment</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">₹{activeTrip?.estimatedEarnings || activeTrip?.estimated_fare || 78}</div>
                    <div className="text-[11px] text-emerald-700 mt-1 font-medium">Earnings added to today's payout</div>
                  </div>

                  <button
                    onClick={handleFinishPaymentAndClose}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    Finish & Ready for Next Ride
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Waiting for Orders Live Beacon */}
              <div className="p-6 rounded-xl bg-slate-50/70 border border-slate-200 text-center space-y-3.5 relative">
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                    <Radio className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isOnline ? 'Scanning Bengaluru Mobility Grid' : 'You are currently Offline'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1 leading-relaxed">
                    {isOnline
                      ? 'GPS active & connected. When a passenger books on Rydex, their ride will appear here for you to accept.'
                      : 'Switch duty to ON to start receiving ride requests.'}
                  </p>
                </div>

                {isOnline && (
                  <button
                    onClick={handleSimulatePassengerRequest}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-emerald-800 border border-slate-200 text-[11px] font-mono font-semibold transition-all flex items-center gap-1.5 mx-auto shadow-xs"
                    title="Simulate a passenger booking without switching tabs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quick Passenger Booking Test</span>
                  </button>
                )}
              </div>

              {/* Service Modes Accepted */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold tracking-wider">
                  Service Preferences
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setAllowedServices({ ...allowedServices, BIKE: !allowedServices.BIKE })}
                    className={`p-2.5 rounded-lg border text-xs font-mono font-medium flex flex-col items-center gap-1.5 transition-all ${
                      allowedServices.BIKE
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <Bike className="w-4 h-4 text-emerald-700" />
                    <span>Bike Rides</span>
                  </button>

                  <button
                    onClick={() => setAllowedServices({ ...allowedServices, AUTO: !allowedServices.AUTO })}
                    className={`p-2.5 rounded-lg border text-xs font-mono font-medium flex flex-col items-center gap-1.5 transition-all ${
                      allowedServices.AUTO
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <Car className="w-4 h-4 text-emerald-700" />
                    <span>Auto</span>
                  </button>

                  <button
                    onClick={() => setAllowedServices({ ...allowedServices, PARCEL: !allowedServices.PARCEL })}
                    className={`p-2.5 rounded-lg border text-xs font-mono font-medium flex flex-col items-center gap-1.5 transition-all ${
                      allowedServices.PARCEL
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <Package className="w-4 h-4 text-emerald-700" />
                    <span>Parcel</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Wallet & Instant Cashout */}
        <div className="pt-3 border-t border-slate-200 space-y-2 font-mono">
          {/* Real-time cashout error banner directly above the button */}
          {cashoutError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cashout Settlement Blocked (SLA Healing Active)</span>
              </div>
              <div className="text-[11px] text-rose-700 leading-relaxed">{cashoutError}</div>
              <div className="text-[10px] text-amber-800 font-semibold pt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Autonomous SRE Canary Rollback in progress ({activeChaosInfo?.remaining || 1}s remaining)...</span>
              </div>
            </div>
          )}

          {/* Cashout Notice Banner */}
          {cashoutNotice && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{cashoutNotice}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-700" />
              <div>
                <div className="text-[10px] text-slate-400">Balance</div>
                <div className="font-bold text-slate-900">₹{(captainStats?.wallet_balance || 0).toFixed(2)}</div>
              </div>
            </div>

            <button
              onClick={handleInstantCashout}
              disabled={(captainStats?.wallet_balance || 0) <= 0}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1.5 shadow-xs ${
                activeChaosInfo && (activeChaosInfo.fault_type === 'MEMORY_LEAK' || activeChaosInfo.fault_type === 'DB_BOTTLENECK')
                  ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
              }`}
            >
              {activeChaosInfo && activeChaosInfo.fault_type === 'MEMORY_LEAK' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Blocked: OOMKilled ({activeChaosInfo.remaining}s)</span>
                </>
              ) : activeChaosInfo && activeChaosInfo.fault_type === 'DB_BOTTLENECK' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Blocked: DB Lock ({activeChaosInfo.remaining}s)</span>
                </>
              ) : (
                <span>Instant Cashout</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Surge Map & Incoming Dispatch Overlay */}
      <div className="flex-1 h-full relative flex flex-col">
        {/* Top Surge Hotspots Ribbon */}
        <div className="h-11 border-b border-slate-200 bg-white px-6 flex items-center justify-between text-xs font-mono shrink-0 z-10">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>High Surge Zones:</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] overflow-x-auto text-slate-600">
            <span>Outer Ring Road: <strong className="text-emerald-700">1.4x</strong></span>
            <span>Koramangala: <strong className="text-emerald-700">1.35x</strong></span>
            <span>Indiranagar: <strong className="text-emerald-700">1.25x</strong></span>
            <span>Whitefield: <strong className="text-emerald-700">1.3x</strong></span>
          </div>
        </div>

        {/* Visual Map Area with RealTimeMap */}
        <div className="flex-1 relative bg-slate-100 overflow-hidden">
          <RealTimeMap
            mode="DRIVER"
            pickupLocation={activeTrip ? (activeTrip.pickupAddress || activeTrip.pickup_address) : 'Indiranagar 100ft Road'}
            dropoffLocation={activeTrip ? (activeTrip.dropoffAddress || activeTrip.dropoff_address) : 'Koramangala Sony Signal'}
            activeTrip={activeTrip}
            isOnline={isOnline}
            faultActive={faultActive}
            activeFaults={activeFaults}
            onHealFault={onHealFault}
          />

          {/* INCOMING DISPATCH MODAL OVERLAY */}
          {incomingOrder && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-30 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-xl space-y-5">
                {/* Header & Countdown */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                      {incomingOrder.type === 'AUTO' ? <Car className="w-5 h-5" /> : incomingOrder.type === 'PARCEL' ? <Package className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-emerald-800 font-bold uppercase tracking-wider">
                        New Passenger Request
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{incomingOrder.typeLabel}</h3>
                    </div>
                  </div>

                  {/* Countdown Circle */}
                  <div className="w-9 h-9 rounded-full border-2 border-emerald-500 flex items-center justify-center font-mono font-bold text-sm text-emerald-700">
                    {countdown}
                  </div>
                </div>

                {/* Earnings Highlight */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Estimated Earnings</div>
                    <div className="text-xl font-bold text-emerald-700">₹{incomingOrder.estimatedEarnings}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Trip Distance</div>
                    <div className="text-sm font-bold text-slate-800">{incomingOrder.tripDistanceKm} km</div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 text-[10px] font-bold">
                      A
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">PASSENGER: {incomingOrder.customerName} ({incomingOrder.pickupDistanceKm} km away)</div>
                      <div className="text-slate-800 font-medium text-xs mt-0.5">{incomingOrder.pickupAddress}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0 text-[10px] font-bold">
                      B
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">DESTINATION</div>
                      <div className="text-slate-800 font-medium text-xs mt-0.5">{incomingOrder.dropoffAddress}</div>
                    </div>
                  </div>
                </div>

                {/* Accept / Decline Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDeclineOrder}
                    className="py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-slate-500" />
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={handleAcceptOrder}
                    className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACCEPT ORDER</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverPortal;
