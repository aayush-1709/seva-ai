import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, ChevronLeft } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-3 bg-white/80 backdrop-blur shadow-sm rounded-2xl text-slate-600 hover:text-primary transition-all"
          aria-label="Back to dashboard"
        >
          <ChevronLeft size={24} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 font-manrope">Settings</h1>
            <p className="text-slate-500 text-sm font-medium">Preferences and account controls will live here.</p>
          </div>
        </div>
      </div>
      <div className="glass-panel p-8 text-slate-600 font-medium text-sm leading-relaxed">
        This area is a placeholder for notification, language, and privacy settings. Use the sidebar to continue exploring the app.
      </div>
    </div>
  );
}
