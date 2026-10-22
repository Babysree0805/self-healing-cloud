import React, { useState, useEffect } from 'react';
import { RealTimeMap } from './RealTimeMap';
import { RideCard } from './RideCard';
import { CaptainCard } from './CaptainCard';
import { RideReceipt } from './RideReceipt';
import { AuthModal } from './AuthModal';
import { RideHistoryModal } from './RideHistoryModal';
import { pricingApi, ridesApi, notificationsApi } from '../services/api';
import {
  MapPin,
  Navigation,
  ArrowRight,
  Shield,
  Zap,
  Clock,
  History,
  Sparkles,
  Package,
  Car,
  Bike,
  Plane,
  AlertTriangle,
  CheckCircle2,
  Phone,
  User,
  CreditCard,
  Percent,
  Compass,
  Building2,
  Train,
  Briefcase,
  Home,
  ShoppingBag,
  GraduationCap,
  Coffee,
  HeartPulse,
} from 'lucide-react';

export const BANGALORE_SUGGESTIONS = [
  { name: 'Indiranagar 100ft Road', subtitle: 'Near 12th Main, HAL 2nd Stage, Bengaluru', tag: 'Shopping & Cafes', type: 'SHOP', lat: 12.9784, lng: 77.6408 },
  { name: 'Koramangala Sony Signal', subtitle: '80 Feet Rd, 4th Block, Koramangala', tag: 'Startup Hub', type: 'TECH', lat: 12.9352, lng: 77.6245 },
  { name: 'MG Road Metro Station', subtitle: 'Mahatma Gandhi Rd, Shivaji Nagar', tag: 'Metro Purple Line', type: 'METRO', lat: 12.9756, lng: 77.6066 },
  { name: 'Manyata Embassy Tech Park', subtitle: 'Nagavara Outer Ring Road, Hebbal', tag: 'Tech Hub', type: 'TECH', lat: 13.0475, lng: 77.6200 },
  { name: 'Kempegowda Airport T1 (BLR)', subtitle: 'KIAL Road, Devanahalli, Bengaluru', tag: 'Airport Terminal', type: 'AIRPORT', lat: 13.1986, lng: 77.7066 },
  { name: 'HSR Layout Sector 2', subtitle: '27th Main Rd, Sector 2, HSR Layout', tag: 'Residential', type: 'HOME', lat: 12.9116, lng: 77.6389 },
  { name: 'Bellandur EcoSpace', subtitle: 'Outer Ring Road, Bellandur, Bengaluru', tag: 'IT SEZ Park', type: 'TECH', lat: 12.9260, lng: 77.6833 },
  { name: 'Whitefield ITPL', subtitle: 'International Tech Park, Whitefield Rd', tag: 'Tech Corridor', type: 'TECH', lat: 12.9866, lng: 77.7314 },
  { name: 'KSR Bengaluru City Railway Station', subtitle: 'Kempegowda, Majestic, Bengaluru', tag: 'Central Station', type: 'TRAIN', lat: 12.9781, lng: 77.5696 },
  { name: 'Cubbon Park Metro Station', subtitle: 'Kasturba Road, Sampangi Rama Nagar', tag: 'Green Zone', type: 'METRO', lat: 12.9778, lng: 77.5929 },
  { name: 'Forum Mall Koramangala', subtitle: 'Hosur Road, Chikku Lakshmaiah Layout', tag: 'Shopping Mall', type: 'SHOP', lat: 12.9345, lng: 77.6101 },
  { name: 'IIM Bangalore Bannerghatta', subtitle: 'Bilekahalli, Bannerghatta Main Road', tag: 'University', type: 'CAMPUS', lat: 12.8953, lng: 77.5996 },
  { name: 'Manipal Hospital Old Airport Rd', subtitle: 'HAL Airport Road, Kodihalli', tag: 'Healthcare', type: 'HOSPITAL', lat: 12.9587, lng: 77.6482 },
  { name: 'Phoenix Marketcity Mahadevapura', subtitle: 'Whitefield Main Rd, Devasandra Industrial Area', tag: 'Mega Mall', type: 'SHOP', lat: 12.9959, lng: 77.6964 },
  { name: 'Church Street Brigade Road', subtitle: 'Shantala Nagar, Ashok Nagar, Bengaluru', tag: 'Nightlife & Food', type: 'CAFE', lat: 12.9748, lng: 77.6074 },
  { name: 'Electronic City Phase 1', subtitle: 'Hosur Road, Electronics City, Bengaluru', tag: 'IT Hub', type: 'TECH', lat: 12.8452, lng: 77.6602 },
];

