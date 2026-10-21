import React, { useState, useEffect, useRef } from 'react';
import { PassengerPortal } from './components/PassengerPortal';
import { DriverPortal } from './components/DriverPortal';
import { AdminSrePortal } from './components/AdminSrePortal';
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
  Shield,
  Zap,
} from 'lucide-react';

export const App = () => {
  // Navigation View State: 'PASSENGER' | 'DRIVER' | 'ADMIN' | 'LOGIN'
  const [activeView, setActiveView] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('login')) return 'LOGIN';
    if (hash.includes('driver')) return 'DRIVER';
    if (hash.includes('admin') || hash.includes('sre')) return 'ADMIN';
    return 'PASSENGER';
  });

  // Separate Logins: Passenger vs Driver vs Admin
  const [passengerUser, setPassengerUser] = useState(() => {
    const saved = localStorage.getItem('rydex_passenger_user');
    return saved ? JSON.parse(saved) : { username: 'priya_sharma', name: 'Priya Sharma', role: 'passenger' };
  });

  const [driverUser, setDriverUser] = useState(() => {
    const saved = localStorage.getItem('rydex_driver_user');
    return saved ? JSON.parse(saved) : { driver_id: 'DRV-001', name: 'Ramesh Gowda', role: 'driver', vehicle: 'Yamaha FZ-S' };
  });

  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('rydex_admin_user');
    return saved ? JSON.parse(saved) : { username: 'admin', name: 'SRE Lead (Admin)', role: 'admin' };
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
      else if (hash.includes('admin') || hash.includes('sre')) setActiveView('ADMIN');
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
    } else if (activeView === 'ADMIN') {
      localStorage.removeItem('rydex_admin_user');
      setAdminUser(null);
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
    } else if (role === 'ADMIN') {
      setAdminUser(userObj);
      setActiveView('ADMIN');
    }
  };

  // Determine current active user details for the header
  const currentUserDisplay =
    activeView === 'DRIVER'
      ? {
          name: driverUser?.name || 'Captain Ramesh',
          roleLabel: 'Captain Pro',
          icon: <Bike className="w-3.5 h-3.5 text-emerald-700" />,
          avatarBg: 'bg-emerald-100 border border-emerald-300',
        }
      : activeView === 'ADMIN'
      ? {
          name: adminUser?.name || 'SRE Lead (Admin)',
          roleLabel: 'SRE Ops Admin',
          icon: <Shield className="w-3.5 h-3.5 text-emerald-800" />,
          avatarBg: 'bg-emerald-100 border border-emerald-300',
        }
      : {
          name: passengerUser?.name || passengerUser?.username || 'Priya Sharma',
          roleLabel: 'Rydex Rider',
          icon: <User className="w-3.5 h-3.5 text-emerald-700" />,
          avatarBg: 'bg-emerald-100 border border-emerald-300',
        };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8FAF9] text-slate-900 font-sans select-none">
      {/* Universal Minimalist Header */}
      <header className="h-16 px-4 md:px-6 bg-white border-b border-emerald-100 flex items-center justify-between shrink-0 z-30 shadow-sm">
        {/* Left: Platform Name */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            if (activeView === 'LOGIN') window.location.hash = 'passenger';
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">RYDEX</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase font-bold tracking-wider">
                {activeView === 'DRIVER' ? 'CAPTAIN' : activeView === 'ADMIN' ? 'SRE OPS' : activeView === 'LOGIN' ? 'CLOUD' : 'RIDER'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Who is logged in + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          {activeView === 'LOGIN' ? (
            <div className="text-xs font-mono text-slate-500">
              Select Role to Enter
            </div>
          ) : (
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-all shadow-sm group"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${currentUserDisplay.avatarBg}`}
              >
                {currentUserDisplay.icon}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-slate-900 leading-tight">
                  {currentUserDisplay.name}
                </div>
                <div className="text-[10px] font-mono text-emerald-700 leading-none">
                  {currentUserDisplay.roleLabel}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  userDropdownOpen ? 'rotate-180 text-emerald-700' : ''
                }`}
              />
            </button>
          )}

          {/* Profile Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 top-14 w-56 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Logged in as</div>
                <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                  {currentUserDisplay.name}
                </div>
              </div>

              {/* 1. Log In / Switch Account */}
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  window.location.hash = 'login';
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left"
              >
                <LogIn className="w-4 h-4 text-emerald-600" />
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
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left"
              >
                <History className="w-4 h-4 text-emerald-600" />
                <span>My Rides</span>
              </button>

              {/* 3. Log Out Option */}
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-left font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* SRE Chaos Detection & Autonomous HealOps Bar (shown on Passenger & Driver pages) */}
      {activeView !== 'ADMIN' && (
        <ChaosHealBar
          onFaultStateChange={(isActive, faults) => {
            setFaultActive(isActive);
            setActiveFaults(faults);
          }}
        />
      )}

      {/* Main View Area: Render RydexLoginPage, PassengerPortal, DriverPortal, or AdminSrePortal */}
      <main className="flex-1 overflow-y-auto relative">
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
          ) : activeView === 'DRIVER' ? (
            <DriverPortal
              driverUser={driverUser}
              faultActive={faultActive}
              activeFaults={activeFaults}
              onHealFault={() => setFaultActive(false)}
            />
          ) : (
            <AdminSrePortal />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
