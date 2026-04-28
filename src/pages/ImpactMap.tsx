import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Users,
  Building2,
} from 'lucide-react';

type ImportMetaEnvLike = {
  VITE_API_BASE_URL?: string;
};

type Location = {
  lat: number;
  lng: number;
};

type Issue = {
  id: string;
  description: string;
  image_url?: string | null;
  location: Location;
  category: string;
  urgency: string;
  summary: string;
  suggested_ngo: string;
};

type NGO = {
  name: string;
  category: string;
  contact: string;
};

type ServiceHealth = {
  gemini_key_loaded: boolean;
  gemini_strict_mode: boolean;
  maps_key_loaded: boolean;
  firebase_credentials_path_loaded: boolean;
};

const API_BASE_URL =
  ((import.meta as ImportMeta & { env?: ImportMetaEnvLike }).env?.VITE_API_BASE_URL as string | undefined) ??
  'http://127.0.0.1:8000';

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export default function ImpactMap() {
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('Ready');
  const [loading, setLoading] = useState(false);

  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.id === selectedIssueId),
    [issues, selectedIssueId]
  );

  const stats = useMemo(() => {
    const criticalCount = issues.filter((issue) =>
      issue.urgency.toLowerCase().includes('high') || issue.urgency.toLowerCase().includes('critical')
    ).length;

    const categories = new Set(issues.map((issue) => issue.category.toLowerCase()));
    return {
      totalIssues: issues.length,
      criticalCount,
      categoryCount: categories.size,
      ngoCount: ngos.length,
    };
  }, [issues, ngos]);

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
        fetch(`${API_BASE_URL}/issues/nearby?lat=${parsedLat}&lng=${parsedLng}`).then((res) =>
          parseResponse<{ issues: Issue[] }>(res)
        ),
      ]);

      setServiceHealth(healthData);
      setNgos(ngoData);
      setIssues(nearbyData.issues ?? []);
      setSelectedIssueId(nearbyData.issues?.[0]?.id ?? '');
      setStatusText('Dashboard updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatusText(`Refresh failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  const assignIssue = useCallback(async () => {
    if (!selectedIssueId) {
      setStatusText('Select an issue first to assign.');
      return;
    }

    setLoading(true);
    setStatusText(`Assigning volunteer to ${selectedIssueId}...`);
    try {
      const result = await fetch(`${API_BASE_URL}/tasks/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: selectedIssueId }),
      }).then((res) => parseResponse<{ volunteer_name: string; distance_km: number }>(res));

      setStatusText(
        `Assigned to ${result.volunteer_name} (${result.distance_km.toFixed(2)} km away).`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatusText(`Assignment failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedIssueId]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-6 space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Impact Operations Console</h1>
            <p className="text-sm text-slate-600 mt-1">
              Live backend-connected view for service health, nearby issues, NGOs, and task assignment.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <MapPin size={16} className="text-slate-500" />
              <input
                className="bg-transparent w-28 text-sm font-semibold outline-none"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
              />
              <input
                className="bg-transparent w-28 text-sm font-semibold outline-none border-l border-slate-300 pl-2"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
              />
            </div>
            <button
              onClick={refreshDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </div>
        <p className="text-xs mt-4 text-slate-500">{statusText}</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-semibold">Nearby Issues</p>
          <p className="text-2xl font-black text-slate-900">{stats.totalIssues}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-semibold">Critical/Urgent</p>
          <p className="text-2xl font-black text-red-600">{stats.criticalCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-semibold">Issue Categories</p>
          <p className="text-2xl font-black text-slate-900">{stats.categoryCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-semibold">Available NGOs</p>
          <p className="text-2xl font-black text-slate-900">{stats.ngoCount}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 inline-flex items-center gap-2">
              <Crosshair size={18} /> Nearby Issues Feed
            </h2>
            <span className="text-xs text-slate-500">Source: `GET /issues/nearby`</span>
          </div>

          {issues.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center text-slate-500">
              No issues found for this location. Submit a report first, then refresh.
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {issues.map((issue) => {
                const isSelected = selectedIssueId === issue.id;
                return (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`w-full text-left p-4 rounded-xl border transition ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{issue.summary || issue.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {issue.category} · urgency: {issue.urgency}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          ({issue.location.lat.toFixed(4)}, {issue.location.lng.toFixed(4)})
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                        {issue.id}
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
              <Users size={18} /> Assignment
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">Selected Issue:</p>
              <p className="font-semibold text-slate-900 break-all">
                {selectedIssue ? selectedIssue.id : 'None selected'}
              </p>
              {selectedIssue && (
                <p className="text-xs text-slate-500">
                  Suggested NGO: {selectedIssue.suggested_ngo}
                </p>
              )}
            </div>
            <button
              onClick={assignIssue}
              disabled={loading || !selectedIssue}
              className="mt-4 w-full px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-60"
            >
              Assign Nearest Volunteer
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-lg font-black text-slate-900 inline-flex items-center gap-2 mb-4">
              <Building2 size={18} /> NGO Directory
            </h2>
            <div className="space-y-2 max-h-56 overflow-auto pr-1">
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
        <h2 className="text-lg font-black text-slate-900 mb-3">Service Health</h2>
        {!serviceHealth ? (
          <p className="text-sm text-slate-500">
            Click refresh to fetch `GET /health/services`.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatusPill
              ok={serviceHealth.gemini_key_loaded}
              label="Gemini Key"
              okText="Loaded"
              badText="Missing"
            />
            <StatusPill
              ok={serviceHealth.maps_key_loaded}
              label="Maps Key"
              okText="Loaded"
              badText="Missing"
            />
            <StatusPill
              ok={serviceHealth.firebase_credentials_path_loaded}
              label="Firebase Credentials"
              okText="Loaded"
              badText="Missing"
            />
            <StatusPill
              ok={!serviceHealth.gemini_strict_mode}
              label="Gemini Mode"
              okText="Fallback Enabled"
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
        <CheckCircle2 size={18} className="text-emerald-600" />
      ) : (
        <ShieldAlert size={18} className="text-amber-600" />
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
