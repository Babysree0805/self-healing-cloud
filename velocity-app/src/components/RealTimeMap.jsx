import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Compass,
  Navigation,
  Layers,
  MapPin,
  Shield,
  Zap,
  Maximize2,
  Crosshair,
  TrendingUp,
  AlertTriangle,
  Bike,
  Car,
} from 'lucide-react';

// Bangalore Coordinates Database (16+ major hubs)
export const BANGALORE_COORDS = {
  'MG Road Metro Station': [12.9756, 77.6066],
  'Indiranagar 100ft Road': [12.9784, 77.6408],
  'Koramangala Sony Signal': [12.9352, 77.6245],
  'Manyata Embassy Tech Park': [13.0475, 77.6200],
  'Kempegowda Airport T1': [13.1986, 77.7066],
  'HSR Layout Sector 2': [12.9116, 77.6389],
  'Bellandur EcoSpace': [12.9260, 77.6833],
  'Whitefield ITPL': [12.9866, 77.7314],
  'KSR Bengaluru City Railway Station': [12.9781, 77.5696],
  'Cubbon Park Metro Station': [12.9778, 77.5929],
  'Forum Mall Koramangala': [12.9345, 77.6101],
  'IIM Bangalore Bannerghatta': [12.8953, 77.5996],
  'Manipal Hospital Old Airport Rd': [12.9587, 77.6482],
  'Phoenix Marketcity Mahadevapura': [12.9959, 77.6964],
  'Electronic City Phase 1': [12.8452, 77.6602],
  'Church Street Brigade Road': [12.9748, 77.6074],
};

// Generate realistic polyline waypoints between two points
function generateRouteWaypoints(start, end, steps = 12) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curve = Math.sin(t * Math.PI) * 0.003;
    const lat = start[0] + (end[0] - start[0]) * t + curve;
    const lng = start[1] + (end[1] - start[1]) * t - curve * 0.5;
    points.push([lat, lng]);
  }
  return points;
}

