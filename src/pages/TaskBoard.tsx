import { 
  ClipboardList, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';

const tasks = [
  { id: 1, title: 'Food Packet Distribution', location: 'Northern Sector', category: 'Food', priority: 'High', time: 'Started 12m ago', volunteers: 4, needed: 10, status: 'Active' },
  { id: 2, title: 'Sanitation Leak Repair', location: 'Industrial Zone', category: 'Infrastructure', priority: 'Urgent', time: 'Reported 2h ago', volunteers: 1, needed: 3, status: 'Pending' },
  { id: 3, title: 'Temporary Shelter Setup', location: 'City Stadium', category: 'Shelter', priority: 'Critical', time: 'Ongoing', volunteers: 12, needed: 25, status: 'Active' },
  { id: 4, title: 'Educational Kit Delivery', location: 'Suburban East', category: 'Education', priority: 'Low', time: 'Tomorrow 9AM', volunteers: 0, needed: 5, status: 'Scheduled' },
  { id: 5, title: 'First Aid Support', location: 'Medical Camp Alpha', category: 'Health', priority: 'Urgent', time: 'ASAP', volunteers: 2, needed: 2, status: 'Full' },
];

const TaskCard: React.FC<{ task: any, onClaim: any }> = ({ task, onClaim }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-panel p-6 hover:bg-white transition-all group border-white/60"
  >
    <div className="flex justify-between items-start mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
            task.priority === 'Critical' ? 'bg-red-100 text-red-600' : 
            task.priority === 'Urgent' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {task.priority} Priority
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">· {task.category}</span>
        </div>
        <h3 className="text-xl font-black text-slate-800 font-manrope group-hover:text-primary transition-colors">{task.title}</h3>
      </div>
      <button 
        className="text-slate-300 hover:text-slate-600 p-2 rounded-lg transition-colors"
        aria-label="More task options"
      >
        <MoreVertical size={20} />
      </button>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="flex items-center gap-2 text-slate-500">
        <MapPin size={16} />
        <span className="text-xs font-bold">{task.location}</span>
      </div>
      <div className="flex items-center gap-2 text-slate-500">
        <Clock size={16} />
        <span className="text-xs font-bold">{task.time}</span>
      </div>
    </div>

    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-400">Volunteers Joined</span>
        <span className={task.volunteers >= task.needed ? 'text-green-500' : 'text-primary'}>{task.volunteers}/{task.needed}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(task.volunteers / task.needed) * 100}%` }}
          className={`h-full rounded-full ${task.volunteers >= task.needed ? 'bg-green-500' : 'bg-primary'}`}
        />
      </div>
    </div>

    <div className="flex gap-3">
      <button 
        disabled={task.status === 'Full'}
        onClick={() => onClaim(task.id)}
        className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
          task.status === 'Full' 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-slate-900 text-white hover:bg-primary hover:shadow-xl hover:shadow-primary/20 hover:translate-y-[-2px]'
        }`}
      >
        {task.status === 'Full' ? 'Unit Full' : 'Claim Task'}
      </button>
      <button 
        className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-50 hover:text-primary transition-all active:scale-95"
        aria-label="Message mission coordinator"
      >
        <MessageCircle size={20} />
      </button>
    </div>
  </motion.div>
);

export default function TaskBoard() {
  const [filter, setFilter] = useState('All');
  const [claimedTasks, setClaimedTasks] = useState<number[]>([]);

  const filteredTasks = tasks.filter(t => filter === 'All' || t.status === filter);

  const handleClaim = (id: number) => {
    setClaimedTasks([...claimedTasks, id]);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <Zap size={12} fill="currentColor" />
            12 New Tasks Nearby
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 font-manrope tracking-tight">Active Duty Board</h1>
          <p className="text-slate-500 font-medium mt-2 max-w-lg">Claim priority tasks and track your altruistic impact in real-time across your sector.</p>
        </div>

        <div className="glass-panel p-4 flex items-center gap-6 bg-white border-white/60">
          <div className="text-center">
            <div className="text-xl font-black text-slate-800">4</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Duties</div>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <div className="text-center">
            <div className="text-xl font-black text-primary">1.2k</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact XP</div>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
            <TrendingUp size={24} />
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by mission name or sector..."
            className="w-full bg-white border border-slate-100 rounded-[2rem] py-4 pl-12 pr-6 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300"
          />
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-100 rounded-[2.2rem] w-full md:w-auto">
          {['All', 'Active', 'Pending', 'Scheduled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 md:flex-none px-6 py-3 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-white shadow-xl text-primary' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button 
          className="p-4 bg-slate-900 text-white rounded-full hover:shadow-xl transition-all active:scale-95 focus:ring-4 focus:ring-primary/20"
          aria-label="Open advanced filters"
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClaim={handleClaim} />
          ))}
        </AnimatePresence>
        
        {/* Active Session Mini Hub */}
        <div className="lg:col-span-1 glass-panel p-8 bg-primary text-white space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="space-y-4">
            <h3 className="text-2xl font-black font-manrope">Live Briefing</h3>
            <p className="text-sm font-medium text-blue-100/80 leading-relaxed italic border-l-4 border-white/20 pl-4">
              "Priority shifted to Northern Water Main. 2 task units still open for immediate tactical support."
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-200">Identity Guard</div>
                <div className="text-sm font-bold">Profile Verified</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-200">Shift Status</div>
                <div className="text-sm font-bold">Active for 4h 12m</div>
              </div>
            </div>
          </div>

          <button className="w-full py-4 bg-white text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-xl">
            End Shift Session
          </button>
        </div>
      </div>

      {/* Bottom Incentive Banner */}
      <section className="glass-panel p-10 bg-secondary/5 border-secondary/20 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-secondary text-on-secondary rounded-[1.5rem] flex items-center justify-center shadow-xl">
            <TrendingUp size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 font-manrope italic">Impact Leaderboard</h3>
            <p className="text-slate-500 font-medium">You are in the top 5% of volunteers in your sector this week!</p>
          </div>
        </div>
        <button className="px-10 py-5 bg-secondary text-on-secondary rounded-[2.5rem] font-black text-lg uppercase tracking-tight hover:shadow-2xl hover:shadow-secondary/30 transition-all active:scale-95">
          View Achievements
        </button>
      </section>
    </div>
  );
}
