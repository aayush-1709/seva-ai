import { 
  Heart, 
  Users, 
  MapPin, 
  Clock, 
  Briefcase, 
  ShieldCheck, 
  Star, 
  Zap,
  Coffee,
  Truck,
  Stethoscope,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const volunteerRoles = [
  { id: 'delivery', name: 'Logistics & Delivery', icon: Truck, color: 'bg-blue-500', desc: 'Deliver food and medical supplies to those in need.' },
  { id: 'medical', name: 'Medical Help', icon: Stethoscope, color: 'bg-red-500', desc: 'Provide professional or basic first aid assistance.' },
  { id: 'hospitality', name: 'Shelter Hub', icon: BedIcon, color: 'bg-teal-500', desc: 'Help manage local temporary housing or shelters.' },
  { id: 'admin', name: 'Virtual Support', icon: Briefcase, color: 'bg-purple-500', desc: 'Manage digital reports and coordinate field teams.' },
  { id: 'manual', name: 'General Labor', icon: Zap, color: 'bg-orange-500', desc: 'Hard labor, debris cleanup, and physical setup.' },
  { id: 'social', name: 'Counseling', icon: Coffee, color: 'bg-rose-500', desc: 'Provide emotional support and mental health aid.' },
];

function BedIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  );
}

export default function Volunteer() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [distance, setDistance] = useState(5);
  const [isRegistered, setIsRegistered] = useState(false);

  if (isRegistered) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md w-full glass-panel p-10 text-center space-y-8"
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/30">
              <ShieldCheck size={56} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Star size={16} fill="currentColor" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-800 font-manrope">Welcome, Hero!</h2>
            <p className="text-slate-600 font-medium">
              Your volunteer profile is being analyzed by SevaAI. We will notify you of high-priority tasks in your area within <span className="text-primary font-bold">1-2 hours</span>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-6">
            <div className="text-center">
              <div className="text-2xl font-black text-primary">0</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks Done</div>
            </div>
            <div className="text-center border-x border-slate-100">
              <div className="text-2xl font-black text-primary">LVL 1</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary">0%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trust Rating</div>
            </div>
          </div>

          <Link to="/tasks" className="block w-full py-4 bg-primary text-white rounded-2xl font-black transition-all hover:translate-y-[-2px] hover:shadow-xl active:scale-95">
            View Live Tasks
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {/* Hero Header */}
      <section className="relative p-10 md:p-16 rounded-[3rem] bg-slate-900 overflow-hidden text-center text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]" />
          <div className="grid grid-cols-6 gap-8 opacity-10 transform -rotate-12 translate-y-12 shrink-0">
            {Array.from({ length: 18 }).map((_, i) => (
              <Users key={i} size={48} />
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-widest mb-6"
          >
            <Heart size={14} className="text-red-400" fill="currentColor" />
            Empower your community
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-white font-manrope leading-tight mb-6">
            Join the <span className="text-primary italic">Altruistic</span> Network
          </h1>
          <p className="text-lg text-slate-300 font-medium leading-relaxed">
            SevaAI connects your unique skills with real-time local needs. Turn your free time into measurable social impact.
          </p>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          {/* Role Selection */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800 font-manrope">Choose Your Path</h3>
              <span className="text-sm font-bold text-slate-400">Step 1 of 3</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {volunteerRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex items-start gap-4 text-left group overflow-hidden relative ${
                    selectedRole === role.id 
                      ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' 
                      : 'border-slate-100 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${role.color} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <role.icon size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 mb-1 font-manrope">{role.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                  </div>
                  {selectedRole === role.id && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in">
                      <ShieldCheck size={14} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Availability & Skills */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-800 font-manrope flex items-center gap-3">
                <Clock size={24} className="text-primary" />
                Availability
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['Mornings', 'Afternoons', 'Evenings', 'Weekends', 'On-Call'].map((slot) => (
                  <label key={slot} className="flex items-center gap-3 p-4 glass-panel border-white cursor-pointer hover:bg-white transition-all group">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-primary transition-colors">{slot}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-800 font-manrope flex items-center gap-3">
                <MapPin size={24} className="text-primary" />
                Radius
              </h3>
              <div className="glass-panel p-8 space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-black text-slate-800">Support Range</span>
                  <span className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-black">{distance} km</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={distance}
                  onChange={(e) => setDistance(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase">
                  <span>Immediate Neighborhood</span>
                  <span>District Level</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Identity/Trust Card */}
          <div className="glass-panel p-8 space-y-6 bg-secondary/5 border-secondary/20">
            <h3 className="text-xl font-black text-slate-800 font-manrope flex items-center gap-2">
              <ShieldCheck size={24} className="text-secondary" />
              Trust Score
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              New volunteers undergo a background check. Verified users receive priority tasks and higher impact ratings.
            </p>
            <button className="w-full py-4 bg-secondary text-on-secondary rounded-2xl font-black text-sm hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
              Link Identity (Aadhar/PAN)
              <Info size={16} />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="glass-panel p-8 space-y-8">
            <h3 className="text-xl font-black text-slate-800 font-manrope border-b border-slate-100 pb-4 uppercase italic">Live Network</h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Zap size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-800">12 High Priority Tasks</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">In your range</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-800">42 Other Volunteers</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active nearby</div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => setIsRegistered(true)}
                disabled={!selectedRole}
                className="w-full py-5 bg-primary text-white rounded-[2.5rem] font-black text-xl uppercase tracking-tighter shadow-2xl shadow-primary/20 hover:translate-y-[-2px] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                Become a SevaHero
                <motion.span 
                  animate={{ scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block ml-3"
                >
                  <Heart size={20} fill="currentColor" />
                </motion.span>
              </button>
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                By clicking, you agree to our Code of Empathy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
