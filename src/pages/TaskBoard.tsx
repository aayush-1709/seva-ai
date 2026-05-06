import {
  ClipboardList,
  MapPin,
  Clock,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Zap,
  ShieldCheck,
  TrendingUp,
  Radio,
  RefreshCw,
  Loader2,
  Navigation,
  UserPlus,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { apiUrl } from '../lib/api';

type LatLng = { lat: number; lng: number };

type CivicReport = {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  location: LatLng;
  createdAt?: string | null;
  assignedVolunteerId?: string | null;
  assignedVolunteerName?: string | null;
  assignedDistanceKm?: number | null;
};

const STORAGE_VOLUNTEER_ID = 'sevaai_volunteer_id';
const STORAGE_VOLUNTEER_NAME = 'sevaai_volunteer_name';
const STORAGE_SHIFT_START = 'sevaai_shift_started_at';

type TabFilter = 'open' | 'assigned' | 'mine' | 'resolved' | 'all';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type SortMode = 'priority' | 'newest' | 'nearest';

function detailFromFastApi(body: string): string {
  try {
    const j = JSON.parse(body) as { detail?: unknown };
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((x) => (x && typeof x === 'object' && 'msg' in x ? String((x as { msg: unknown }).msg) : ''))
        .filter(Boolean)
        .join('; ');
    }
  } catch {
    /* raw */
  }
  return body.trim();
}

async function fetchReportsList(): Promise<CivicReport[]> {
  const res = await fetch(apiUrl('/reports'));
  const text = await res.text();
  if (!res.ok) throw new Error(detailFromFastApi(text) || `HTTP ${res.status}`);
  const data = text ? JSON.parse(text) : [];
  return Array.isArray(data) ? data : [];
}

function priorityRank(p: string): number {
  switch (String(p).toLowerCase()) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

function formatPriorityLabel(raw: string): string {
  const p = raw.toLowerCase();
  if (p === 'high') return 'High';
  if (p === 'medium') return 'Medium';
  return 'Low';
}

function priorityClass(raw: string): string {
  const p = raw.toLowerCase();
  if (p === 'high') return 'bg-red-100 text-red-700 ring-red-500/25';
  if (p === 'medium') return 'bg-amber-100 text-amber-800 ring-amber-500/25';
  return 'bg-slate-100 text-slate-600 ring-slate-500/25';
}

function relativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso.slice(0, 16);
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function distanceKmMe(a: LatLng, user: LatLng | null): number | null {
  if (!user) return null;
  const R = 6371;
  const dLat = ((a.lat - user.lat) * Math.PI) / 180;
  const dLng = ((a.lng - user.lng) * Math.PI) / 180;
  const lat1 = (user.lat * Math.PI) / 180;
  const lat2 = (a.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))) * 100) / 100;
}

function elapsedShiftLabel(startIso?: string): string {
  if (!startIso) return 'Not started';
  const t = Date.parse(startIso);
  if (Number.isNaN(t)) return 'Active';
  const ms = Date.now() - t;
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hrs < 1) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

function isOpenReport(r: CivicReport): boolean {
  const st = String(r.status).toLowerCase();
  const assigned = !!(r.assignedVolunteerId && String(r.assignedVolunteerId).trim());
  return !assigned && (st === 'pending' || !st);
}

