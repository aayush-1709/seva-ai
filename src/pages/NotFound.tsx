import { Link } from 'react-router-dom';
import { Home, Map, FileWarning, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center space-y-8"
      >
        <div className="text-8xl font-black text-primary/20 font-manrope">404</div>
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 font-manrope">Page not found</h1>
          <p className="text-slate-500 font-medium">
            That path does not exist or was moved. Pick a destination below.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            <Home size={18} />
            Dashboard
          </Link>
          <Link
            to="/report"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95"
          >
            <FileWarning size={18} />
            Report a problem
          </Link>
          <Link
            to="/map"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-primary hover:text-primary transition-all active:scale-95"
          >
            <Map size={18} />
            Map
          </Link>
        </div>
        <Link to="/insights" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
          <Search size={16} />
          Open insights
        </Link>
      </motion.div>
    </div>
  );
}
