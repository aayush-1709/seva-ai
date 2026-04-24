import { 
  Building2, 
  History, 
  Users, 
  Coins, 
  TrendingUp, 
  BarChart3, 
  ChevronRight, 
  PlusCircle, 
  MoreHorizontal,
  LayoutGrid,
  List,
  Target,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

const activeProjects = [
  { id: 1, name: 'Mumbai Flood Relief', status: 'In Progress', progress: 65, fundRaised: '$120k', target: '$200k', volunteers: 42 },
  { id: 2, name: 'Rural Education Initiative', status: 'Starting', progress: 12, fundRaised: '$15k', target: '$100k', volunteers: 15 },
  { id: 3, name: 'Tech for Villages', status: 'Completed', progress: 100, fundRaised: '$45k', target: '$45k', volunteers: 28 },
];

const StatBox = ({ label, value, trend, icon: Icon }: { label: string, value: string, trend: string, icon: any }) => (
  <div className="glass-panel p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
        <Icon size={24} />
      </div>
      <div className="flex items-center text-green-500 font-bold text-xs bg-green-50 px-2 py-1 rounded-lg">
        <TrendingUp size={12} className="mr-1" /> {trend}
      </div>
    </div>
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</div>
      <div className="text-3xl font-black text-slate-800 font-manrope">{value}</div>
    </div>
  </div>
);

export default function NGODashboard() {
  const [viewType, setViewType] = useState('grid');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-slate-800 font-manrope tracking-tight">Organization Console</h1>
            <ShieldCheck className="text-primary" size={28} />
          </div>
          <p className="text-slate-500 font-medium max-w-lg">
            Manage your global impact, coordinate field teams, and track institutional funding through SevaAI's trusted network.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex-1 md:flex-none px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-white hover:shadow-lg transition-all flex items-center justify-center gap-2">
            Export Audit
          </button>
          <button className="flex-1 md:flex-none px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm hover:translate-y-[-2px] hover:shadow-xl transition-all shadow-primary/20 flex items-center justify-center gap-2">
            <PlusCircle size={18} /> New Campaign
          </button>
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox label="Total Beneficiaries" value="1.2M+" trend="24%" icon={Users} />
        <StatBox label="Total Funding" value="$8.42M" trend="12%" icon={Coins} />
        <StatBox label="Active Deployments" value="842" trend="5%" icon={Target} />
        <StatBox label="Network Trust Level" value="98.2%" trend="1.2%" icon={ShieldCheck} />
      </div>

      {/* Projects Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-800 font-manrope">Active Strategic Campaigns</h2>
            <p className="text-slate-500 font-medium">Monitoring real-time progress and fund allocation</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewType('grid')}
              className={`p-2.5 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white shadow-md text-primary' : 'text-slate-400'}`}
              aria-label="Switch to grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewType('list')}
              className={`p-2.5 rounded-lg transition-all ${viewType === 'list' ? 'bg-white shadow-md text-primary' : 'text-slate-400'}`}
              aria-label="Switch to list view"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className={`grid gap-6 ${viewType === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {activeProjects.map((project) => (
            <motion.div
              layout
              key={project.id}
              className="glass-panel p-8 space-y-6 border-white/60 hover:bg-white transition-all group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-800 font-manrope mb-1">{project.name}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                    project.status === 'Completed' ? 'bg-green-100 text-green-600' : 
                    project.status === 'Starting' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <button 
                  className="p-2.5 text-slate-300 hover:text-slate-600 transition-colors"
                  aria-label="Campaign options"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fundraised</div>
                  <div className="text-lg font-black text-slate-800">{project.fundRaised}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</div>
                  <div className="text-lg font-black text-slate-500">{project.target}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i + project.id}`} alt="volunteer" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-black">
                    +{project.volunteers - 4}
                  </div>
                </div>
                <button className="text-primary font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Project Details <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Side-by-side: Activity & Insights */}
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass-panel p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-800 font-manrope">Verification History</h3>
            <button className="text-xs font-bold text-primary flex items-center gap-1">Full Ledger <ArrowUpRight size={14} /></button>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <History size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-800">Resource Dispatch - Sector 4A</div>
                  <div className="text-xs text-slate-500 font-medium">Successfully delivered 500kg grain to local hub.</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-green-500">+$2,400</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Confirmed</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-8 bg-zinc-900 border-zinc-800 text-white flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest mb-6">
              <BarChart3 size={12} className="text-primary" />
              Strategic Insight
            </div>
            <h4 className="text-2xl font-black font-manrope mb-4 leading-tight">Focus on Northern Infrastructure</h4>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium mb-8 italic">
              "AI identifies a 110% increase in water scarcity reports in Sector 7. Recommend diverting 12% of relief funds for immediate tanker deployment."
            </p>
          </div>

          <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all shadow-xl shadow-primary/20">
            Execute Strategy
          </button>
        </div>
      </div>
    </div>
  );
}
