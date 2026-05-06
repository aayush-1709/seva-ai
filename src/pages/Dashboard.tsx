import {
  ShieldAlert,
  HandHelping,
  Map as MapIcon,
  Building2,
  MessageSquare,
  ChevronRight,
  ArrowUpRight,
  Target,
  Users,
  Search,
  BrainCircuit,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';

import { apiUrl, getApiBaseUrl } from '../lib/api';

type CivicReport = {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  location: { lat: number; lng: number };
  createdAt?: string | null;
};

const CATEGORY_ORDER = [
  'infrastructure',
  'lighting',
  'water',
  'safety',
  'env',
  'other',
] as const;

/** Mock “active NGOs” scaled lightly off dataset size so it feels dynamic. */
function mockActiveNgos(uniqueCategories: number, totalReports: number): number {
  if (totalReports === 0) return 8;
  const base = 6 + uniqueCategories * 3;
  const bump = Math.min(12, Math.floor(totalReports / 5));
  return Math.min(48, base + bump);
}

const ActionCard = ({
  title,
  description,
  icon: Icon,
  color,
  to,
  delay,
}: {
  title: string;
  description: string;
  icon: ElementType;
  color: string;
  to: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -5 }}
    className="group relative"
  >
    <Link to={to} className="block h-full">
      <div className="glass-card h-full p-6 flex flex-col border border-white/40 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all">
        <div
          className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
        >
          <Icon size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2 font-manrope">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">{description}</p>
        <div className="flex items-center text-primary font-bold text-sm group-hover:translate-x-1 transition-transform">
          Get Started <ChevronRight size={16} />
        </div>
      </div>
    </Link>
  </motion.div>
);

const StatCard = ({
  label,
  value,
  icon: Icon,
  badge,
}: {
  label: string;
  value: string;
  icon: ElementType;
  badge: string;
}) => (
  <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/60 flex items-center gap-4">
    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
      <Icon size={20} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</div>
      <div className="text-lg font-black text-slate-800 flex items-center gap-2 flex-wrap">
        <span className="truncate">{value}</span>
        <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold shrink-0">
          {badge}
        </span>
      </div>
    </div>
  </div>
);