const PRESET_LOCATIONS = [
  { name: 'MG Road Metro Station', lat: 12.9756, lng: 77.6066 },
  { name: 'Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408 },
  { name: 'Manyata Embassy Tech Park', lat: 13.0475, lng: 77.6200 },
  { name: 'Koramangala Sony Signal', lat: 12.9352, lng: 77.6245 },
  { name: 'Kempegowda Airport T1 (BLR)', lat: 13.1986, lng: 77.7066 },
];

export const PassengerPortal = ({
  currentUser,
  onOpenAuth,
  faultActive,
  activeFaults = [],
  onHealFault,
  isHistoryOpen: externalHistoryOpen,
  setIsHistoryOpen: setExternalHistoryOpen,
}) => {
  const [internalHistoryOpen, setInternalHistoryOpen] = useState(false);
  const isHistoryOpen = externalHistoryOpen !== undefined ? externalHistoryOpen : internalHistoryOpen;
  const setIsHistoryOpen = setExternalHistoryOpen || setInternalHistoryOpen;

  // Active Service Tab: 'RIDE', 'PARCEL', 'RENTALS', 'AIRPORT'
  const [activeTab, setActiveTab] = useState('RIDE');

  // Booking Flow State & Location Autocomplete State
  const [pickupAddress, setPickupAddress] = useState('MG Road Metro Station, Bengaluru');
  const [dropoffAddress, setDropoffAddress] = useState('Koramangala Sony Signal, Bengaluru');
  const [selectedPickupCoords, setSelectedPickupCoords] = useState([12.9756, 77.6066]);
  const [selectedDropCoords, setSelectedDropCoords] = useState([12.9352, 77.6245]);
  const [pickupFocused, setPickupFocused] = useState(false);
  const [dropoffFocused, setDropoffFocused] = useState(false);

  const [distanceKm, setDistanceKm] = useState(6.4);
  const [durationMin, setDurationMin] = useState(16);

  // Parcel Specific State
  const [parcelDetails, setParcelDetails] = useState({
    recipientName: 'Kavita Murthy',
    recipientPhone: '+91 98451 09876',
    itemType: 'Documents & Keys',
    weight: 'Under 3 kg',
    instructions: 'Deliver to 3rd floor reception'
  });

  // Rentals Specific State
  const [rentalPackage, setRentalPackage] = useState({
    id: '2HR_20KM',
    name: '2 Hours / 20 km',
    fare: 349,
    hours: 2,
    km: 20
  });

  // Airport Specific State
  const [airportTerminal, setAirportTerminal] = useState('T1 - Domestic Flights');

  // Pricing & Categories
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [surgeInfo, setSurgeInfo] = useState(null);
  const [pricingErrorNotice, setPricingErrorNotice] = useState('');

  // Active Ride Lifecycle
  const [activeRide, setActiveRide] = useState(null);
  const [rideStatus, setRideStatus] = useState('IDLE');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [completedRide, setCompletedRide] = useState(null);

  // Emergency SOS State
  const [sosStatus, setSosStatus] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [activeChaosInfo, setActiveChaosInfo] = useState(null);

  // Synchronize active chaos faults across all tabs and components
  useEffect(() => {
    const syncChaos = () => {
      try {
        const stored = localStorage.getItem('rydex_active_chaos');
        if (stored) {
          const parsed = JSON.parse(stored);
          const rem = (parsed.expires_at - Date.now()) / 1000;
          if (rem > 0) {
            const remExact = Math.max(0.1, Math.round(rem * 10) / 10);
            setActiveChaosInfo({ ...parsed, remaining: remExact });

            // CPU_SPIKE on pricing-service
            if (parsed.fault_type === 'CPU_SPIKE' || parsed.service === 'pricing-service') {
              setPricingErrorNotice(`504 Gateway Timeout: Pricing computation thread saturated (>95% CPU CFS limit). Showing baseline rates. Autonomous SRE rebalancing quota (${remExact}s remaining)...`);
            }
            return;
          } else {
            localStorage.removeItem('rydex_active_chaos');
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {}

      // Healed
      setActiveChaosInfo((prev) => {
        if (prev) {
          setPricingErrorNotice('');
          setBookingError(null);
        }
        return null;
      });
    };

    syncChaos();
    const interval = setInterval(syncChaos, 150);
    window.addEventListener('storage', syncChaos);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncChaos);
    };
  }, []);

  // Fetch Pricing Categories on load
  useEffect(() => {
    loadCategories(distanceKm, durationMin);
    loadSurge();
  }, [distanceKm, durationMin]);

  const loadCategories = async (dist, dur) => {
    try {
      const data = await pricingApi.getCategories(dist, dur);
      if (data && data.categories) {
        setCategories(data.categories);
        setSelectedCategory((prev) => prev || data.categories[0]);
        if (!activeChaosInfo || activeChaosInfo.fault_type !== 'CPU_SPIKE') {
          setPricingErrorNotice('');
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      if (errMsg && (errMsg.includes('504') || errMsg.includes('CPU') || errMsg.includes('Pricing'))) {
        setPricingErrorNotice("504 Gateway Timeout: Pricing computation thread saturated (>95% CPU CFS limit). Showing baseline rates. Autonomous SRE rebalancing quota (heals in 4.2s)...");
      }
      const fallback = [
        { id: 'BIKE', name: 'Rydex Bike', badge: 'FASTEST', fare: 64.0, eta_mins: 3, duration_mins: 14, helmet_provided: true },
        { id: 'AUTO', name: 'Rydex Auto', badge: 'POPULAR', fare: 98.0, eta_mins: 4, duration_mins: 18, helmet_provided: false },
        { id: 'CAB_ECONOMY', name: 'Rydex Comfort', badge: 'VALUE', fare: 175.0, eta_mins: 6, duration_mins: 20, helmet_provided: false },
        { id: 'CAB_PREMIUM', name: 'Rydex Prime', badge: 'PREMIUM', fare: 260.0, eta_mins: 8, duration_mins: 20, helmet_provided: false },
        { id: 'PARCEL', name: 'Rydex Parcel', badge: 'EXPRESS', fare: 79.0, eta_mins: 5, duration_mins: 15, helmet_provided: false },
        { id: 'RENTALS', name: 'Rydex Rentals', badge: 'HOURLY', fare: 349.0, eta_mins: 7, duration_mins: 120, helmet_provided: false },
        { id: 'AIRPORT', name: 'Airport Express', badge: 'FLAT RATE', fare: 649.0, eta_mins: 10, duration_mins: 55, helmet_provided: false },
      ];
      setCategories(fallback);
      setSelectedCategory((prev) => prev || fallback[0]);
    }
  };

  const loadSurge = async () => {
    try {
      const surge = await pricingApi.getSurge();
      setSurgeInfo(surge);
    } catch (e) {
      // ignore
    }
  };

  const handleBookRide = async () => {
    setIsBooking(true);
    setBookingError(null);

    let rideType = selectedCategory?.id || 'BIKE';
    let dropLocAddress = dropoffAddress;

    if (activeTab === 'PARCEL') {
      rideType = 'PARCEL';
      dropLocAddress = `${dropoffAddress} (To: ${parcelDetails.recipientName})`;
    } else if (activeTab === 'RENTALS') {
      rideType = 'RENTALS';
      dropLocAddress = `Rental: ${rentalPackage.name} (Multi-Stop)`;
    } else if (activeTab === 'AIRPORT') {
      rideType = 'AIRPORT';
      dropLocAddress = `Kempegowda Int'l Airport - ${airportTerminal}`;
    }

    // CHECK TRAFFIC_OVERLOAD FAULT ON ride-service (:8002)
    let chaos = activeChaosInfo;
    if (!chaos) {
      try {
        const stored = localStorage.getItem('rydex_active_chaos');
        if (stored) {
          const parsed = JSON.parse(stored);
          const rem = (parsed.expires_at - Date.now()) / 1000;
          if (rem > 0) {
            chaos = { ...parsed, remaining: Math.max(0.1, Math.round(rem * 10) / 10) };
          }
        }
      } catch (e) {}
    }

    if (chaos && (chaos.fault_type === 'TRAFFIC_OVERLOAD' || chaos.service === 'ride-service')) {
      if (rideType === 'BIKE') {
        // Specific Failure: Booking a Bike Taxi fails with 429 Too Many Requests
        setBookingError(`429 Too Many Requests: Ingress rate limit exceeded on Bike queue (ride-service:8002). Rate limit quota exhausted (820 queued). Autonomous SRE Horizontal Pod Autoscaling (1 -> 3 replicas) (${chaos.remaining}s remaining)... Note: Booking Auto, Cab, or Parcel succeeds immediately!`);
        setIsBooking(false);
        return; // STRICT RETURN: Bike Taxi blocked!
      }
      // Containment: Booking Auto, Cab, or Parcel succeeds! Background polling stays active.
    }

    const payload = {
      rider_id: currentUser?.username || 'rider-demo',
      pickup_location: { address: pickupAddress, lat: 12.9756, lng: 77.6066 },
      dropoff_location: { address: dropLocAddress, lat: 12.9352, lng: 77.6245 },
      ride_type: rideType,
      payment_method: paymentMethod,
    };

    try {
      const res = await ridesApi.requestRide(payload);
      if (res && res.ride) {
        setActiveRide(res.ride);
        setRideStatus(res.ride.status === 'DRIVER_ASSIGNED' ? 'ASSIGNED' : 'SEARCHING');
      }
    } catch (err) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.detail || err.message || 'Server connection timeout';

      if (status === 429 || errMsg.includes('429') || errMsg.includes('Traffic') || errMsg.includes('Rate Limit')) {
        setBookingError(errMsg);
      } else {
        const demoRide = {
          ride_id: `RYD-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'REQUESTED',
          ride_type: rideType,
          fare: selectedCategory?.fare || 65.0,
          pickup_location: payload.pickup_location,
          dropoff_location: payload.dropoff_location,
          otp: '4821',
          created_at: new Date().toISOString(),
          captain: {
            name: 'Ramesh Gowda',
            vehicle: 'Yamaha FZ-S (Yellow/Black)',
            plate: 'KA 05 EK 4821',
            rating: 4.88,
            eta_mins: 3,
            phone: '+91 98451 22334',
          }
        };
        localStorage.setItem('rydex_active_ride', JSON.stringify(demoRide));
        setActiveRide(demoRide);
        setRideStatus('SEARCHING');
      }
    } finally {
      setIsBooking(false);
    }
  };

  // Live polling for driver acceptance & trip progression
  useEffect(() => {
    if (!activeRide?.ride_id) return;

    let isSubscribed = true;
    let localWaitTicks = 0;

    const interval = setInterval(async () => {
      try {
        const updated = await ridesApi.getRideStatus(activeRide.ride_id);
        if (!isSubscribed || !updated) return;

        setActiveRide(updated);
        if (updated.status === 'DRIVER_ASSIGNED' && rideStatus === 'SEARCHING') {
          setRideStatus('ASSIGNED');
        } else if (updated.status === 'COMPLETED') {
          setCompletedRide(updated);
          setActiveRide(null);
          setRideStatus('COMPLETED');
        }
      } catch (e) {
        localWaitTicks += 1;
        const localShared = localStorage.getItem('rydex_active_ride');
        if (localShared) {
          try {
            const parsed = JSON.parse(localShared);
            if (parsed.status === 'DRIVER_ASSIGNED' && rideStatus === 'SEARCHING') {
              setActiveRide(parsed);
              setRideStatus('ASSIGNED');
            } else if (parsed.status === 'COMPLETED') {
              setCompletedRide(parsed);
              setActiveRide(null);
              setRideStatus('COMPLETED');
            }
          } catch (err) {}
        }

        if (rideStatus === 'SEARCHING' && localWaitTicks >= 3) {
          const matchedRide = { ...activeRide, status: 'DRIVER_ASSIGNED' };
          localStorage.setItem('rydex_active_ride', JSON.stringify(matchedRide));
          setActiveRide(matchedRide);
          setRideStatus('ASSIGNED');
        }
      }
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeRide?.ride_id, rideStatus]);

  const handleCancelRide = async () => {
    if (activeRide?.ride_id) {
      try {
        await ridesApi.cancelRide(activeRide.ride_id);
      } catch (e) {
        // ignore
      }
    }
    setActiveRide(null);
    setRideStatus('IDLE');
  };

  const handleCompleteRide = async () => {
    if (activeRide?.ride_id) {
      try {
        await ridesApi.completeRide(activeRide.ride_id);
      } catch (e) {
        // ignore
      }
    }
    setCompletedRide(activeRide);
    setActiveRide(null);
    setRideStatus('IDLE');
  };

  const calculateNewRoute = (c1, c2) => {
    const latDiff = (c2[0] - c1[0]) * 111.0;
    const lngDiff = (c2[1] - c1[1]) * 105.0;
    const euclidean = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    const dist = Math.max(1.8, Math.round(euclidean * 1.32 * 10) / 10);
    const dur = Math.max(5, Math.round(dist * 2.6 + 3));
    setDistanceKm(dist);
    setDurationMin(dur);
    loadCategories(dist, dur);
  };

  const handleSelectPickup = (item) => {
    setPickupAddress(item.name);
    setSelectedPickupCoords([item.lat, item.lng]);
    setPickupFocused(false);
    calculateNewRoute([item.lat, item.lng], selectedDropCoords);
  };

  const handleSelectDropoff = (item) => {
    setDropoffAddress(item.name);
    setSelectedDropCoords([item.lat, item.lng]);
    setDropoffFocused(false);
    calculateNewRoute(selectedPickupCoords, [item.lat, item.lng]);
  };

  const handleSelectPresetDrop = (loc) => {
    setDropoffAddress(loc.name);
    setSelectedDropCoords([loc.lat, loc.lng]);
    calculateNewRoute(selectedPickupCoords, [loc.lat, loc.lng]);
  };

  const filteredPickupSuggestions = BANGALORE_SUGGESTIONS.filter((s) =>
    s.name.toLowerCase().includes(pickupAddress.toLowerCase()) ||
    s.subtitle.toLowerCase().includes(pickupAddress.toLowerCase())
  );

  const filteredDropoffSuggestions = BANGALORE_SUGGESTIONS.filter((s) =>
    s.name.toLowerCase().includes(dropoffAddress.toLowerCase()) ||
    s.subtitle.toLowerCase().includes(dropoffAddress.toLowerCase())
  );

  const roundTo1 = (val) => Math.round(val * 10) / 10;

  const triggerEmergencySOS = async () => {
    try {
      await notificationsApi.sendSOS(
        'PASSENGER EMERGENCY SOS',
        `Urgent assistance requested by ${currentUser?.username || 'Passenger'} at ${pickupAddress}.`,
        'CRITICAL'
      );
      setSosStatus('Emergency SOS broadcasted to SRE Control Center & Safety Team!');
      setTimeout(() => setSosStatus(''), 6000);
    } catch (e) {
      setSosStatus('Emergency alert simulated (Local Safety Bus Alerted)');
      setTimeout(() => setSosStatus(''), 4000);
    }
  };

  const rideCategories = categories.filter((c) =>
    ['BIKE', 'AUTO', 'CAB_ECONOMY', 'CAB_PREMIUM'].includes(c.id)
  );

  const renderLocationIcon = (type) => {
    switch (type) {
      case 'SHOP':
        return <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />;
      case 'TECH':
        return <Briefcase className="w-3.5 h-3.5 text-emerald-700" />;
      case 'METRO':
      case 'TRAIN':
        return <Train className="w-3.5 h-3.5 text-emerald-700" />;
      case 'AIRPORT':
        return <Plane className="w-3.5 h-3.5 text-emerald-700" />;
      case 'HOME':
        return <Home className="w-3.5 h-3.5 text-emerald-700" />;
      case 'CAMPUS':
        return <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />;
      case 'HOSPITAL':
        return <HeartPulse className="w-3.5 h-3.5 text-emerald-700" />;
      case 'CAFE':
        return <Coffee className="w-3.5 h-3.5 text-emerald-700" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-emerald-700" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden h-full bg-[#F8FAF9] text-slate-900">
      {/* Left Side: Booking & Services Deck */}
      <div className="w-full md:w-[440px] lg:w-[480px] h-full overflow-y-auto bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 z-20 shadow-xs p-5 md:p-6 space-y-5">
        <div className="space-y-5">
          {/* Service Category Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('RIDE');
                setSelectedCategory(categories.find((c) => c.id === 'BIKE') || categories[0]);
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'RIDE'
                  ? 'bg-white text-emerald-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Rides</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('PARCEL');
                setSelectedCategory(categories.find((c) => c.id === 'PARCEL') || { id: 'PARCEL', name: 'Rydex Parcel', fare: 79.0 });
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'PARCEL'
                  ? 'bg-white text-emerald-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Parcel</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('RENTALS');
                setSelectedCategory(categories.find((c) => c.id === 'RENTALS') || { id: 'RENTALS', name: 'Rydex Rentals', fare: 349.0 });
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'RENTALS'
                  ? 'bg-white text-emerald-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Rentals</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('AIRPORT');
                setSelectedCategory(categories.find((c) => c.id === 'AIRPORT') || { id: 'AIRPORT', name: 'Airport Express', fare: 649.0 });
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'AIRPORT'
                  ? 'bg-white text-emerald-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Airport</span>
            </button>
          </div>

          {/* Emergency SOS Banner */}
          {sosStatus && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-mono text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{sosStatus}</span>
            </div>
          )}

          {/* Active Ride vs Booking Configuration */}
          {activeRide ? (
            <CaptainCard
              ride={activeRide}
              onCancel={handleCancelRide}
              onComplete={handleCompleteRide}
            />
          ) : (
            <>
              {/* Pickup & Destination Inputs */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
                {/* Pickup Input Container */}
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Pickup Location</div>
                      <input
                        type="text"
                        value={pickupAddress}
                        onFocus={() => {
                          setPickupFocused(true);
                          setDropoffFocused(false);
                        }}
                        onBlur={() => setTimeout(() => setPickupFocused(false), 250)}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Search pickup landmark, metro or street..."
                        className="w-full bg-transparent text-xs text-slate-900 font-medium focus:outline-none placeholder-slate-400 truncate mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Autocomplete Suggestions for Pickup */}
                  {pickupFocused && (
                    <div className="absolute top-12 left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto">
                      <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                        <span>Bangalore Pickup Hubs</span>
                        <span className="text-emerald-700 font-semibold">Rydex Autocomplete</span>
                      </div>
                      {(filteredPickupSuggestions.length > 0 ? filteredPickupSuggestions : BANGALORE_SUGGESTIONS).slice(0, 6).map((s) => (
                        <div
                          key={s.name}
                          onMouseDown={() => handleSelectPickup(s)}
                          className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">{renderLocationIcon(s.type)}</span>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                                <span>{s.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">{s.tag}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[240px]">{s.subtitle}</div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200/70 my-1" />

                {/* Dropoff Input Container */}
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-rose-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                        {activeTab === 'PARCEL' ? 'Delivery Destination' : activeTab === 'AIRPORT' ? 'Airport Destination' : 'Drop Destination'}
                      </div>
                      <input
                        type="text"
                        value={dropoffAddress}
                        onFocus={() => {
                          setDropoffFocused(true);
                          setPickupFocused(false);
                        }}
                        onBlur={() => setTimeout(() => setDropoffFocused(false), 250)}
                        onChange={(e) => setDropoffAddress(e.target.value)}
                        placeholder="Search destination, mall, tech park..."
                        className="w-full bg-transparent text-xs text-slate-900 font-medium focus:outline-none placeholder-slate-400 truncate mt-0.5"
                      />
                    </div>
                  </div>

                  {/* Autocomplete Suggestions for Dropoff */}
                  {dropoffFocused && (
                    <div className="absolute top-12 left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto">
                      <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                        <span>Bangalore Destinations</span>
                        <span className="text-emerald-700 font-semibold">Rydex Autocomplete</span>
                      </div>
                      {(filteredDropoffSuggestions.length > 0 ? filteredDropoffSuggestions : BANGALORE_SUGGESTIONS).slice(0, 6).map((s) => (
                        <div
                          key={s.name}
                          onMouseDown={() => handleSelectDropoff(s)}
                          className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">{renderLocationIcon(s.type)}</span>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                                <span>{s.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">{s.tag}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[240px]">{s.subtitle}</div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TAB 1: RIDES (Bike, Auto, Cab Economy, Prime Sedan) */}
              {activeTab === 'RIDE' && (
                <>
                  {/* Quick Landmarks Chips */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold tracking-wider">
                      Popular Hubs
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_LOCATIONS.map((loc) => (
                        <button
                          key={loc.name}
                          onClick={() => handleSelectPresetDrop(loc)}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 text-[11px] font-mono text-slate-700 border border-slate-200 transition-all text-left truncate max-w-[210px] flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{loc.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Overload Degradation Warning Banner */}
                  {pricingErrorNotice && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-950">Dynamic Pricing Engine Degraded</div>
                        <div className="text-[11px] text-amber-800 mt-0.5">{pricingErrorNotice}</div>
                      </div>
                    </div>
                  )}

                  {/* Ride Categories Grid */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 uppercase font-semibold tracking-wider">Choose Rydex Vehicle</span>
                      <span className="text-emerald-700 font-semibold">{distanceKm} km &bull; ~{durationMin} mins</span>
                    </div>

                    <RideCard
                      categories={rideCategories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                      onBookRide={handleBookRide}
                      isBooking={isBooking}
                      bookingError={bookingError}
                    />
                  </div>
                </>
              )}

              {/* TAB 2: PARCEL DELIVERY */}
              {activeTab === 'PARCEL' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Rydex Parcel Courier</div>
                        <div className="text-[10px] font-mono text-slate-500">Doorstep pickup & direct drop</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      INSTANT
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold">Recipient Name</label>
                      <input
                        type="text"
                        value={parcelDetails.recipientName}
                        onChange={(e) => setParcelDetails({ ...parcelDetails, recipientName: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold">Recipient Contact No.</label>
                      <input
                        type="text"
                        value={parcelDetails.recipientPhone}
                        onChange={(e) => setParcelDetails({ ...parcelDetails, recipientPhone: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Item Category</label>
                        <select
                          value={parcelDetails.itemType}
                          onChange={(e) => setParcelDetails({ ...parcelDetails, itemType: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                        >
                          <option>Documents & Keys</option>
                          <option>Food & Lunchbox</option>
                          <option>Clothes & Apparel</option>
                          <option>Electronics / Gadgets</option>
                          <option>Medicine & Health</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Weight Range</label>
                        <select
                          value={parcelDetails.weight}
                          onChange={(e) => setParcelDetails({ ...parcelDetails, weight: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                        >
                          <option>Under 3 kg (Bike)</option>
                          <option>3 - 6 kg (Bike)</option>
                          <option>6 - 15 kg (Auto)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Estimated Parcel Fare</span>
                    <span className="text-base font-bold text-emerald-700">₹{roundTo1(39.0 + distanceKm * 11.0)}</span>
                  </div>

                  <button
                    onClick={handleBookRide}
                    disabled={isBooking}
                    className="w-full py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Package className="w-4 h-4" />
                    <span>Book Instant Parcel Pickup</span>
                  </button>
                </div>
              )}

              {/* TAB 3: RENTALS (Hourly Packages) */}
              {activeTab === 'RENTALS' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Rydex Hourly Rentals</div>
                        <div className="text-[10px] font-mono text-slate-500">Multiple stops, 1 dedicated captain</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { id: '1HR_10KM', name: '1 Hour / 10 km', fare: 199, desc: 'Quick errands & doctor visits' },
                      { id: '2HR_20KM', name: '2 Hours / 20 km', fare: 349, desc: 'Shopping & multiple client meetings' },
                      { id: '4HR_40KM', name: '4 Hours / 40 km', fare: 649, desc: 'Half-day city travel & sight-seeing' },
                      { id: '8HR_80KM', name: '8 Hours / 80 km', fare: 1199, desc: 'Full-day corporate & personal commute' },
                    ].map((pkg) => {
                      const isSel = rentalPackage.id === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setRentalPackage(pkg)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            isSel
                              ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{pkg.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{pkg.desc}</div>
                          </div>
                          <div className="text-sm font-bold font-mono text-emerald-700">₹{pkg.fare}</div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleBookRide}
                    disabled={isBooking}
                    className="w-full py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Confirm Rental Package (₹{rentalPackage.fare})</span>
                  </button>
                </div>
              )}

              {/* TAB 4: AIRPORT EXPRESS */}
              {activeTab === 'AIRPORT' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <Plane className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Airport Express Drop & Pickup</div>
                        <div className="text-[10px] font-mono text-slate-500">Guaranteed on-time toll inclusive fare</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold">Select Terminal</label>
                      <select
                        value={airportTerminal}
                        onChange={(e) => setAirportTerminal(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option>T1 - Domestic Flights (IndiGo, Akasa, SpiceJet)</option>
                        <option>T2 - Garden Terminal (Air India, Vistara, International)</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Airport Toll Charges:</span>
                        <span className="text-emerald-700 font-semibold">INCLUDED</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Luggage Space:</span>
                        <span className="text-slate-800">Up to 3 Trolleys</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-700 font-semibold">Guaranteed Fixed Fare:</span>
                        <span className="text-base font-bold text-emerald-700">₹649</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleBookRide}
                    disabled={isBooking}
                    className="w-full py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Plane className="w-4 h-4" />
                    <span>Book Airport Express Cab</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions: Safety SOS & In-Ride Guarantee */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono">
          <button
            onClick={triggerEmergencySOS}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all font-semibold"
            title="Broadcast Immediate Emergency Alert"
          >
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            <span>Emergency SOS</span>
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>Past Rides</span>
          </button>
        </div>
      </div>

      {/* Right Side: Real-Time OpenStreetMap/CartoDB Map */}
      <div className="flex-1 h-full relative">
        <RealTimeMap
          mode="PASSENGER"
          pickupLocation={pickupAddress}
          dropoffLocation={dropoffAddress}
          activeRide={activeRide}
          rideStatus={rideStatus}
          rideType={selectedCategory?.id || 'BIKE'}
          faultActive={faultActive}
          activeFaults={activeFaults}
          onHealFault={onHealFault}
        />
      </div>

      {/* Past Rides Modal */}
      <RideHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectRide={(r) => {
          setActiveRide(r);
          setRideStatus('ASSIGNED');
          setIsHistoryOpen(false);
        }}
      />

      {/* Completed Ride Receipt Modal */}
      {completedRide && (
        <RideReceipt
          ride={completedRide}
          onClose={() => setCompletedRide(null)}
        />
      )}
    </div>
  );
};