export const RealTimeMap = ({
  mode = 'PASSENGER', // 'PASSENGER' | 'DRIVER'
  pickupLocation = 'MG Road Metro Station',
  dropoffLocation = 'Koramangala Sony Signal',
  activeRide = null,
  activeTrip = null,
  rideStatus = 'IDLE',
  rideType = 'BIKE',
  isOnline = true,
  faultActive = false,
  activeFaults = [],
  onHealFault = null,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Layer groups for dynamic markers
  const markersGroupRef = useRef(null);
  const routeGroupRef = useRef(null);
  const surgeGroupRef = useRef(null);

  const [mapStyle, setMapStyle] = useState('VOYAGER'); // Default clean light cartography
  const [gpsLocked, setGpsLocked] = useState(true);
  const [activeChaosInfo, setActiveChaosInfo] = useState(null);

  // Sync active chaos from shared localStorage across tabs
  useEffect(() => {
    const syncChaos = () => {
      try {
        const stored = localStorage.getItem('rydex_active_chaos');
        if (stored) {
          const parsed = JSON.parse(stored);
          const rem = (parsed.expires_at - Date.now()) / 1000;
          if (rem > 0) {
            setActiveChaosInfo({
              ...parsed,
              remaining: Math.max(0.1, Math.round(rem * 10) / 10)
            });
            return;
          }
        }
      } catch (e) {}
      setActiveChaosInfo(null);
    };

    syncChaos();
    const interval = setInterval(syncChaos, 150);
    window.addEventListener('storage', syncChaos);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncChaos);
    };
  }, []);

  // Active captain live coordinates (Ramesh Gowda near MG Road)
  const [captainCoords, setCaptainCoords] = useState([12.9716, 77.5946]);

  // Dynamic nearby roaming captains (clean, no emojis)
  const [roamingDrivers, setRoamingDrivers] = useState([
    { id: 'DRV-001', type: 'BIKE', lat: 12.9716, lng: 77.5946, heading: 45, name: 'Captain Ramesh' },
    { id: 'DRV-002', type: 'AUTO', lat: 12.9690, lng: 77.6120, heading: 280, name: 'Captain Manjunath' },
    { id: 'DRV-003', type: 'PARCEL', lat: 12.9720, lng: 77.6040, heading: 180, name: 'Captain Sunil' },
    { id: 'DRV-007', type: 'CAB_ECONOMY', lat: 12.9810, lng: 77.6150, heading: 90, name: 'Captain Deepak' },
  ]);

  // Initial Map Setup
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
      mapInstanceRef.current._tileLayer = tileLayer;

      // Create Layer Groups
      surgeGroupRef.current = L.layerGroup().addTo(map);
      routeGroupRef.current = L.layerGroup().addTo(map);
      markersGroupRef.current = L.layerGroup().addTo(map);

      setTimeout(() => map.invalidateSize(), 200);
    }
  }, []);

  // Update Tile Layer if Style Toggled
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.invalidateSize();
  }, [mapStyle]);

  // Live Driver Roaming Wandering
  useEffect(() => {
    const isNetworkOrCrash = Array.isArray(activeFaults) && activeFaults.some(
      (f) => f.failure_type === 'SERVICE_CRASH' || f.failure_type === 'NETWORK_PARTITION'
    );
    if (isNetworkOrCrash) return;

    const interval = setInterval(() => {
      setRoamingDrivers((prev) =>
        prev.map((d) => {
          const latJitter = (Math.random() - 0.49) * 0.0004;
          const lngJitter = (Math.random() - 0.49) * 0.0004;
          return {
            ...d,
            lat: d.lat + latJitter,
            lng: d.lng + lngJitter,
            heading: (d.heading + (Math.random() - 0.5) * 20 + 360) % 360,
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [activeFaults]);

  // Draw Heatmaps & Surge Zones
  useEffect(() => {
    if (!mapInstanceRef.current || !surgeGroupRef.current) return;
    surgeGroupRef.current.clearLayers();

    const surgeZones = [
      { name: 'Koramangala 1.35x', coords: [12.9352, 77.6245], radius: 1400, color: '#10B981', surge: '1.35x' },
      { name: 'Outer Ring Road 1.4x', coords: [12.9260, 77.6833], radius: 1600, color: '#059669', surge: '1.40x' },
      { name: 'Indiranagar 1.25x', coords: [12.9784, 77.6408], radius: 1200, color: '#34D399', surge: '1.25x' },
    ];

    surgeZones.forEach((z) => {
      const circle = L.circle(z.coords, {
        color: z.color,
        fillColor: z.color,
        fillOpacity: 0.10,
        weight: 1.5,
        dashArray: '4, 4',
      });

      circle.bindTooltip(`${z.name}`, {
        permanent: false,
        direction: 'center',
        className: 'surge-tooltip font-mono text-[10px] bg-white text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded shadow-sm',
      });

      surgeGroupRef.current.addLayer(circle);
    });
  }, []);

  // Resolve Coords
  const getCoords = (loc) => {
    if (Array.isArray(loc) && loc.length === 2) return loc;
    if (typeof loc === 'object' && loc && loc.lat && loc.lng) return [loc.lat, loc.lng];
    if (typeof loc === 'string') {
      for (const [key, val] of Object.entries(BANGALORE_COORDS)) {
        if (loc.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
          return val;
        }
      }
    }
    return [12.9756, 77.6066]; // default MG Road
  };

  // Re-draw Markers, Routes & Moving Captains
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !routeGroupRef.current) return;

    const map = mapInstanceRef.current;
    markersGroupRef.current.clearLayers();
    routeGroupRef.current.clearLayers();

    const startPoint = getCoords(pickupLocation);
    const endPoint = getCoords(dropoffLocation);

    // 1. Draw Pickup Marker (Point A)
    const pickupIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); border: 1.5px solid #10B981;"></div>
          <div style="width: 20px; height: 20px; border-radius: 50%; background: #10B981; border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 10px; font-family: monospace;">
            A
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const pickupMarker = L.marker(startPoint, { icon: pickupIcon }).bindPopup(
      `<div class="font-mono text-xs"><strong>Passenger Pickup:</strong><br/>${typeof pickupLocation === 'string' ? pickupLocation : 'Pickup Location'}</div>`
    );
    markersGroupRef.current.addLayer(pickupMarker);

    // 2. Draw Dropoff Marker (Point B)
    const dropoffIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(239, 68, 68, 0.2); border: 1.5px solid #EF4444;"></div>
          <div style="width: 20px; height: 20px; border-radius: 50%; background: #EF4444; border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 10px; font-family: monospace;">
            B
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const dropoffMarker = L.marker(endPoint, { icon: dropoffIcon }).bindPopup(
      `<div class="font-mono text-xs"><strong>Drop Destination:</strong><br/>${typeof dropoffLocation === 'string' ? dropoffLocation : 'Dropoff Location'}</div>`
    );
    markersGroupRef.current.addLayer(dropoffMarker);

    // 3. Draw Route Polyline
    const waypoints = generateRouteWaypoints(startPoint, endPoint);
    const routeLine = L.polyline(waypoints, {
      color: '#059669',
      weight: 4,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: activeRide || activeTrip ? null : '6, 6',
    });
    routeGroupRef.current.addLayer(routeLine);

    // 4. Draw Matched / Active Captain Marker
    const isMatched = (activeRide && activeRide.captain) || activeTrip;
    if (isMatched) {
      const captainName = activeTrip ? (activeTrip.customerName ? 'Captain Ramesh' : 'Ramesh Gowda') : (activeRide?.captain?.name || 'Captain Ramesh');
      const captainVehicle = activeTrip?.vehicle || activeRide?.captain?.vehicle || 'Yamaha FZ-S';
      const capIcon = L.divIcon({
        className: 'captain-matched-marker',
        html: `
          <div style="position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.25); border: 1.5px solid #10B981;"></div>
            <div style="width: 26px; height: 26px; border-radius: 50%; background: #059669; border: 2px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
            </div>
            <div style="margin-top: 3px; background: #FFFFFF; color: #065F46; border: 1px solid #A7F3D0; border-radius: 4px; padding: 1px 6px; font-family: monospace; font-size: 9px; font-weight: 700; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              ${captainName} (${captainVehicle.split(' ')[0]})
            </div>
          </div>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 23],
      });
      const capMarker = L.marker(captainCoords, { icon: capIcon }).bindPopup(
        `<div class="font-mono text-xs"><strong>Assigned Captain:</strong><br/>${captainName}<br/>${captainVehicle}</div>`
      );
      markersGroupRef.current.addLayer(capMarker);
    } else {
      // Draw nearby roaming captains with clean SVG marker
      roamingDrivers.forEach((drv) => {
        const driverIcon = L.divIcon({
          className: 'roaming-driver-icon',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
              <div style="width: 22px; height: 22px; border-radius: 50%; background: #FFFFFF; border: 2px solid #10B981; box-shadow: 0 1px 4px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; color: #059669;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
              </div>
              <div style="margin-top: 2px; background: #FFFFFF; color: #0F172A; border: 1px solid #E2E8F0; border-radius: 3px; padding: 0px 4px; font-family: monospace; font-size: 8px; font-weight: 600; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                ${drv.name.split(' ')[1] || drv.name}
              </div>
            </div>
          `,
          iconSize: [24, 30],
          iconAnchor: [12, 15],
        });

        const m = L.marker([drv.lat, drv.lng], { icon: driverIcon });
        markersGroupRef.current.addLayer(m);
      });
    }

    if (gpsLocked) {
      const bounds = L.latLngBounds([startPoint, endPoint]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [pickupLocation, dropoffLocation, activeRide, activeTrip, roamingDrivers, captainCoords, gpsLocked]);

  const activeMapFault = (activeChaosInfo && (activeChaosInfo.fault_type === 'SERVICE_CRASH' || activeChaosInfo.fault_type === 'NETWORK_PARTITION'))
    ? activeChaosInfo
    : (Array.isArray(activeFaults) ? activeFaults.find((f) => f.failure_type === 'SERVICE_CRASH' || f.failure_type === 'NETWORK_PARTITION') : null);

  const isServiceCrash = activeMapFault && (activeMapFault.fault_type === 'SERVICE_CRASH' || activeMapFault.failure_type === 'SERVICE_CRASH');
  const isNetPartition = activeMapFault && (activeMapFault.fault_type === 'NETWORK_PARTITION' || activeMapFault.failure_type === 'NETWORK_PARTITION');

  return (
    <div className={`relative w-full h-full min-h-[500px] bg-slate-100 overflow-hidden select-none ${mapStyle === 'DARK' ? 'rydex-dark-map' : 'rydex-light-map'}`}>
      <style>{`
        .rydex-dark-map .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(105%) saturate(60%) !important;
        }
        .rydex-light-map .leaflet-tile-pane {
          filter: none !important;
        }
        .leaflet-container {
          background-color: #F8FAF9 !important;
        }
        .leaflet-tile {
          image-rendering: auto;
        }
      `}</style>

      {/* Real-time Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Telemetry & Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="bg-white/95 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 text-xs font-mono shadow-xs backdrop-blur-xs">
          <span className={`w-2 h-2 rounded-full ${isServiceCrash ? 'bg-rose-500 animate-ping' : (isNetPartition ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')}`} />
          <span className="text-slate-800 font-semibold">Bengaluru Mobility Grid</span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-emerald-700 font-medium">{roamingDrivers.length} Captains Active</span>
          {activeRide && (
            <>
              <span className="text-slate-300">&bull;</span>
              <span className="text-emerald-700 font-medium">Matched Trip Active</span>
            </>
          )}
        </div>

        {activeMapFault && (
          <div className="px-2.5 py-1.5 rounded-lg border border-rose-300 bg-rose-50 items-center gap-1.5 text-[11px] font-mono text-rose-800 flex shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>
              {isServiceCrash
                ? `503 CrashLoopBackOff: driver-service:8003 (${activeMapFault.remaining || 7}s heal)`
                : `504 Gateway Timeout: 45% Packet Drop on location-service (${activeMapFault.remaining || 8.2}s heal)`}
            </span>
          </div>
        )}
      </div>

      {/* Right Map Action Buttons */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        {/* Toggle Dark / Light Map Style */}
        <button
          onClick={() => setMapStyle((s) => (s === 'DARK' ? 'VOYAGER' : 'DARK'))}
          className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs"
          title={`Switch to ${mapStyle === 'DARK' ? 'Light Cartography' : 'Night Map'}`}
        >
          <Layers className="w-4 h-4 text-slate-600" />
        </button>

        {/* Recenter / Lock GPS */}
        <button
          onClick={() => {
            setGpsLocked(true);
            if (mapInstanceRef.current) {
              const startPoint = getCoords(pickupLocation);
              const endPoint = getCoords(dropoffLocation);
              const bounds = L.latLngBounds([startPoint, endPoint]);
              mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
            }
          }}
          className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs"
          title="Recenter Map Bounds"
        >
          <Crosshair className="w-4 h-4 text-emerald-600" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => mapInstanceRef.current && mapInstanceRef.current.zoomIn()}
          className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs text-xs font-bold font-mono"
        >
          +
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => mapInstanceRef.current && mapInstanceRef.current.zoomOut()}
          className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs text-xs font-bold font-mono"
        >
          -
        </button>
      </div>

      {/* Bottom Floating Map Scale & Attribution */}
      <div className="absolute bottom-2 left-4 z-10 text-[9px] font-mono text-slate-400">
        OpenStreetMap &bull; Rydex Autonomous Mobility Grid &bull; Bengaluru
      </div>
    </div>
  );
};

export default RealTimeMap;
