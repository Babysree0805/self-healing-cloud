import React, { useState, useEffect, useRef } from 'react';
import { PassengerPortal } from './components/PassengerPortal';
import { DriverPortal } from './components/DriverPortal';
import { RydexLoginPage } from './components/RydexLoginPage';
import { ChaosHealBar } from './components/ChaosHealBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  ChevronDown,
  LogIn,
  History,
  LogOut,
  User,
  Bike,
  Sparkles,
} from 'lucide-react';

export const App = () => {
  // Navigation View State: 'PASSENGER' | 'DRIVER' | 'LOGIN'
  const [activeView, setActiveView] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('login')) return 'LOGIN';
    if (hash.includes('driver')) return 'DRIVER';
    return 'PASSENGER';
  });

  // Separate Logins: Passenger vs Driver
  const [passengerUser, setPassengerUser] = useState(() => {
    const saved = localStorage.getItem('rydex_passenger_user');
    return saved ? JSON.parse(saved) : { username: 'priya_sharma', name: 'Priya Sharma', role: 'passenger' };
  });

  const [driverUser, setDriverUser] = useState(() => {
    const saved = localStorage.getItem('rydex_driver_user');
    return saved ? JSON.parse(saved) : { driver_id: 'DRV-001', name: 'Ramesh Gowda', role: 'driver', vehicle: 'Yamaha FZ-S' };
  });

  // Dropdown & Modal States
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [faultActive, setFaultActive] = useState(false);
  const [activeFaults, setActiveFaults] = useState([]);
  const dropdownRef = useRef(null);

  // Sync hash changes in browser URL
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('login')) setActiveView('LOGIN');
      else if (hash.includes('driver')) setActiveView('DRIVER');
      else setActiveView('PASSENGER');
      setUserDropdownOpen(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    if (activeView === 'PASSENGER') {
      localStorage.removeItem('rydex_passenger_user');
      setPassengerUser(null);
    } else if (activeView === 'DRIVER') {
      localStorage.removeItem('rydex_driver_user');
      setDriverUser(null);
    }
    window.location.hash = 'login';
  };

  const handleLoginSuccess = (role, userObj) => {
    if (role === 'PASSENGER') {
      setPassengerUser(userObj);
      setActiveView('PASSENGER');
    } else if (role === 'DRIVER') {
      setDriverUser(userObj);
      setActiveView('DRIVER');
    }
  };

  // Determine current active user details for the header
  const currentUserDisplay =
    activeView === 'DRIVER'
      ? {
          name: driverUser?.name || 'Captain Ramesh',
          roleLabel: 'Captain Pro',
          avatar: '🛵',
          avatarBg: 'bg-[#FFDE00] text-black',
        }
      : {
          name: passengerUser?.name || passengerUser?.username || 'Priya Sharma',
          roleLabel: 'Rydex Rider',
          avatar: '🧑',
          avatarBg: 'bg-[#FFDE00] text-black',
        };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B0F17] text-slate-100 font-sans select-none">
      {/* Universal Minimalist Header: Only Platform Name & Logged-In User Profile */}
      <header className="h-16 px-4 md:px-6 glass-card border-b border-white/10 flex items-center justify-between shrink-0 z-30 shadow-2xl">
        {/* Left: Platform Name Alone */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            if (activeView === 'LOGIN') window.location.hash = 'passenger';
          }}
        >
          <div className="w-10 h-10 rounded-2xl bg-[#FFDE00] text-black flex items-center justify-center text-xl font-black shadow-[0_0_20px_rgba(255,222,0,0.5)]">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-white">RYDEX</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 uppercase font-semibold">
                {activeView === 'DRIVER' ? 'CAPTAIN' : activeView === 'LOGIN' ? 'CLOUD' : 'RIDER'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Who is logged in + Dropdown (Log In, My Rides, Log Out) */}
        <div className="relative" ref={dropdownRef}>
          {activeView === 'LOGIN' ? (
            <div className="text-xs font-mono text-slate-400">
              Select Role to Enter
            </div>
          ) : (
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium transition-all shadow-md active:scale-95 group"
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner ${currentUserDisplay.avatarBg}`}
              >
                {currentUserDisplay.avatar}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-white leading-tight font-sans">
                  {currentUserDisplay.name}
                </div>
                <div className="text-[10px] font-mono text-[#FFDE00] leading-none">
                  {currentUserDisplay.roleLabel}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  userDropdownOpen ? 'rotate-180 text-[#FFDE00]' : ''
                }`}
              />
            </button>
          )}

          {/* Profile Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 top-14 w-52 rounded-2xl bg-[#121824] border border-white/10 shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 font-mono text-xs space-y-1">
              <div className="px-3 py-2 border-b border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Logged in as</div>
                <div className="text-sm font-bold text-white truncate mt-0.5 font-sans">
                  {currentUserDisplay.name}
                </div>
              </div>

              {/* 1. Log In / Switch Account */}
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  window.location.hash = 'login';
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <LogIn className="w-4 h-4 text-[#FFDE00]" />
                <span>Log In / Switch Account</span>
              </button>

              {/* 2. My Rides Option */}
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  if (activeView === 'PASSENGER') {
                    setIsHistoryOpen(true);
                  } else {
                    alert('Showing Captain accepted trips history: 14 rides completed today, 348 rides this month.');
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
              >
                <History className="w-4 h-4 text-emerald-400" />
                <span>My Rides</span>
              </button>

              {/* 3. Log Out Option */}
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* SRE Chaos Detection & Autonomous HealOps Bar */}
      <ChaosHealBar
        onFaultStateChange={(isActive, faults) => {
          setFaultActive(isActive);
          setActiveFaults(faults);
        }}
      />

      {/* Main View Area: Render RydexLoginPage, PassengerPortal, or DriverPortal */}
      <main className="flex-1 overflow-hidden relative">
        <ErrorBoundary>
          {activeView === 'LOGIN' ? (
            <RydexLoginPage onLoginSuccess={handleLoginSuccess} />
          ) : activeView === 'PASSENGER' ? (
            <PassengerPortal
              currentUser={passengerUser}
              onOpenAuth={() => (window.location.hash = 'login')}
              faultActive={faultActive}
              activeFaults={activeFaults}
              onHealFault={() => setFaultActive(false)}
              isHistoryOpen={isHistoryOpen}
              setIsHistoryOpen={setIsHistoryOpen}
            />
          ) : (
            <DriverPortal
              driverUser={driverUser}
              faultActive={faultActive}
              activeFaults={activeFaults}
              onHealFault={() => setFaultActive(false)}
            />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
