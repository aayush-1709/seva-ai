import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  GoogleMap,
  HeatmapLayer,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Crosshair,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Users,
  Building2,
} from 'lucide-react';

import { getApiBaseUrl } from '../lib/api';

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
  assignedAt?: string | null;
};

type Issue = {
  id: string;
  description: string;
  image_url?: string | null;
  location: LatLng;
  category: string;
  urgency: string;
  summary: string;
  suggested_ngo: string;
};

type NGO = { name: string; category: string; contact: string };

type ServiceHealth = {
  gemini_key_loaded: boolean;
  gemini_strict_mode: boolean;
  maps_key_loaded: boolean;
  firebase_credentials_path_loaded: boolean;
};

const API_BASE_URL = getApiBaseUrl();
const GOOGLE_MAPS_API_KEY =
  (typeof import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'string'
    ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    : '') || '';

const MAP_LIBRARIES: ('visualization')[] = ['visualization'];

const DEFAULT_CENTER: LatLng = { lat: 28.6139, lng: 77.209 };

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All categories' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'lighting', label: 'Street lighting' },
  { value: 'water', label: 'Water & sanitation' },
  { value: 'safety', label: 'Public safety' },
  { value: 'env', label: 'Environment' },
  { value: 'other', label: 'Other' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

const mapContainerStyle: CSSProperties = {
  width: '100%',
  height: 'min(62vh, 560px)',
  borderRadius: '1rem',
};

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(fastApiErrorDetail(text) || `Request failed with status ${response.status}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

function fastApiErrorDetail(text: string): string {
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) {
      const parts = j.detail.map((x) =>
        x && typeof x === 'object' && 'msg' in x ? String((x as { msg: unknown }).msg) : ''
      );
      return parts.filter(Boolean).join('; ');
    }
  } catch {
    /* raw text */
  }
  return text.trim();
}

type AssignReportResult = {
  report_id: string;
  volunteer_id: string;
  volunteer_name: string;
  distance_km: number;
  status: string;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(fastApiErrorDetail(text) || `Request failed with status ${response.status}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

function priorityWeight(priority: string): number {
  const p = priority.toLowerCase();
  if (p === 'high') return 5;
  if (p === 'medium') return 3;
  if (p === 'low') return 1;
  return 2;
}

/** Haversine distance (km), aligned with backend MapsService. */
function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))) * 1000) / 1000;
}

