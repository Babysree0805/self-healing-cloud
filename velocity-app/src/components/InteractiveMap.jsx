import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Navigation,
  Plus,
  Minus,
  Layers,
  MapPin,
  Shield,
  Zap,
} from 'lucide-react';

export const InteractiveMap = ({
  pickupLocation,
  dropoffLocation,
  activeRide,
  rideStatus, // 'IDLE', 'SEARCHING', 'ASSIGNED', 'ARRIVING', 'STARTED', 'COMPLETED'
  rideType = 'BIKE',
  onSelectPreset,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showTraffic, setShowTraffic] = useState(true);
  const [captainProgress, setCaptainProgress] = useState(0.15); // 0 to 1 along route
  const [nearbyCaptains, setNearbyCaptains] = useState([
    { id: 1, type: 'BIKE', x: 280, y: 310, heading: 45 },
    { id: 2, type: 'BIKE', x: 330, y: 270, heading: 120 },
    { id: 3, type: 'AUTO', x: 230, y: 340, heading: 280 },
    { id: 4, type: 'CAB_ECONOMY', x: 390, y: 360, heading: 90 },
    { id: 5, type: 'CAB_PREMIUM', x: 210, y: 240, heading: 180 },
  ]);

  // Subtle wandering of nearby captains to make the map feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setNearbyCaptains((prev) =>
        prev.map((cap) => ({
          ...cap,
          x: Math.max(120, Math.min(680, cap.x + (Math.random() - 0.48) * 6)),
          y: Math.max(100, Math.min(520, cap.y + (Math.random() - 0.48) * 6)),
          heading: (cap.heading + (Math.random() - 0.5) * 20 + 360) % 360,
        }))
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Animate captain moving along route when ride is active
  useEffect(() => {
    if (activeRide && (rideStatus === 'ASSIGNED' || rideStatus === 'ARRIVING' || rideStatus === 'STARTED')) {
      const interval = setInterval(() => {
        setCaptainProgress((prev) => {
          if (prev >= 0.95) return 0.95;
          return prev + 0.03;
        });
      }, 1200);
      return () => clearInterval(interval);
    } else {
      setCaptainProgress(0.15);
    }
  }, [activeRide, rideStatus]);

  // Route path coordinates (Bezier curves across realistic Bangalore map nodes)
  const pickupPoint = { x: 260, y: 320 };
  const dropoffPoint = { x: 580, y: 210 };
  
  // Calculate captain current position along the Bezier curve
  const t = captainProgress;
  // Quadratic bezier: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
  const p0 = { x: 210, y: 390 }; // Captain start
  const p1 = { x: 380, y: 380 }; // Midpoint waypoint
  const p2 = pickupPoint;       // Destination
  
  const capX = Math.round((1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x);
  const capY = Math.round((1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y);

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#0c101a] overflow-hidden select-none flex items-center justify-center">
      {/* Background SVG Grid & Road Network */}
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full object-cover transition-transform duration-700 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        <defs>
          {/* Subtle Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#131B2A" strokeWidth="1" />
          </pattern>

          {/* Glowing Route Gradient */}
          <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#FFDE00" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>

          {/* Captain Pulse Gradient */}
          <radialGradient id="captainHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFDE00" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFDE00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base Grid */}
        <rect width="100%" height="100%" fill="#0C101A" />
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.7" />

        {/* Ambient Urban Parks / River features */}
        <path
          d="M 50 180 Q 140 120 220 220 T 380 180 T 520 90 T 750 130"
          fill="none"
          stroke="#0F2436"
          strokeWidth="32"
          strokeLinecap="round"
          opacity="0.6"
        />
        <circle cx="160" cy="440" r="60" fill="#0C231E" opacity="0.5" />
        <circle cx="640" cy="420" r="75" fill="#0C231E" opacity="0.5" />

        {/* Secondary Street Arteries */}
        <g stroke="#1A2436" strokeWidth="3" fill="none">
          <path d="M 0 100 L 800 100" />
          <path d="M 0 250 L 800 250" />
          <path d="M 0 400 L 800 400" />
          <path d="M 0 520 L 800 520" />
          <path d="M 120 0 L 120 600" />
          <path d="M 280 0 L 280 600" />
          <path d="M 460 0 L 460 600" />
          <path d="M 640 0 L 640 600" />
        </g>

        {/* Major Expressways & Flyovers */}
        <g fill="none">
          {/* Outer Ring Road */}
          <path
            d="M 40 540 C 160 500, 220 380, 260 320 C 320 240, 480 260, 580 210 C 660 170, 720 80, 780 40"
            stroke="#27354E"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {showTraffic && (
            <path
              d="M 40 540 C 160 500, 220 380, 260 320 C 320 240, 480 260, 580 210 C 660 170, 720 80, 780 40"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />
          )}

          {/* Radial Corridor to Tech Parks */}
          <path
            d="M 60 80 Q 260 160 380 320 T 720 540"
            stroke="#223046"
            strokeWidth="9"
          />
          {showTraffic && (
            <path
              d="M 380 320 T 720 540"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeDasharray="12 6"
              opacity="0.8"
            />
          )}
        </g>

        {/* Dynamic Route Polyline from Pickup to Dropoff */}
        <g fill="none">
          {/* Route Underglow shadow */}
          <path
            d={`M ${pickupPoint.x} ${pickupPoint.y} Q 400 360, 460 280 T ${dropoffPoint.x} ${dropoffPoint.y}`}
            stroke="#FFDE00"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.25"
            filter="blur(4px)"
          />
          {/* Main Active Route Line with animated flow */}
          <path
            d={`M ${pickupPoint.x} ${pickupPoint.y} Q 400 360, 460 280 T ${dropoffPoint.x} ${dropoffPoint.y}`}
            stroke="url(#routeGlow)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="8 6"
            className="animate-dash"
          />
        </g>

        {/* Real-Time Radar Scan Ring around Pickup point */}
        <g transform={`translate(${pickupPoint.x}, ${pickupPoint.y})`}>
          <circle r="45" fill="none" stroke="#FFDE00" strokeWidth="1" opacity="0.3" />
          <circle r="90" fill="none" stroke="#FFDE00" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.2" />
          <circle r="140" fill="none" stroke="#FFDE00" strokeWidth="0.5" opacity="0.1" />
          {/* Radar sweeping beam */}
          <circle r="6" fill="#10B981" />
          <circle r="14" fill="#10B981" opacity="0.3" className="animate-ping" />
        </g>

        {/* Nearby Available Captains on Map */}
        {nearbyCaptains.map((cap) => (
          <g key={cap.id} transform={`translate(${cap.x}, ${cap.y}) rotate(${cap.heading})`}>
            <circle r="8" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
            <circle r="3" fill="#059669" />
          </g>
        ))}

        {/* Assigned Captain Marker (Moving along path towards pickup) */}
        {activeRide && (
          <g transform={`translate(${capX}, ${capY})`}>
            {/* Halo pulse */}
            <circle r="20" fill="url(#captainHalo)" className="animate-pulse" />
            <circle r="11" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
            <circle r="4" fill="#FFFFFF" />
            {/* Captain Name tag callout */}
            <g transform="translate(0, -20)">
              <rect x="-35" y="-12" width="70" height="15" rx="3" fill="#FFFFFF" stroke="#10B981" strokeWidth="1" />
              <text x="0" y="-2" textAnchor="middle" fontSize="8" fill="#065F46" fontWeight="bold">
                Captain Arriving
              </text>
            </g>
          </g>
        )}

        {/* Dropoff Location Marker (Red Pin with pulse) */}
        <g transform={`translate(${dropoffPoint.x}, ${dropoffPoint.y})`}>
          <circle r="12" fill="#EF4444" opacity="0.3" className="animate-ping" />
          <circle r="7" fill="#EF4444" stroke="#FFF" strokeWidth="1.5" />
          {/* Destination Pin Flag */}
          <path d="M 0 0 L 0 -18 L 14 -12 L 0 -6 Z" fill="#EF4444" />
          <line x1="0" y1="0" x2="0" y2="-18" stroke="#EF4444" strokeWidth="1.5" />
          {/* Label */}
          <g transform="translate(0, -26)">
            <rect x="-40" y="-12" width="80" height="15" rx="3" fill="#121824" stroke="#EF4444" strokeWidth="1" />
            <text x="0" y="-2" textAnchor="middle" fontSize="8" fill="#FFF" fontWeight="600">
              Drop Location
            </text>
          </g>
        </g>
      </svg>

      {/* Floating Status HUD / Top Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="glass-card px-3.5 py-2 rounded-xl flex items-center gap-2.5 pointer-events-auto border border-white/10 shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="text-xs font-mono">
            <span className="text-slate-400">Live Grid: </span>
            <span className="text-[#FFDE00] font-semibold">Bengaluru Urban Mobility</span>
          </div>
        </div>

        <div className="glass-card px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono text-slate-300 pointer-events-auto border border-white/10">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Velocity Safety Shield Enabled</span>
        </div>
      </div>

      {/* Map Control Dock (Bottom Right) */}
      <div className="absolute bottom-6 right-5 flex flex-col gap-2 z-10">
        <button
          onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}
          title="Zoom In"
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-slate-200 hover:text-[#FFDE00] hover:border-[#FFDE00]/50 transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.85, z - 0.15))}
          title="Zoom Out"
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-slate-200 hover:text-[#FFDE00] hover:border-[#FFDE00]/50 transition-all shadow-lg active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          title="Toggle Live Traffic"
          className={`w-9 h-9 rounded-xl glass-card flex items-center justify-center transition-all shadow-lg active:scale-95 ${
            showTraffic ? 'text-emerald-400 border-emerald-500/50' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(1)}
          title="Recenter"
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-slate-200 hover:text-[#FFDE00] transition-all shadow-lg active:scale-95"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Active Route Distance & ETA Floating Badge (Center-Top) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-full border border-[#FFDE00]/30 shadow-2xl flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FFDE00]">
          <Zap className="w-3.5 h-3.5 fill-[#FFDE00]" />
          <span>FASTEST ROUTE</span>
        </div>
        <div className="w-px h-3.5 bg-slate-700" />
        <span className="text-xs font-semibold text-white">6.4 km</span>
        <div className="w-px h-3.5 bg-slate-700" />
        <span className="text-xs font-semibold text-emerald-400">14 mins</span>
      </div>
    </div>
  );
};
