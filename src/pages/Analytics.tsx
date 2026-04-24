import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  Target, 
  Users, 
  Heart, 
  Globe, 
  Zap,
  Download,
  Share2,
  Calendar,
  CloudLightning,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

const ImpactStat = ({ label, value, sub, icon: Icon, color }: { label: string, value: string, sub: string, icon: any, color: string }) => (
  <div className="glass-panel p-6 flex flex-col justify-between group">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
        <Icon size={24} />
      </div>
      <button 
        className="text-slate-300 hover:text-primary transition-colors p-2 rounded-lg"
        aria-label="View detailed metric"
      >
        <ArrowUpRight size={20} />
      </button>
    </div>
    <div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</div>
      <div className="text-3xl font-black text-slate-800 font-manrope mb-2 tracking-tight">{value}</div>
      <div className="text-[10px] font-bold text-green-500 flex items-center gap-1">
        <TrendingUp size={12} /> {sub}
      </div>
    </div>
  </div>
);

export default function Analytics() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 font-manrope tracking-tight uppercase italic underline decoration-primary/30 underline-offset-8">Social <span className="text-primary NOT-italic">Impact</span> Analytics</h1>
          <p className="text-slate-500 font-medium mt-4">Quantifying empathy and measuring altruistic reach across the SevaAI network.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            className="p-3 glass-panel border-white/60 hover:bg-white text-slate-600 transition-all active:scale-90"
            aria-label="Share analytics report"
          >
            <Share2 size={20} />
          </button>
          <button className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:translate-y-[-2px] transition-all">
            <Download size={18} /> Export Data
          </button>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ImpactStat label="Lives Impacted" value="1,242,091" sub="+12.4% this month" icon={Users} color="bg-primary" />
        <ImpactStat label="Resource Efficiency" value="94.2%" sub="+2.1% from SevaAI Optimization" icon={Zap} color="bg-secondary" />
        <ImpactStat label="Response Time" value="18.5m" sub="-5.2m avg via AI Dispatch" icon={CloudLightning} color="bg-blue-600" />
        <ImpactStat label="Social Trust Score" value="4.92/5" sub="+0.08 verified reliability" icon={Heart} color="bg-rose-500" />
      </div>

      {/* Detailed Graphs Area */}
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass-panel p-10 space-y-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-800 font-manrope">Distribution Reach</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Regional Breakdown - Live</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600">Weekly</button>
              <button className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-black">Monthly</button>
            </div>
          </div>

          <div className="h-80 flex items-end justify-between gap-6 px-4">
            {[60, 40, 90, 70, 50, 45, 95, 80, 55, 100, 30, 85].map((h, i) => (
              <div key={i} className="flex-1 group relative">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.05, duration: 1 }}
                  className={`w-full rounded-t-xl transition-all ${i === 9 ? 'bg-primary shadow-xl shadow-primary/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}
                />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                </div>
                {i === 9 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap">
                    Peak Reach
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-10 space-y-8 bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black font-manrope">Regional Spotlight</h3>
            <p className="text-blue-100/60 text-xs font-bold uppercase tracking-widest tracking-tighter">Southern District Peak Performance</p>
          </div>

          <div className="space-y-6">
            {[
              { label: 'Food Relief', p: 85, color: 'bg-white' },
              { label: 'Infrastructure', p: 42, color: 'bg-white/40' },
              { label: 'Education', p: 68, color: 'bg-white/70' }
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span>{item.label}</span>
                  <span>{item.p}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.p}%` }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Growth Target</div>
                <div className="text-xl font-black font-manrope">$2M Social Capital</div>
              </div>
            </div>
            <button className="w-full py-4 bg-white text-primary rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all">
              View Detailed Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row Activity Feed Style */}
      <div className="grid md:grid-cols-2 gap-10">
        <div className="glass-panel p-10 space-y-8">
          <div className="flex justify-between items-center font-manrope">
            <h3 className="text-2xl font-black text-slate-800">Community Sentiment</h3>
            <Activity className="text-primary" size={24} />
          </div>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group overflow-hidden">
            <div className="relative z-10 flex gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                <Heart size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 italic leading-relaxed mb-4">"The AI-prioritized resource allocation saved our local pantry during the supply chain disruption last week."</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div>
                    <div className="text-[10px] font-black text-slate-800 uppercase">Sector 4 Community Lead</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified 2h ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-10 space-y-8">
           <div className="flex justify-between items-center font-manrope">
            <h3 className="text-2xl font-black text-slate-800">Operational Goals</h3>
            <Globe className="text-secondary" size={24} />
          </div>
          <div className="space-y-4">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">NGO Connectivity</span>
              <span className="text-sm font-black text-slate-800">230/500 Org Targets</span>
            </div>
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Global Reach</span>
              <span className="text-sm font-black text-slate-800">12 Nations</span>
            </div>
            <button className="w-full pt-4 text-primary font-black text-xs uppercase tracking-[0.2em] hover:translate-x-1 transition-transform flex items-center justify-center gap-2">
              View Roadmap <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ size, className }: { size: number, className?: string }) {
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
