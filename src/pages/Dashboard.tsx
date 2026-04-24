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
  BrainCircuit
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const ActionCard = ({ title, description, icon: Icon, color, to, delay }: { title: string, description: string, icon: any, color: string, to: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -5 }}
    className="group relative"
  >
    <Link to={to} className="block h-full">
      <div className="glass-card h-full p-6 flex flex-col border border-white/40 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
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

const StatCard = ({ label, value, icon: Icon, trend }: { label: string, value: string, icon: any, trend: string }) => (
  <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/60 flex items-center gap-4">
    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
      <Icon size={20} />
    </div>
    <div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</div>
      <div className="text-lg font-black text-slate-800 flex items-center gap-2">
        {value}
        <span className="text-[10px] text-green-500 bg-green-50 px-1.5 py-0.5 rounded font-bold">+{trend}</span>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
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
            AI-Engine Active: Analyzing 1.2k Local Reports
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
            Bridge the gap between immediate local needs and altruistic resources with our AI-prioritized empathy hub.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input 
                type="text" 
                placeholder="Ask Seva: 'Find nearest food shelter' or 'Report a leak'..."
                className="w-full bg-white text-slate-800 px-12 py-4 rounded-2xl font-medium focus:ring-4 focus:ring-blue-400/30 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <button className="bg-secondary text-on-secondary px-8 py-4 rounded-2xl font-black hover:bg-opacity-90 transition-all shadow-lg active:scale-95">
              Analyze
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Requests" value="1,284" icon={HandHelping} trend="12%" />
        <StatCard label="Verified Volunteers" value="8,492" icon={Users} trend="5%" />
        <StatCard label="NGO Partners" value="230" icon={Building2} trend="2%" />
        <StatCard label="Resolved Issues" value="15.8k" icon={ShieldAlert} trend="18%" />
      </div>

      {/* Action Grid */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 font-manrope">Core Services</h2>
            <p className="text-slate-500 font-medium">Select a category to begin supporting your community</p>
          </div>
          <button className="text-primary font-bold flex items-center gap-1 hover:underline">
            View All Services <ArrowUpRight size={18} />
          </button>
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

      {/* Featured Insights */}
      <section className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-slate-800 font-manrope">Real-time Impact</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">Live Analytics</span>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85, 60, 100].map((h, i) => (
              <div key={i} className="group relative flex-1">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.05, duration: 1 }}
                  className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-lg"
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {h}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
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
                "Resource distribution in Northern Sector is 15% below optimal. Diverting 5 volunteer units would stabilize response time."
              </p>
            </div>
            
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="text-blue-200" size={20} />
                <span className="font-bold text-sm">Community Pulse</span>
              </div>
              <p className="text-sm text-blue-50 leading-relaxed">
                "Sentiment regarding recent leak repairs is positive. 50+ members expressed gratitude."
              </p>
            </div>
            
            <button className="w-full py-4 bg-white text-primary rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all">
              Launch Intelligence Console
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
