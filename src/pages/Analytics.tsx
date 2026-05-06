import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  Target,
  Users,
  Heart,
  Globe,
  Download,
  Share2,
  Activity,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { apiUrl } from '../lib/api';

type CivicReport = {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  location: { lat: number; lng: number };
  createdAt?: string | null;
  assignedVolunteerId?: string | null;
};

const CHART_DURATION = 0.85;
const CHART_STAGGER = 0.045;

const CATEGORY_BAR_COLORS = [
  'var(--color-primary, #00459a)',
  '#64748b',
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#14b8a6',
];

const PRIORITY_COLORS: Record<string, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#16a34a',
  other: '#64748b',
};

function formatCategoryLabel(raw: string): string {
  const s = raw.trim() || 'uncategorized';
  return s
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function toDayKey(createdAt: string | null | undefined): string | null {
  if (!createdAt || typeof createdAt !== 'string') return null;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

type CategoryRow = { name: string; count: number };
type PrioritySlice = { name: string; key: 'high' | 'medium' | 'low' | 'other'; value: number };

function CategoryBarChart({ data }: { data: CategoryRow[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="h-80 w-full flex flex-col">
      <div className="flex-1 flex items-end gap-1.5 sm:gap-2 px-1 min-h-[200px] border-b border-slate-200">
        {data.map((row, i) => (
          <div
            key={`${i}-${row.name}`}
            className="group flex-1 min-w-0 h-full flex flex-col justify-end items-center"
            title={`${row.name}: ${row.count} reports`}
          >
            <span className="text-[10px] font-black text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {row.count}
            </span>
            <motion.div
              className="w-full max-w-full rounded-t-lg origin-bottom"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                duration: CHART_DURATION,
                delay: 0.1 + i * CHART_STAGGER,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                transformOrigin: 'bottom',
                backgroundColor: CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length],
                height: `${Math.max(8, (row.count / max) * 100)}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 sm:gap-2 px-1 pt-3">
        {data.map((row) => (
          <div
            key={row.name}
            className="flex-1 min-w-0 text-[9px] sm:text-[10px] font-bold text-slate-500 text-center leading-tight line-clamp-2"
          >
            {row.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function donutSlicePath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  a0: number,
  a1: number
): string {
  const [x0o, y0o] = polar(cx, cy, rOuter, a0);
  const [x1o, y1o] = polar(cx, cy, rOuter, a1);
  const [x1i, y1i] = polar(cx, cy, rInner, a1);
  const [x0i, y0i] = polar(cx, cy, rInner, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return [
    'M',
    x0o,
    y0o,
    'A',
    rOuter,
    rOuter,
    0,
    large,
    1,
    x1o,
    y1o,
    'L',
    x1i,
    y1i,
    'A',
    rInner,
    rInner,
    0,
    large,
    0,
    x0i,
    y0i,
    'Z',
  ].join(' ');
}

function PriorityDonutChart({ slices }: { slices: PrioritySlice[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const cx = 110;
  const cy = 110;
  const rOuter = 88;
  const rInner = 52;
  let angle = -Math.PI / 2;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full h-64">
      <svg width="220" height="220" viewBox="0 0 220 220" className="shrink-0" aria-label="Priority pie chart">
        {slices.map((sl, i) => {
          const sweep = (sl.value / total) * Math.PI * 2;
          const a0 = angle;
          const a1 = angle + sweep;
          angle = a1;
          const d = donutSlicePath(cx, cy, rInner, rOuter, a0, a1);
          return (
            <motion.path
              key={sl.key}
              d={d}
              fill={PRIORITY_COLORS[sl.key] ?? PRIORITY_COLORS.other}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: CHART_DURATION, delay: 0.12 + i * CHART_STAGGER, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}
      </svg>
      <ul className="text-xs font-bold space-y-2 text-left w-full max-w-[12rem]">
        {slices.map((sl) => (
          <li key={sl.key} className="flex items-center justify-between gap-2 text-blue-100">
            <span className="inline-flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: PRIORITY_COLORS[sl.key] ?? PRIORITY_COLORS.other }}
              />
              {sl.name}
            </span>
            <span className="text-white tabular-nums">
              {sl.value} ({Math.round((sl.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TimelineLineChart({ data }: { data: { date: string; count: number }[] }) {
  const w = 720;
  const h = 280;
  const padL = 44;
  const padR = 16;
  const padT = 20;
  const padB = 52;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const maxY = Math.max(...data.map((d) => d.count), 1);
  const n = data.length;
  const points = data.map((row, i) => {
    const x = padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padT + innerH - (row.count / maxY) * innerH;
    return { x, y, row };
  });
  const pathD =
    points.length === 0
      ? ''
      : points.length === 1
        ? `M${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)} L${(points[0]!.x + 0.5).toFixed(1)} ${points[0]!.y.toFixed(1)}`
        : points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const tickEvery = n > 10 ? Math.ceil(n / 8) : 1;

  return (
    <div className="h-80 w-full overflow-x-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        className="min-w-[520px]"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={padL}
              x2={w - padR}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
          );
        })}
        {pathD ? (
          <motion.path
            d={pathD}
            fill="none"
            stroke="var(--color-primary, #00459a)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.6 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: CHART_DURATION + 0.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
        {points.map((p, i) => (
          <motion.circle
            key={p.row.date}
            cx={p.x}
            cy={p.y}
            r={5}
            fill="white"
            stroke="var(--color-primary, #00459a)"
            strokeWidth={2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35 + i * 0.03, duration: 0.25 }}
          >
            <title>{`${p.row.date}: ${p.row.count}`}</title>
          </motion.circle>
        ))}
        {points.map((p, i) =>
          i % tickEvery === 0 || i === n - 1 ? (
            <text
              key={`lbl-${p.row.date}`}
              x={p.x}
              y={h - 18}
              textAnchor="middle"
              className="fill-slate-500 text-[10px] font-bold"
            >
              {p.row.date.slice(5)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}

const ImpactStat = ({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: ElementType;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="glass-panel p-6 flex flex-col justify-between group"
  >
    <div className="flex justify-between items-start mb-4">
      <div
        className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-black/5`}
      >
        <Icon size={24} />
      </div>
      <button
        type="button"
        className="text-slate-300 hover:text-primary transition-colors p-2 rounded-lg"
        aria-label="View detailed metric"
      >
        <ArrowUpRight size={20} />
      </button>
    </div>
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
        {label}
      </div>
      <div className="text-3xl font-black text-slate-800 font-manrope mb-2 tracking-tight">{value}</div>
      <div className="text-[10px] font-bold text-green-600 flex items-center gap-1">
        <TrendingUp size={12} /> {sub}
      </div>
    </div>
  </motion.div>
);

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-72 flex flex-col items-center justify-center gap-3 text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-slate-50/80">
      <BarChart3 size={40} className="opacity-40" aria-hidden />
      <p className="text-sm font-bold text-center max-w-xs">{message}</p>
      <Link
        to="/report"
        className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
      >
        Submit a report
      </Link>
    </div>
  );
}

export default function Analytics() {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(apiUrl('/reports'));
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = text ? (JSON.parse(text) as CivicReport[]) : [];
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) {
      const key = (r.category ?? '').trim() || 'other';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([name, count]) => ({
        name: formatCategoryLabel(name),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  const timelineData = useMemo(() => {
    const map = new Map<string, number>();
    let undated = 0;
    for (const r of reports) {
      const day = toDayKey(r.createdAt);
      if (day) map.set(day, (map.get(day) ?? 0) + 1);
      else undated += 1;
    }
    const rows = [...map.entries()]
      .map(([date, count]) => ({ date, count, label: date.slice(5) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (undated > 0 && rows.length > 0) {
      rows.push({ date: '_undated', count: undated, label: `+${undated} undated` });
    }
    return rows;
  }, [reports]);

  const timelineDataChart = useMemo(() => {
    return timelineData.filter((d) => d.date !== '_undated');
  }, [timelineData]);

  const undatedCount = useMemo(() => {
    return reports.filter((r) => !toDayKey(r.createdAt)).length;
  }, [reports]);

  const priorityData = useMemo(() => {
    let low = 0;
    let medium = 0;
    let high = 0;
    let other = 0;
    for (const r of reports) {
      const p = (r.priority ?? '').toLowerCase();
      if (p === 'low') low += 1;
      else if (p === 'medium') medium += 1;
      else if (p === 'high') high += 1;
      else other += 1;
    }
    const rows: PrioritySlice[] = [
      { name: 'High', key: 'high', value: high },
      { name: 'Medium', key: 'medium', value: medium },
      { name: 'Low', key: 'low', value: low },
    ];
    if (other > 0) rows.push({ name: 'Other', key: 'other', value: other });
    return rows.filter((r) => r.value > 0);
  }, [reports]);

  const assignedCount = useMemo(
    () => reports.filter((r) => r.assignedVolunteerId && String(r.assignedVolunteerId).length > 0).length,
    [reports]
  );

  const topCategory = categoryData[0]?.name ?? '—';
  const highCount = reports.filter((r) => (r.priority ?? '').toLowerCase() === 'high').length;
  const highShare = reports.length === 0 ? 0 : Math.round((highCount / reports.length) * 100);

  const hasReports = reports.length > 0;
  const showTimeline = timelineDataChart.length > 0;
  const showPie = priorityData.length > 0;

  if (loading && reports.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="animate-spin text-primary" size={40} aria-hidden />
        <p className="text-slate-600 font-bold">Loading analytics from Firestore…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 font-manrope tracking-tight uppercase italic underline decoration-primary/30 underline-offset-8">
            Social <span className="text-primary NOT-italic">Impact</span> Analytics
          </h1>
          <p className="text-slate-500 font-medium mt-4">
            Live metrics from civic reports (
            <span className="font-mono text-xs">GET /reports</span> → Firestore).
          </p>
          {fetchError && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-2 font-bold">
              <AlertCircle size={18} aria-hidden />
              {fetchError}
              <button
                type="button"
                onClick={() => void fetchReports()}
                className="ml-2 underline text-primary font-black text-xs uppercase"
              >
                Retry
              </button>
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            className="p-3 glass-panel border-white/60 hover:bg-white text-slate-600 transition-all active:scale-90"
            aria-label="Share analytics report"
          >
            <Share2 size={20} />
          </button>
          <button
            type="button"
            className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:translate-y-[-2px] transition-all"
          >
            <Download size={18} /> Export Data
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ImpactStat
          label="Total reports"
          value={hasReports ? String(reports.length) : '0'}
          sub={hasReports ? 'In current dataset' : 'Submit reports to populate'}
          icon={BarChart3}
          color="bg-primary"
        />
        <ImpactStat
          label="Categories"
          value={hasReports ? String(categoryData.length) : '0'}
          sub={hasReports ? `Top: ${topCategory}` : '—'}
          icon={Globe}
          color="bg-secondary"
        />
        <ImpactStat
          label="High priority share"
          value={hasReports ? `${highShare}%` : '—'}
          sub={hasReports ? 'Of all priorities' : 'No data'}
          icon={Activity}
          color="bg-blue-600"
        />
        <ImpactStat
          label="Volunteer assignments"
          value={hasReports ? String(assignedCount) : '0'}
          sub={hasReports ? 'Reports with assignee' : '—'}
          icon={Users}
          color="bg-rose-500"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-2 glass-panel p-10 space-y-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-800 font-manrope">Issues by category</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Count per category — Firestore reports
              </p>
            </div>
          </div>
          {hasReports && categoryData.length > 0 ? (
            <CategoryBarChart data={categoryData} />
          ) : (
            <EmptyChartState message="No report data yet. Charts need at least one civic report in Firestore." />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="glass-panel p-10 space-y-8 bg-primary text-white overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

          <div className="space-y-2 relative z-[1]">
            <h3 className="text-2xl font-black font-manrope">Priority distribution</h3>
            <p className="text-blue-100/70 text-xs font-bold uppercase tracking-widest">
              Share of low / medium / high
            </p>
          </div>

          <div className="relative z-[1] h-64">
            {hasReports && showPie ? (
              <PriorityDonutChart slices={priorityData} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-blue-100/90 text-sm font-bold px-4 border border-white/20 rounded-2xl">
                <BarChart3 size={32} className="opacity-50 mb-2" aria-hidden />
                No priority data to chart yet.
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-white/10 relative z-[1]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest">
                  Leading category
                </div>
                <div className="text-xl font-black font-manrope">{hasReports ? topCategory : '—'}</div>
              </div>
            </div>
            <Link
              to="/map"
              className="w-full py-4 bg-white text-primary rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all block text-center"
            >
              View detailed heatmap
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="glass-panel p-10 space-y-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-800 font-manrope">Issues over time</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Daily report volume (createdAt)
              {undatedCount > 0 ? ` · ${undatedCount} without date` : ''}
            </p>
          </div>
        </div>
        {hasReports && showTimeline ? (
          <TimelineLineChart data={timelineDataChart} />
        ) : hasReports ? (
          <EmptyChartState message="No dated reports — add reports with createdAt (Firestore) to see the timeline." />
        ) : (
          <EmptyChartState message="No reports loaded. Connect the API and submit civic issues to see trends over time." />
        )}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel p-10 space-y-8"
        >
          <div className="flex justify-between items-center font-manrope">
            <h3 className="text-2xl font-black text-slate-800">Community pulse</h3>
            <Heart className="text-primary" size={24} aria-hidden />
          </div>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group overflow-hidden">
            <p className="text-sm font-bold text-slate-700 leading-relaxed">
              {hasReports
                ? `Dataset highlights ${reports.length} civic reports across ${categoryData.length} categories — use the heatmap to coordinate response.`
                : 'Once reports flow in from your community, this space summarizes engagement and urgency at a glance.'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-10 space-y-8"
        >
          <div className="flex justify-between items-center font-manrope">
            <h3 className="text-2xl font-black text-slate-800">Operational snapshot</h3>
            <Globe className="text-secondary" size={24} aria-hidden />
          </div>
          <div className="space-y-4">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Assignments</span>
              <span className="text-sm font-black text-slate-800">
                {assignedCount} / {reports.length || 0}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">High priority</span>
              <span className="text-sm font-black text-slate-800">
                {highCount} reports
              </span>
            </div>
            <Link
              to="/ngo"
              className="w-full pt-4 text-primary font-black text-xs uppercase tracking-[0.2em] hover:translate-x-1 transition-transform flex items-center justify-center gap-2"
            >
              View roadmap <ChevronRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
