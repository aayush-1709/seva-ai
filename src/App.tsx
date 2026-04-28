/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  BarChart3, 
  ClipboardList, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  HeartHandshake,
  Bell,
  Globe,
  PlusCircle,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import RequestAsst from './pages/RequestAsst';
import Volunteer from './pages/Volunteer';
import ImpactMap from './pages/ImpactMap';
import NGODashboard from './pages/NGODashboard';
import Analytics from './pages/Analytics';
import TaskBoard from './pages/TaskBoard';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';

const SidebarLink = ({ to, icon: Icon, children, onClick }: { to: string, icon: any, children: React.ReactNode, onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 group ${
        isActive 
          ? 'bg-blue-50 text-primary font-semibold border-r-4 border-primary' 
          : 'text-slate-500 hover:text-primary hover:bg-slate-50 hover:translate-x-1'
      }`}
    >
      <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'} />
      <span className="text-sm">{children}</span>
    </Link>
  );
};

function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const headerNavClass = (...paths: string[]) => {
    const active = paths.includes(location.pathname);
    return `font-bold transition-all pb-1 border-b-2 ${
      active
        ? 'text-primary border-primary'
        : 'text-slate-500 border-transparent hover:text-primary'
    }`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-lg border-r border-slate-200 shadow-2xl transition-transform duration-300 z-50 py-6 overflow-y-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-6 mb-8 flex items-center justify-between">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="p-2 bg-primary rounded-xl text-white">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-primary font-manrope">SevaAI</h2>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Empathetic AI Hub</p>
            </div>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="lg:hidden p-3 text-slate-400 hover:text-slate-900"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 flex flex-col gap-1">
          <SidebarLink to="/" icon={LayoutDashboard} onClick={() => setIsMobileMenuOpen(false)}>Overview</SidebarLink>
          <SidebarLink to="/map" icon={MapIcon} onClick={() => setIsMobileMenuOpen(false)}>Impact Map</SidebarLink>
          <SidebarLink to="/insights" icon={BarChart3} onClick={() => setIsMobileMenuOpen(false)}>Social Impact</SidebarLink>
          <SidebarLink to="/tasks" icon={ClipboardList} onClick={() => setIsMobileMenuOpen(false)}>Task Center</SidebarLink>
          <SidebarLink to="/ngo" icon={ShieldAlert} onClick={() => setIsMobileMenuOpen(false)}>NGO Panel</SidebarLink>
        </nav>

        <div className="px-6 pt-6 mt-6 border-t border-slate-100">
          <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-4 hover:shadow-lg hover:shadow-secondary/20 transition-all active:scale-95">
            <PlusCircle size={18} />
            Volunteer Now
          </Link>
          <div className="flex flex-col gap-2">
            <SidebarLink to="/settings" icon={SettingsIcon} onClick={() => setIsMobileMenuOpen(false)}>Settings</SidebarLink>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col bg-surface-background">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-blue-900/5 px-4 md:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-3 text-slate-500 hover:bg-slate-100 rounded-lg"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <div className="lg:hidden font-black text-2xl text-primary font-manrope">SevaAI</div>
            <div className="hidden md:flex gap-6">
              <Link to="/" className={headerNavClass('/')}>Dashboard</Link>
              <Link to="/map" className={headerNavClass('/map')}>Map</Link>
              <Link to="/community" className={headerNavClass('/community', '/volunteer')}>Community</Link>
              <Link to="/insights" className={headerNavClass('/insights', '/analytics')}>Insights</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              className="p-3 text-slate-500 hover:bg-blue-50/50 rounded-full transition-all"
              aria-label="Change language"
            >
              <Globe size={20} />
            </button>
            <button 
              className="p-3 text-slate-500 hover:bg-blue-50/50 rounded-full transition-all relative"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
            </button>
            <Link to="/request" className="hidden sm:block bg-primary text-white px-4 py-2 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
              Quick Help
            </Link>
            <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 overflow-hidden cursor-pointer">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4V706d4KymzW9iOXbbE4j-5VNn4N0pzZjra01qhNfY0njcHzgMtePbYxZCr3ZNOcFEy3G4beRJSLl81tbyhZA5acjFDlGRN8A7B5_WPySX091123qUjnCchVjoqYqk3zdDblnHjSPKf0KvWnm0iOkUihTCC9-MfpXEZ7DyUea9iyJF6Of4Ji4OopTk9mIFPlfshQf6x6upTYZjIvscRLEIEhgrmQ7rYCEiT0cxPeq35IvJt64xr67Zh1_8HdTsJnHh0crwcaRkWDt" alt="Avatar" />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shell><Dashboard /></Shell>} />
      <Route path="/report" element={<Shell><Report /></Shell>} />
      <Route path="/request" element={<Shell><RequestAsst /></Shell>} />
      <Route path="/community" element={<Shell><Volunteer /></Shell>} />
      <Route path="/volunteer" element={<Shell><Volunteer /></Shell>} />
      <Route path="/map" element={<Shell><ImpactMap /></Shell>} />
      <Route path="/ngo" element={<Shell><NGODashboard /></Shell>} />
      <Route path="/insights" element={<Shell><Analytics /></Shell>} />
      <Route path="/analytics" element={<Navigate to="/insights" replace />} />
      <Route path="/tasks" element={<Shell><TaskBoard /></Shell>} />
      <Route path="/settings" element={<Shell><Settings /></Shell>} />
      <Route path="*" element={<Shell><NotFound /></Shell>} />
    </Routes>
  );
}
