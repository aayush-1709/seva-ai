import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Settings as SettingsIcon,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Server,
  Cpu,
  Copy,
  MapPin,
  ClipboardList,
  FileWarning,
  HeartHandshake,
} from 'lucide-react';

import { apiUrl, getApiBaseUrl } from '../lib/api';

type ServiceHealth = {
  gemini_key_loaded: boolean;
  gemini_strict_mode: boolean;
  maps_key_loaded: boolean;
  firebase_credentials_path_loaded: boolean;
};

export default function Settings() {
  const [ping, setPing] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const [services, setServices] = useState<ServiceHealth | null>(null);
  const [servicesErr, setServicesErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [volunteerId, setVolunteerId] = useState('');
  const [volunteerName, setVolunteerName] = useState('');

  const probe = useCallback(async () => {
    setPing('loading');
    setServices(null);
    setServicesErr(null);
    try {
      const [healthRes, svcRes] = await Promise.all([
        fetch(apiUrl('/health')),
        fetch(apiUrl('/health/services')),
      ]);
      const healthTxt = await healthRes.text().catch(() => '');
      const svcTxt = await svcRes.text().catch(() => '');
      if (!healthRes.ok) throw new Error(healthTxt || `Health HTTP ${healthRes.status}`);
      setPing('ok');

      if (svcRes.ok && svcTxt) {
        try {
          setServices(JSON.parse(svcTxt) as ServiceHealth);
        } catch {
          setServices(null);
          setServicesErr('Could not parse services health JSON.');
        }
      } else {
        setServices(null);
        setServicesErr(svcTxt || `Services HTTP ${svcRes.status}`);
      }
    } catch (e) {
      setPing('fail');
      setServices(null);
      setServicesErr(e instanceof Error ? e.message : 'Ping failed.');
    }
  }, []);

  useEffect(() => {
    void probe();
    try {
      setVolunteerId(localStorage.getItem('sevaai_volunteer_id') ?? '');
      setVolunteerName(localStorage.getItem('sevaai_volunteer_name') ?? '');
    } catch {
      /* */
    }
  }, [probe]);

  const apiBase = getApiBaseUrl();

  const copyApi = async () => {
    try {
      await navigator.clipboard.writeText(apiBase);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* */
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-3 bg-white/80 backdrop-blur shadow-sm rounded-2xl text-slate-600 hover:text-primary transition-all focus-visible:ring-2 focus-visible:ring-primary"
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
            <p className="text-slate-500 text-sm font-medium">
              Connection diagnostics and shortcuts for local development.
            </p>
          </div>
        </div>
      </div>

      <section className="glass-panel rounded-2xl border border-white/80 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 font-manrope">
            <Server size={20} className="text-primary" aria-hidden />
            Backend API
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void probe()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:shadow-lg transition-all"
            >
              {ping === 'loading' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Checking…
                </>
              ) : (
                <>
                  Recheck connection
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => void copyApi()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm font-bold hover:bg-slate-50"
            >
              <Copy size={16} aria-hidden /> {copied ? 'Copied' : 'Copy base URL'}
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900 text-slate-100 px-4 py-3 font-mono text-sm break-all">
          {apiBase}
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold">
          {ping === 'loading' && (
            <>
              <Loader2 size={18} className="animate-spin text-primary" aria-hidden />
              Testing <code className="text-xs px-1">/health</code> …
            </>
          )}
          {ping === 'ok' && (
            <>
              <CheckCircle2 size={18} className="text-emerald-600" aria-hidden /> API reachable
            </>
          )}
          {ping === 'fail' && (
            <>
              <XCircle size={18} className="text-red-600" aria-hidden /> Offline or wrong URL —
              start uvicorn and set <code className="text-xs">VITE_API_BASE_URL</code> in{' '}
              <code className="text-xs">.env</code>.
            </>
          )}
          {ping === 'idle' && <span className="text-slate-500">Idle</span>}
        </div>
        {servicesErr && ping !== 'loading' ? (
          <p className="text-sm text-red-700 font-medium">{servicesErr}</p>
        ) : null}

        {services && (
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <ServiceRow
              ok={services.gemini_key_loaded}
              label="Gemini API key"
              good="Configured"
              bad="Missing"
            />
            <ServiceRow
              ok={services.firebase_credentials_path_loaded}
              label="Firebase credentials path"
              good="Configured"
              bad="Missing"
            />
            <ServiceRow
              ok={services.maps_key_loaded}
              label="Maps key (backend)"
              good="Set"
              bad="Unset"
            />
            <ServiceRow
              ok={!services.gemini_strict_mode}
              label="Gemini strict mode"
              good="Allows fallbacks when needed"
              bad="Strict — refine may hard-fail"
            />
          </div>
        )}
      </section>

      <section className="glass-panel rounded-2xl border border-white/80 p-6 space-y-3">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 font-manrope">
          <HeartHandshake size={20} className="text-secondary" aria-hidden />
          Volunteer on this device
        </h2>
        {volunteerId ? (
          <dl className="text-sm space-y-2 font-medium">
            <div className="flex flex-col gap-1">
              <dt className="text-slate-400 text-xs uppercase font-bold tracking-wider">Name</dt>
              <dd className="text-slate-900">{volunteerName || '—'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                Volunteer ID
              </dt>
              <dd className="font-mono text-xs break-all text-slate-800">{volunteerId}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            No volunteer session stored.&nbsp;
            <Link className="text-primary font-black underline underline-offset-2" to="/community">
              Register
            </Link>
            &nbsp;to claim tasks on the&nbsp;
            <Link className="text-primary font-black underline underline-offset-2" to="/tasks">
              Task Center
            </Link>
            .
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <QuickLinkCard
          to="/report"
          icon={FileWarning}
          title="Submit report"
          desc="Citizen intake with AI refine."
        />
        <QuickLinkCard
          to="/map"
          icon={MapPin}
          title="Impact map"
          desc="Assignments and heatmaps."
        />
        <QuickLinkCard
          to="/tasks"
          icon={ClipboardList}
          title="Task center"
          desc="Claim and resolve live reports."
        />
        <QuickLinkCard to="/insights" icon={Cpu} title="Insights" desc="Charts from /reports." />
      </section>
    </div>
  );
}

function ServiceRow({
  ok,
  label,
  good,
  bad,
}: {
  ok: boolean;
  label: string;
  good: string;
  bad: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-3">
      {ok ? (
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" aria-hidden />
      ) : (
        <XCircle size={18} className="text-amber-600 shrink-0" aria-hidden />
      )}
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
        <div className={`text-sm font-bold ${ok ? 'text-emerald-800' : 'text-amber-800'}`}>
          {ok ? good : bad}
        </div>
      </div>
    </div>
  );
}

function QuickLinkCard({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="glass-panel rounded-2xl border border-white/70 p-5 flex gap-4 items-start hover:border-primary/30 hover:shadow-lg transition-all group focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
        <Icon size={22} />
      </div>
      <div>
        <div className="font-black text-slate-900">{title}</div>
        <p className="text-sm text-slate-500 mt-1 font-medium leading-snug">{desc}</p>
      </div>
    </Link>
  );
}