export default function TaskBoard() {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabFilter>('open');
  const [prio, setPrio] = useState<PriorityFilter>('all');
  const [sort, setSort] = useState<SortMode>('priority');
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('');
  const [myVolunteerId, setMyVolunteerId] = useState('');
  const [myVolunteerName, setMyVolunteerName] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [shiftStart, setShiftStart] = useState<string | undefined>(() => {
    try {
      return sessionStorage.getItem(STORAGE_SHIFT_START) ?? undefined;
    } catch {
      return undefined;
    }
  });

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    try {
      const list = await fetchReportsList();
      setReports(list);
      if (!silent) setBanner(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Load failed';
      if (!silent) setBanner({ type: 'err', text: msg });
      setReports([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load({ silent: true }), 20000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    try {
      const id = localStorage.getItem(STORAGE_VOLUNTEER_ID) ?? '';
      const name = localStorage.getItem(STORAGE_VOLUNTEER_NAME) ?? '';
      setMyVolunteerId(id);
      setMyVolunteerName(name);
    } catch {
      /* */
    }

    let cancelled = false;
    if (!navigator.geolocation) {
      setGeoStatus('Browser geolocation not available');
      return () => undefined;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('Using your approximate location');
      },
      () => {
        if (cancelled) return;
        setGeoStatus('Could not obtain location — distance sort disabled until you enable it');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const briefing = useMemo(() => {
    const openReports = reports.filter(isOpenReport);
    const highs = openReports.filter((r) => r.priority?.toLowerCase() === 'high').length;
    const topCat =
      [...openReports].sort(
        (a, b) =>
          [...openReports].filter((x) => x.category === b.category).length -
          [...openReports].filter((x) => x.category === a.category).length
      )[0]?.category ?? 'general';
    if (openReports.length === 0) {
      return `No open tasks currently. Resolved ${reports.filter((r) => r.status?.toLowerCase() === 'resolved').length} in the backlog.`;
    }
    return `${openReports.length} open civic tasks. ${highs} high‑priority hotspot${highs === 1 ? '' : 's'}. Highest volume category today: ${topCat}.`;
  }, [reports]);

  const stats = useMemo(() => {
    const openReports = reports.filter(isOpenReport);
    const claimed = reports.filter(
      (r) => !!(r.assignedVolunteerId && String(r.assignedVolunteerId).trim()) && r.status?.toLowerCase() !== 'resolved'
    ).length;
    const mine = reports.filter((r) => r.assignedVolunteerId === myVolunteerId).length;
    const done = reports.filter((r) => r.status?.toLowerCase() === 'resolved').length;
    const impactXp = mine * 50 + done * 120;
    return { openReports: openReports.length, claimed, mine, done, impactXp };
  }, [reports, myVolunteerId]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...reports];

    if (prio !== 'all') {
      rows = rows.filter((r) => String(r.priority).toLowerCase() === prio);
    }

    rows = rows.filter((r) => {
      if (!q) return true;
      return (
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });

    switch (tab) {
      case 'open':
        rows = rows.filter(isOpenReport);
        break;
      case 'assigned':
        rows = rows.filter(
          (r) =>
            !!(r.assignedVolunteerId && String(r.assignedVolunteerId).trim()) &&
            String(r.status).toLowerCase() !== 'resolved'
        );
        break;
      case 'mine':
        rows = rows.filter(
          (r) =>
            r.assignedVolunteerId === myVolunteerId && String(r.status).toLowerCase() !== 'resolved'
        );
        break;
      case 'resolved':
        rows = rows.filter((r) => String(r.status).toLowerCase() === 'resolved');
        break;
      default:
        break;
    }

    if (nearMeOnly && userLoc) {
      rows = rows.filter((r) => {
        const d = distanceKmMe(r.location, userLoc);
        return d !== null && d <= 75;
      });
    }

    rows.sort((a, b) => {
      if (sort === 'newest') {
        const ta = Date.parse(String(a.createdAt ?? ''));
        const tb = Date.parse(String(b.createdAt ?? ''));
        return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
      }
      if (sort === 'nearest' && userLoc) {
        const da = distanceKmMe(a.location, userLoc) ?? 99999;
        const db = distanceKmMe(b.location, userLoc) ?? 99999;
        return da - db;
      }
      const pr = priorityRank(b.priority) - priorityRank(a.priority);
      if (pr !== 0) return pr;
      const ta = Date.parse(String(a.createdAt ?? ''));
      const tb = Date.parse(String(b.createdAt ?? ''));
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });

    return rows;
  }, [reports, prio, search, tab, myVolunteerId, nearMeOnly, userLoc, sort]);

  const toast = useCallback((type: 'ok' | 'err', text: string) => {
    setBanner({ type, text });
    window.setTimeout(() => setBanner((b) => (b?.text === text ? null : b)), 6000);
  }, []);

  const patchStatus = useCallback(async (reportId: string, status: string, verifier?: string) => {
    setActionId(reportId);
    try {
      const body: Record<string, string | undefined> = { status };
      if (verifier) body.volunteer_id = verifier;
      const res = await fetch(apiUrl(`/reports/${encodeURIComponent(reportId)}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(detailFromFastApi(text) || `HTTP ${res.status}`);
      await fetchReportsList().then(setReports);
      toast('ok', 'Task updated.');
    } catch (e) {
      toast('err', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setActionId(null);
    }
  }, [toast]);

  const assignReport = useCallback(async (reportId: string, volunteerId?: string) => {
    setActionId(reportId);
    try {
      const body: Record<string, string> = { report_id: reportId };
      if (volunteerId?.trim()) body.volunteer_id = volunteerId.trim();
      const res = await fetch(apiUrl('/reports/assign'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(detailFromFastApi(text) || `HTTP ${res.status}`);
      await fetchReportsList().then(setReports);
      toast('ok', volunteerId ? 'You claimed this task.' : 'Nearest volunteer dispatched.');
    } catch (e) {
      toast('err', e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setActionId(null);
    }
  }, [toast]);

  const beginShift = useCallback(() => {
    try {
      const iso = new Date().toISOString();
      sessionStorage.setItem(STORAGE_SHIFT_START, iso);
      setShiftStart(iso);
    } catch {
      setShiftStart(new Date().toISOString());
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
            <Radio size={12} className="shrink-0" />
            Live task center
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 font-manrope tracking-tight">
            Active duty board
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-xl">
            Real Firestore-backed civic reports: claim as a registered volunteer, dispatch the nearest match, and close the
            loop when field work is done.
          </p>
        </div>

        <div className="glass-panel p-4 flex flex-wrap items-center gap-4 bg-white border-white/60">
          <div className="text-center min-w-[4.5rem]">
            <div className="text-xl font-black text-slate-800">{stats.openReports}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Open</div>
          </div>
          <div className="h-10 w-px bg-slate-100 hidden sm:block" />
          <div className="text-center min-w-[4.5rem]">
            <div className="text-xl font-black text-primary">{stats.claimed}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Claimed</div>
          </div>
          <div className="h-10 w-px bg-slate-100 hidden sm:block" />
          <div className="text-center min-w-[4.5rem]">
            <div className="text-xl font-black text-emerald-600">{stats.mine}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mine</div>
          </div>
          <div className="h-10 w-px bg-slate-100 hidden sm:block" />
          <div className="text-center min-w-[4.5rem]">
            <div className="text-xl font-black text-slate-800">{stats.impactXp}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact XP</div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>
      </header>

      {banner && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
            banner.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {banner.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {banner.text}
        </div>
      )}

      {/* Profile strip */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
          <ShieldCheck size={18} className="text-emerald-600" />
          {myVolunteerId ? (
            <span>
              Volunteer:{' '}
              <span className="font-bold text-slate-900">{myVolunteerName || 'Registered'}</span>
              <code className="ml-2 text-xs bg-slate-100 px-1 rounded">
                {myVolunteerId.length > 22 ? `${myVolunteerId.slice(0, 20)}…` : myVolunteerId}
              </code>
            </span>
          ) : (
            <span className="text-slate-600 font-medium">
              No volunteer identity on device —{' '}
              <Link to="/community" className="text-primary font-bold underline-offset-4 hover:underline">
                register to claim tasks
              </Link>
              .
            </span>
          )}
        </div>
        {!shiftStart ? (
          <button
            type="button"
            onClick={beginShift}
            className="rounded-xl border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-black text-primary"
          >
            Start shift timer
          </button>
        ) : (
          <span className="text-xs font-bold text-slate-500">
            Shift: <span className="text-slate-800">{elapsedShiftLabel(shiftStart)}</span>
          </span>
        )}
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Navigation size={12} aria-hidden /> {geoStatus || 'Waiting for browser location…'}
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, category, or report id…"
            className="w-full bg-white border border-slate-200 rounded-[1.75rem] py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {(
            [
              ['open', 'Open'],
              ['assigned', 'Assigned'],
              ['mine', 'Mine'],
              ['resolved', 'Resolved'],
              ['all', 'All'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${
                tab === key
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={16} className="text-slate-400 xl:ml-1" aria-hidden />
          <select
            value={prio}
            onChange={(e) => setPrio(e.target.value as PriorityFilter)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide min-w-[8rem]"
          >
            <option value="all">Priority: all</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide min-w-[9rem]"
          >
            <option value="priority">Sort: urgency</option>
            <option value="newest">Sort: newest</option>
            <option value="nearest" disabled={!userLoc}>
              Sort: nearest
            </option>
          </select>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={nearMeOnly}
              onChange={(e) => setNearMeOnly(e.target.checked)}
              disabled={!userLoc}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            Near me (≤75 km)
          </label>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {loading && reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-sm font-bold">Loading live reports…</p>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 font-medium">
              No tasks match your filters. Try another tab or clear search.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredSorted.map((report) => {
                const st = String(report.status).toLowerCase();
                const open = isOpenReport(report);
                const mineAssigned = report.assignedVolunteerId === myVolunteerId && st !== 'resolved';
                const dist = distanceKmMe(report.location, userLoc);
                const busy = actionId === report.id;

                return (
                  <motion.article
                    key={report.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass-panel rounded-2xl border border-white/70 p-5 md:p-6 bg-white shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ring-1 ${priorityClass(report.priority)}`}
                          >
                            {formatPriorityLabel(report.priority)}
                          </span>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            {report.category}
                          </span>
                          {st === 'resolved' && (
                            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                              Resolved
                            </span>
                          )}
                          {st === 'in_progress' && mineAssigned && (
                            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              In progress
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg md:text-xl font-black text-slate-900 leading-snug line-clamp-3">
                          {report.description || '(No description)'}
                        </h2>
                        <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <ClipboardList size={14} aria-hidden />{' '}
                            <code className="text-[10px] bg-slate-100 px-1 rounded">{report.id}</code>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={14} aria-hidden /> {relativeTime(report.createdAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} aria-hidden />
                            {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                            {dist != null ? ` · ${dist} km away` : ''}
                          </span>
                        </div>
                        {(report.assignedVolunteerName || report.assignedVolunteerId) && st !== 'resolved' && (
                          <p className="text-xs text-emerald-800 font-semibold">
                            Assigned: {report.assignedVolunteerName || report.assignedVolunteerId}
                            {report.assignedDistanceKm != null
                              ? ` · ${Number(report.assignedDistanceKm).toFixed(2)} km`
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {busy && (
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-primary">
                          <Loader2 size={14} className="animate-spin" /> Working…
                        </span>
                      )}

                      {open && myVolunteerId && (
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={() => void assignReport(report.id, myVolunteerId)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
                        >
                          <UserPlus size={16} aria-hidden /> Claim task
                        </button>
                      )}

                      {open && !myVolunteerId && (
                        <Link
                          to="/community"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider"
                        >
                          Register to claim
                        </Link>
                      )}

                      {open && (
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={() => void assignReport(report.id)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs font-black uppercase tracking-wider hover:bg-slate-50 disabled:opacity-50"
                        >
                          <Target size={16} aria-hidden /> Dispatch nearest volunteer
                        </button>
                      )}

                      {mineAssigned && st !== 'in_progress' && st !== 'resolved' && (
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={() => void patchStatus(report.id, 'in_progress', myVolunteerId)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
                        >
                          Start work
                        </button>
                      )}

                      {mineAssigned && st !== 'resolved' && (
                        <button
                          type="button"
                          disabled={!!busy}
                          onClick={() => void patchStatus(report.id, 'resolved', myVolunteerId)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} aria-hidden /> Mark resolved
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <aside className="space-y-6">
          <div className="glass-panel p-6 bg-primary text-white rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-xl font-black font-manrope mb-4 flex items-center gap-2">
              <TrendingUp size={22} aria-hidden /> Live briefing
            </h3>
            <p className="text-sm text-blue-50/95 leading-relaxed border-l-4 border-white/30 pl-4 mb-6">
              {briefing}
            </p>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <MapPin size={18} aria-hidden />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-blue-200">Geo</div>
                  <div className="font-bold">{userLoc ? 'Location locked' : 'Waiting for GPS'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <Zap size={18} aria-hidden />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                    Rotation
                  </div>
                  <div className="font-bold">{filteredSorted.length} cards in view</div>
                </div>
              </div>
            </div>
          </div>

          <section className="glass-panel p-8 bg-secondary/5 border-secondary/20 rounded-2xl flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-secondary text-on-secondary rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 font-manrope italic">
                  Operational loop
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Register once, pull open tasks near you, and resolve them so the Impact Map clears heat over time.
                </p>
              </div>
            </div>
            <Link
              to="/map"
              className="w-full px-6 py-4 bg-secondary text-on-secondary rounded-[1.5rem] font-black text-center text-sm uppercase tracking-wide hover:shadow-xl transition-all"
            >
              Open impact console
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