export default function ImpactMap() {
  const [lat, setLat] = useState(String(DEFAULT_CENTER.lat));
  const [lng, setLng] = useState(String(DEFAULT_CENTER.lng));
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('Ready');
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'sevaai-google-maps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.id === selectedIssueId),
    [issues, selectedIssueId]
  );

  const selectedReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId),
    [reports, selectedReportId]
  );

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const catOk = categoryFilter === 'all' || r.category === categoryFilter;
      const priOk = priorityFilter === 'all' || r.priority.toLowerCase() === priorityFilter;
      return catOk && priOk;
    });
  }, [reports, categoryFilter, priorityFilter]);

  const heatmapData = useMemo((): google.maps.visualization.WeightedLocation[] => {
    if (!isLoaded || typeof google === 'undefined') return [];
    return filteredReports.map((r) => ({
      location: new google.maps.LatLng(r.location.lat, r.location.lng),
      weight: priorityWeight(r.priority),
    }));
  }, [isLoaded, filteredReports]);

  const mapCenter = useMemo(() => userLocation ?? DEFAULT_CENTER, [userLocation]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLat(String(loc.lat.toFixed(5)));
        setLng(String(loc.lng.toFixed(5)));
      },
      () => {
        /* keep default center */
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    );
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
    }
  }, [userLocation]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports`);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to load reports');
      }
      const data = (await res.json()) as CivicReport[];
      setReports(Array.isArray(data) ? data : []);
      setStatusText(`Loaded ${Array.isArray(data) ? data.length : 0} reports from Firestore.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setStatusText(`Reports fetch failed: ${msg}`);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const fetchReportsQuiet = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reports`);
      if (!res.ok) return;
      const data = (await res.json()) as CivicReport[];
      setReports(Array.isArray(data) ? data : []);
    } catch {
      /* keep last successful data */
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchReportsQuiet();
    }, 5000);
    return () => window.clearInterval(id);
  }, [fetchReportsQuiet]);

  const reportStats = useMemo(() => {
    const high = filteredReports.filter((r) => r.priority.toLowerCase() === 'high').length;
    const cats = new Set(filteredReports.map((r) => r.category));
    return {
      total: filteredReports.length,
      high,
      categories: cats.size,
    };
  }, [filteredReports]);

  const refreshDashboard = useCallback(async () => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      setStatusText('Latitude/Longitude must be valid numbers.');
      return;
    }

    setLoading(true);
    setStatusText('Refreshing data from backend...');
    try {
      const [healthData, ngoData, nearbyData] = await Promise.all([
        fetch(`${API_BASE_URL}/health/services`).then((res) => parseResponse<ServiceHealth>(res)),
        fetch(`${API_BASE_URL}/ngos`).then((res) => parseResponse<NGO[]>(res)),
        fetch(`${API_BASE_URL}/reports/nearby?lat=${parsedLat}&lng=${parsedLng}`).then((res) =>
          parseResponse<CivicReport[]>(res)
        ),
      ]);

      setServiceHealth(healthData);
      setNgos(ngoData);
      const mappedIssues: Issue[] = (nearbyData ?? []).map((report) => ({
        id: report.id,
        description: report.description,
        location: report.location,
        category: report.category,
        urgency: report.priority,
        summary: report.description,
        suggested_ngo: 'Community partners',
      }));
      setIssues(mappedIssues);
      setSelectedIssueId(mappedIssues[0]?.id ?? '');
      await fetchReports();
      setStatusText('Dashboard updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatusText(`Refresh failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, fetchReports]);

  const assignVolunteerToReport = useCallback(async () => {
    let reportId = selectedReportId.trim();
    const issue =
      selectedIssueId.trim() === ''
        ? undefined
        : issues.find((i) => i.id === selectedIssueId);

    if (!reportId && issue && reports.length > 0) {
      let best = reports[0]!;
      let bestD = distanceKm(issue.location, best.location);
      for (let i = 1; i < reports.length; i++) {
        const r = reports[i]!;
        const d = distanceKm(issue.location, r.location);
        if (d < bestD) {
          bestD = d;
          best = r;
        }
      }
      reportId = best.id;
      setSelectedReportId(best.id);
    }

    if (!reportId) {
      setStatusText(
        'Select a civic report on the map or list, or select a nearby issue (we use the closest report to that issue).'
      );
      return;
    }
    if (reports.length === 0) {
      setStatusText('No reports loaded — submit or refresh reports first.');
      return;
    }

    const base = API_BASE_URL;
    setLoading(true);
    setStatusText('Finding nearest volunteer…');
    try {
      await postJson<AssignReportResult>(`${base}/reports/assign`, {
        report_id: reportId,
      });
      await fetchReports();
      setStatusText('Volunteer assigned successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (/no volunteers available/i.test(message)) {
        setStatusText('No volunteers available. Register volunteers or check Firestore.');
      } else {
        setStatusText(`Assignment failed: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedReportId, selectedIssueId, issues, reports, fetchReports]);

  const reportMarkerIcon = useCallback(
    (highlight: boolean): google.maps.Symbol | undefined => {
      if (typeof google === 'undefined') return undefined;
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: highlight ? 11 : 8,
        fillColor: highlight ? '#b91c1c' : '#dc2626',
        fillOpacity: 0.95,
        strokeColor: '#ffffff',
        strokeWeight: highlight ? 3 : 2,
      };
    },
    []
  );

  const userMarkerIcon = useMemo((): google.maps.Symbol | undefined => {
    if (typeof google === 'undefined') return undefined;
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#2563eb',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
  }, [isLoaded]);

  const mapNotConfigured = !GOOGLE_MAPS_API_KEY.trim();

  const reportIdFromSelectedIssue = useMemo(() => {
    if (!selectedIssueId || reports.length === 0) return '';
    const issue = issues.find((i) => i.id === selectedIssueId);
    if (!issue) return '';
    let best = reports[0]!;
    let bestD = distanceKm(issue.location, best.location);
    for (let i = 1; i < reports.length; i++) {
      const r = reports[i]!;
      const d = distanceKm(issue.location, r.location);
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    return best.id;
  }, [selectedIssueId, issues, reports]);

  const canAssignVolunteer =
    reports.length > 0 && Boolean(selectedReportId || reportIdFromSelectedIssue);

  const issueToReportKm = useMemo(() => {
    const issue = issues.find((i) => i.id === selectedIssueId);
    if (!issue || !reportIdFromSelectedIssue) return null;
    const r = reports.find((x) => x.id === reportIdFromSelectedIssue);
    if (!r) return null;
    return distanceKm(issue.location, r.location);
  }, [selectedIssueId, issues, reportIdFromSelectedIssue, reports]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-6 space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Impact Operations Console</h1>
            <p className="text-sm text-slate-600 mt-1">
              Interactive map: your location, Firestore reports, density heatmap, filters, and backend
              tools.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <MapPin size={16} className="text-slate-500 shrink-0" />
              <input
                className="bg-transparent w-24 sm:w-28 text-sm font-semibold outline-none"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                aria-label="Latitude"
              />
              <input
                className="bg-transparent w-24 sm:w-28 text-sm font-semibold outline-none border-l border-slate-300 pl-2"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
                aria-label="Longitude"
              />
            </div>
            <button
              type="button"
              onClick={refreshDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin aria-hidden" /> : <RefreshCw size={16} aria-hidden />}
              Refresh
            </button>
          </div>
        </div>
        <p className="text-xs mt-4 text-slate-500">{statusText}</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-semibold">Reports (filtered)</p>
          <p className="text-2xl font-black text-slate-900">{reportStats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-semibold">High priority (filtered)</p>
          <p className="text-2xl font-black text-red-600">{reportStats.high}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-semibold">Categories in view</p>
          <p className="text-2xl font-black text-slate-900">{reportStats.categories}</p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 inline-flex items-center gap-2">
              <Crosshair size={18} aria-hidden /> Impact map
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Heatmap reflects filtered report density; markers update with category and priority filters.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Category
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 min-w-[160px]"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Priority
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 min-w-[140px]"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {mapNotConfigured && (
          <div
            className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            role="alert"
          >
            <AlertTriangle className="shrink-0" size={20} aria-hidden />
            <p>
              Set <code className="font-mono text-xs bg-amber-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in{' '}
              <code className="font-mono text-xs bg-amber-100 px-1 rounded">.env</code> and enable the{' '}
              <strong>Maps JavaScript API</strong> and <strong>Visualization</strong> library in Google Cloud.
            </p>
          </div>
        )}

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            Google Maps failed to load: {String(loadError.message ?? loadError)}
          </div>
        )}

        <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-100">
          {(!isLoaded || reportsLoading) && !mapNotConfigured && !loadError && (
            <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm">
              <Loader2 className="animate-spin text-primary" size={36} aria-hidden />
              <p className="text-sm font-bold text-slate-700">
                {!isLoaded ? 'Loading map…' : 'Loading reports…'}
              </p>
            </div>
          )}

          {isLoaded && !loadError && !mapNotConfigured && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={userLocation ? 13 : 11}
              onLoad={onMapLoad}
              onUnmount={onMapUnmount}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
                gestureHandling: 'greedy',
              }}
            >
              {userLocation && (
                <Marker
                  position={userLocation}
                  title="Your location"
                  zIndex={999}
                  icon={userMarkerIcon}
                />
              )}

              {filteredReports.map((r) => (
                <Marker
                  key={r.id}
                  position={r.location}
                  title={`${r.category} · ${r.priority}`}
                  icon={reportMarkerIcon(selectedReportId === r.id)}
                  onClick={() => setSelectedReportId(r.id)}
                  zIndex={selectedReportId === r.id ? 800 : 400}
                />
              ))}

              {heatmapData.length > 0 && (
                <HeatmapLayer
                  data={heatmapData}
                  options={{
                    radius: 48,
                    opacity: 0.85,
                    maxIntensity: 12,
                    gradient: [
                      'rgba(0, 255, 255, 0)',
                      'rgba(0, 255, 255, 1)',
                      'rgba(0, 191, 255, 1)',
                      'rgba(0, 127, 255, 1)',
                      'rgba(0, 63, 255, 1)',
                      'rgba(0, 0, 255, 1)',
                      'rgba(0, 0, 223, 1)',
                      'rgba(0, 0, 191, 1)',
                      'rgba(0, 0, 159, 1)',
                      'rgba(0, 0, 127, 1)',
                      'rgba(63, 0, 91, 1)',
                      'rgba(127, 0, 63, 1)',
                      'rgba(191, 0, 31, 1)',
                      'rgba(255, 0, 0, 1)',
                    ],
                  }}
                />
              )}
            </GoogleMap>
          )}

          {mapNotConfigured && (
            <div
              className="flex items-center justify-center text-slate-500 text-sm font-medium bg-slate-200/80"
              style={{ ...mapContainerStyle }}
            >
              Map preview unavailable — add a Maps API key.
            </div>
          )}
        </div>

        {selectedReport && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-black text-slate-900">Selected report</p>
            <p className="text-slate-600 mt-1 font-medium line-clamp-3">{selectedReport.description}</p>
            <p className="text-xs text-slate-500 mt-2">
              {selectedReport.category} · {selectedReport.priority} · {selectedReport.status}
            </p>
            {selectedReport.assignedVolunteerName ? (
              <p className="text-xs text-emerald-700 font-semibold mt-2">
                Volunteer: {selectedReport.assignedVolunteerName}
                {typeof selectedReport.assignedDistanceKm === 'number'
                  ? ` · ${selectedReport.assignedDistanceKm.toFixed(2)} km`
                  : ''}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 inline-flex items-center gap-2">
              <MapPin size={18} aria-hidden /> Reports (Firestore)
            </h2>
            <span className="text-xs text-slate-500">GET /reports</span>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center text-slate-500">
              No reports match filters. Submit a report or widen filters.
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {filteredReports.map((r) => {
                const isSelected = selectedReportId === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => {
                      setSelectedReportId(r.id);
                      if (mapRef.current) {
                        mapRef.current.panTo(r.location);
                        mapRef.current.setZoom(15);
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-2">{r.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {r.category} · {r.priority} · {r.status}
                        </p>
                        {r.assignedVolunteerName ? (
                          <p className="text-xs text-emerald-700 font-semibold mt-1">
                            {r.assignedVolunteerName}
                          </p>
                        ) : null}
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          ({r.location.lat.toFixed(4)}, {r.location.lng.toFixed(4)})
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0 max-w-[7rem] truncate">
                        {r.id}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-lg font-black text-slate-900 inline-flex items-center gap-2 mb-4">
              <Users size={18} aria-hidden /> Assignment
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">Assign to Firestore report (updates assignedVolunteerId):</p>
              {selectedReport ? (
                <>
                  <p className="font-semibold text-slate-900 line-clamp-2">{selectedReport.description}</p>
                  <p className="text-xs text-slate-500 font-mono break-all">{selectedReport.id}</p>
                </>
              ) : reportIdFromSelectedIssue && selectedIssue && issueToReportKm != null ? (
                <p className="text-slate-600">
                  No report selected — will use the closest report to the selected issue (
                  {issueToReportKm.toFixed(2)} km).
                </p>
              ) : (
                <p className="font-semibold text-slate-500">
                  Select a report on the map or list, or pick a nearby issue.
                </p>
              )}
              {selectedIssue && (
                <p className="text-xs text-slate-500">
                  Selected issue:{' '}
                  <span className="font-mono break-all">{selectedIssue.id}</span>
                </p>
              )}
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                Volunteers are loaded from the <span className="font-mono">volunteers</span> collection;
                nearest is by distance to the report location (preferred radius, then closest overall).
              </p>
            </div>
            <button
              type="button"
              onClick={assignVolunteerToReport}
              disabled={loading || !canAssignVolunteer}
              className="mt-4 w-full px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-60"
            >
              Assign nearest volunteer
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-lg font-black text-slate-900 inline-flex items-center gap-2 mb-4">
              <ClipboardList size={18} aria-hidden /> Nearby issues
            </h2>
            <div className="space-y-3 max-h-56 overflow-auto pr-1">
              {issues.length === 0 ? (
                <p className="text-sm text-slate-500">Refresh to load issues for the coordinates above.</p>
              ) : (
                issues.map((issue) => {
                  const isSelected = selectedIssueId === issue.id;
                  return (
                    <button
                      type="button"
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition ${
                        isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                      }`}
                    >
                      <p className="font-semibold text-slate-900 line-clamp-2">
                        {issue.summary || issue.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {issue.category} · {issue.urgency}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-lg font-black text-slate-900 inline-flex items-center gap-2 mb-4">
              <Building2 size={18} aria-hidden /> NGO directory
            </h2>
            <div className="space-y-2 max-h-40 overflow-auto pr-1">
              {ngos.map((ngo) => (
                <div key={ngo.name} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="font-semibold text-slate-900">{ngo.name}</p>
                  <p className="text-xs text-slate-600">
                    {ngo.category} · {ngo.contact}
                  </p>
                </div>
              ))}
              {ngos.length === 0 && <p className="text-sm text-slate-500">No NGO data loaded yet.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-black text-slate-900 mb-3">Service health</h2>
        {!serviceHealth ? (
          <p className="text-sm text-slate-500">Click refresh to fetch GET /health/services.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatusPill
              ok={serviceHealth.gemini_key_loaded}
              label="Gemini key"
              okText="Loaded"
              badText="Missing"
            />
            <StatusPill
              ok={serviceHealth.maps_key_loaded}
              label="Maps key (backend flag)"
              okText="Loaded"
              badText="Missing"
            />
            <StatusPill
              ok={serviceHealth.firebase_credentials_path_loaded}
              label="Firebase credentials"
              okText="Loaded"
              badText="Missing"
            />
            <StatusPill
              ok={!serviceHealth.gemini_strict_mode}
              label="Gemini mode"
              okText="Fallback enabled"
              badText="Strict"
            />
          </div>
        )}
      </section>
    </div>
  );
}

type StatusPillProps = {
  ok: boolean;
  label: string;
  okText: string;
  badText: string;
};

function StatusPill({ ok, label, okText, badText }: StatusPillProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-3">
      {ok ? (
        <CheckCircle2 size={18} className="text-emerald-600 aria-hidden" />
      ) : (
        <ShieldAlert size={18} className="text-amber-600 aria-hidden" />
      )}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm font-bold ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
          {ok ? okText : badText}
        </p>
      </div>
    </div>
  );
}