function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] rounded-2xl border border-white/40 bg-white/40 animate-pulse"
        />
      ))}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-xl border border-slate-100 bg-slate-100/80 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/reports'));
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as CivicReport[];
      setReports(Array.isArray(data) ? data : []);
      setFetchError(null);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
    const interval = window.setInterval(() => {
      void fetchReports();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [fetchReports]);

  const stats = useMemo(() => {
    const total = reports.length;
    const highPriority = reports.filter((r) => r.priority?.toLowerCase() === 'high').length;
    const uniqueCategories = new Set(reports.map((r) => r.category)).size;
    const activeNgos = mockActiveNgos(uniqueCategories, total);
    return { total, highPriority, uniqueCategories, activeNgos };
  }, [reports]);

  const categoryBars = useMemo(() => {
    const maxCount = CATEGORY_ORDER.reduce(
      (max, key) => Math.max(max, reports.filter((r) => r.category === key).length),
      0
    );
    const safeMax = Math.max(maxCount, 1);
    return CATEGORY_ORDER.map((key) => {
      const count = reports.filter((r) => r.category === key).length;
      return {
        key,
        label: key === 'env' ? 'Environment' : key.charAt(0).toUpperCase() + key.slice(1),
        count,
        heightPct: Math.round((count / safeMax) * 100),
      };
    });
  }, [reports]);

  const sortedFeed = useMemo(() => {
    return [...reports].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
  }, [reports]);

  const showSkeleton = loading && reports.length === 0;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-800 p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <Target className="w-full h-full transform translate-x-1/4 -translate-y-1/4 rotate-12" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {showSkeleton ? (
              <span className="inline-block h-4 w-48 bg-white/20 rounded animate-pulse" />
            ) : (
              <>
                Firestore live: {stats.total.toLocaleString()} report
                {stats.total === 1 ? '' : 's'} indexed
              </>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black font-manrope leading-[1.1] mb-6"
          >
            How can <span className="text-blue-200">SevaAI</span> help you today?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-blue-50/80 mb-8 max-w-lg leading-relaxed"
          >
            Bridge the gap between immediate local needs and altruistic resources with our AI-prioritized
            empathy hub.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-4"
          >
            <div className="relative w-full min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input
                type="text"
                placeholder="Ask Seva: 'Find nearest food shelter' or 'Report a leak'..."
                className="w-full bg-white text-slate-800 px-12 py-4 rounded-2xl font-medium focus:ring-4 focus:ring-blue-400/30 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/report"
                className="inline-flex items-center justify-center bg-white text-primary px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-lg active:scale-95"
              >
                Report a Problem
              </Link>
              <Link
                to="/insights"
                className="inline-flex items-center justify-center bg-secondary text-on-secondary px-8 py-4 rounded-2xl font-black hover:bg-opacity-90 transition-all shadow-lg active:scale-95"
              >
                Analyze
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {fetchError && (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2"
          role="status"
        >
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>
            Could not refresh reports: {fetchError}. Is the API running at {getApiBaseUrl()}?
          </span>
        </div>
      )}

      {/* Stats — Firestore-driven */}
      {showSkeleton ? (
        <StatGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total issues"
            value={stats.total.toLocaleString()}
            icon={HandHelping}
            badge="Reports"
          />
          <StatCard
            label="High priority"
            value={stats.highPriority.toLocaleString()}
            icon={ShieldAlert}
            badge="Urgent"
          />
          <StatCard
            label="Unique categories"
            value={stats.uniqueCategories.toLocaleString()}
            icon={Users}
            badge="Types"
          />
          <StatCard
            label="Active NGOs"
            value={stats.activeNgos.toLocaleString()}
            icon={Building2}
            badge="Est."
          />
        </div>
      )}

      {/* Nearby issues feed */}
      <section className="glass-panel p-6 md:p-8 rounded-[2rem] border border-white/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 font-manrope">Nearby issues feed</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Reports from Firestore (auto-refresh every 5s)
            </p>
          </div>
          <Link
            to="/map"
            className="text-primary font-bold text-sm flex items-center gap-1 hover:underline shrink-0"
          >
            Open map <ArrowUpRight size={16} />
          </Link>
        </div>

        {showSkeleton ? (
          <FeedSkeleton />
        ) : sortedFeed.length === 0 ? (
          <div className="text-center py-14 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80">
            <p className="text-slate-600 font-semibold mb-2">No reports yet</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              When community members submit issues, they will appear here automatically.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Submit the first report
            </Link>
          </div>
        ) : (
          <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {sortedFeed.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-100 bg-white/70 hover:border-primary/20 transition-colors p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 line-clamp-2">{r.description}</p>
                    <p className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-slate-700">{r.category}</span>
                      <span>·</span>
                      <span className="uppercase">{r.priority} priority</span>
                      <span>·</span>
                      <span>{r.status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 font-mono">
                    <MapPin size={14} className="shrink-0" />
                    {r.location.lat.toFixed(4)}, {r.location.lng.toFixed(4)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Action Grid */}
      <section id="core-services">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 font-manrope">Core Services</h2>
            <p className="text-slate-500 font-medium">Select a category to begin supporting your community</p>
          </div>
          <Link to="/map" className="text-primary font-bold flex items-center gap-1 hover:underline">
            View All Services <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard
            title="Rapid Reporting"
            description="Use AI to quickly report local issues like infrastructure damage, outages, or social concerns."
            icon={ShieldAlert}
            color="bg-primary"
            to="/report"
            delay={0.1}
          />
          <ActionCard
            title="Assistance Hub"
            description="Request specific resources like food, medical supplies, or essential aid for your family or group."
            icon={HandHelping}
            color="bg-secondary"
            to="/request"
            delay={0.2}
          />
          <ActionCard
            title="Impact Mapping"
            description="Visualize live hotspots, active deployments, and resource allocation in your neighborhood."
            icon={MapIcon}
            color="bg-blue-600"
            to="/map"
            delay={0.3}
          />
          <ActionCard
            title="NGO Network"
            description="Connect with verified organizations and NGOs to scale your impact or find institutional support."
            icon={Building2}
            color="bg-slate-800"
            to="/ngo"
            delay={0.4}
          />
        </div>
      </section>

      {/* Featured Insights — chart from live category counts */}
      <section className="grid lg:grid-cols-3 gap-8">
        <div id="realtime-impact" className="lg:col-span-2 glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-slate-800 font-manrope">Real-time Impact</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                Firestore
              </span>
            </div>
          </div>
          {showSkeleton ? (
            <div className="h-64 flex items-end justify-between gap-2 px-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 bg-slate-200/80 rounded-t-lg animate-pulse h-32" />
              ))}
            </div>
          ) : (
            <>
              <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 px-2">
                {categoryBars.map((bar, i) => (
                  <div key={bar.key} className="group relative flex-1 min-w-0">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(bar.heightPct, bar.count > 0 ? 8 : 4)}%` }}
                      transition={{ delay: i * 0.04, duration: 0.5 }}
                      className="w-full bg-primary/25 hover:bg-primary transition-all rounded-t-lg min-h-[4px]"
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {bar.label}: {bar.count}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight px-1 gap-1">
                {categoryBars.map((bar) => (
                  <span key={bar.key} className="truncate flex-1 text-center" title={bar.label}>
                    {bar.key === 'infrastructure' ? 'Infra' : bar.key === 'lighting' ? 'Light' : bar.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="glass-panel p-8 bg-primary text-white">
          <h3 className="text-2xl font-black font-manrope mb-6">AI Insight</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="text-blue-200" size={20} />
                <span className="font-bold text-sm">Suggested Action</span>
              </div>
              <p className="text-sm text-blue-50 leading-relaxed">
                High-priority reports are triage first. {stats.highPriority > 0
                  ? `You currently have ${stats.highPriority} high-priority open report${stats.highPriority === 1 ? '' : 's'} — review them on the map.`
                  : 'No high-priority items in the feed right now.'}
              </p>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="text-blue-200" size={20} />
                <span className="font-bold text-sm">Community Pulse</span>
              </div>
              <p className="text-sm text-blue-50 leading-relaxed">
                {stats.total > 0
                  ? `${stats.total.toLocaleString()} total report${stats.total === 1 ? '' : 's'} across ${stats.uniqueCategories} categor${stats.uniqueCategories === 1 ? 'y' : 'ies'}.`
                  : 'Once data flows in from submissions, this panel summarizes volume and variety.'}
              </p>
            </div>

            <Link
              to="/insights"
              className="block w-full py-4 bg-white text-primary rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all text-center"
            >
              Launch Intelligence Console
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
