import { 
  Map as MapIcon, 
  Search, 
  Filter, 
  Layers, 
  Navigation2, 
  Zap, 
  AlertTriangle, 
  Target, 
  Clock,
  ChevronRight,
  Maximize2,
  Droplets,
  HandHelping,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

const activeHotspots = [
  { id: 1, type: 'emergency', location: 'Northern Sector', status: 'critical', count: 12, pos: { x: '30%', y: '40%' } },
  { id: 2, type: 'food', location: 'City Center', status: 'stable', count: 8, pos: { x: '60%', y: '55%' } },
  { id: 3, type: 'water', location: 'Industrial Zone', status: 'urgent', count: 15, pos: { x: '45%', y: '70%' } },
  { id: 4, type: 'power', location: 'Suburban East', status: 'stable', count: 4, pos: { x: '75%', y: '35%' } },
];

const deployments = [
  { id: 1, team: 'Rescue Team Delta', task: 'Flood Evacuation', time: '5m ago', status: 'active' },
  { id: 2, team: 'Food Fleet 7', task: 'Grocery Drop', time: '12m ago', status: 'dispatched' },
  { id: 3, team: 'Volunteer Unit 92', task: 'Leak Repair', time: '28m ago', status: 'en-route' },
];

export default function ImpactMap() {
  const [activeTab, setActiveTab] = useState('heatmaps');
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Sidebar Controls */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col z-20 shadow-2xl relative">
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 font-manrope">Live Impact Map</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-tight">Geospatial Intelligence</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search sectors, hotspots..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Map Layers</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center gap-2 p-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20">
                <Zap size={14} /> Heatmaps
              </button>
              <button className="flex items-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
                <Target size={14} /> Critical
              </button>
              <button className="flex items-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
                <Building2 size={14} /> NGO Hubs
              </button>
              <button className="flex items-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
                <Navigation2 size={14} /> Routes
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Deployments</h3>
              <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded">3 DISPATCHED</span>
            </div>
            <div className="space-y-3">
              {deployments.map((d) => (
                <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 group cursor-pointer hover:border-primary transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[11px] font-black text-slate-800">{d.team}</span>
                    <Clock size={10} className="text-slate-400" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">{d.task}</span>
                    <span className="text-[9px] font-bold text-primary group-hover:translate-x-1 transition-transform uppercase tracking-widest">{d.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 text-white rounded-t-[2.5rem] mt-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <div className="text-xl font-black font-manrope">2.4k Reports</div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase">Processed Globally</div>
            </div>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Layers size={20} />
            </div>
          </div>
          <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black transition-all border border-white/10">
            Download Report (GeoJSON)
          </button>
        </div>
      </aside>

      {/* Map View Area */}
      <main className="flex-1 relative bg-[#F8FAFC]">
        {/* Fake Map Grid/Illustration */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:20px_20px]" />
          <svg className="w-full h-full opacity-20" viewBox="0 0 1000 1000">
            <path d="M100,200 Q300,100 500,200 T900,200" fill="none" stroke="#64748B" strokeWidth="2" />
            <path d="M200,900 L800,900" fill="none" stroke="#64748B" strokeWidth="2" strokeDasharray="10 5" />
            <circle cx="500" cy="500" r="400" fill="none" stroke="#64748B" strokeWidth="0.5" />
          </svg>
          
          {/* Animated Heatmap Pulses */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/3 left-1/4 w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-[30%] h-[30%] bg-red-500/20 blur-[100px] rounded-full"
          />
        </div>

        {/* Map UI Overlays */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 glass-panel border-white/40 shadow-2xl flex items-center gap-1 p-1">
          {['Needs', 'NGOs', 'Shelters', 'Volunteers'].map((tag) => (
            <button 
              key={tag}
              onClick={() => setActiveTab(tag.toLowerCase())}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tag.toLowerCase() ? 'bg-primary text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="absolute top-6 right-6 z-10 space-y-2">
          <button 
            className="w-12 h-12 glass-panel border-white shadow-lg flex items-center justify-center text-slate-700 hover:bg-white transition-all active:scale-95"
            aria-label="Find my location"
          >
            <Navigation2 size={20} />
          </button>
          <button 
            className="w-12 h-12 glass-panel border-white shadow-lg flex items-center justify-center text-slate-700 hover:bg-white transition-all active:scale-95"
            aria-label="Maximize map view"
          >
            <Maximize2 size={20} />
          </button>
        </div>

        {/* Hotspot Markers */}
        <div className="absolute inset-0 pointer-events-none">
          {activeHotspots.map((spot) => (
            <div 
              key={spot.id} 
              className="absolute group pointer-events-auto cursor-pointer"
              style={{ left: spot.pos.x, top: spot.pos.y }}
              onClick={() => setSelectedHotspot(spot)}
            >
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute -inset-4 rounded-full ${spot.status === 'critical' ? 'bg-red-500' : spot.status === 'urgent' ? 'bg-orange-500' : 'bg-blue-500'}`}
                />
                <div className={`w-6 h-6 rounded-full border-2 border-white shadow-xl ${spot.status === 'critical' ? 'bg-red-500' : spot.status === 'urgent' ? 'bg-orange-500' : 'bg-blue-500'} flex items-center justify-center text-[10px] text-white font-black`}>
                  {spot.count}
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white p-3 rounded-xl shadow-2xl min-w-[140px] z-50">
                  <div className="text-[9px] font-black uppercase text-zinc-400 mb-1 leading-none">{spot.location}</div>
                  <div className="text-[11px] font-bold mb-2">{spot.count} Pending reports</div>
                  <div className="flex items-center gap-2 border-t border-white/10 pt-2">
                    <span className="text-[9px] font-black text-primary hover:underline">View Sector Details</span>
                    <ChevronRight size={10} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Hotspot Detail Card */}
        <AnimatePresence>
          {selectedHotspot && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute bottom-6 right-6 w-96 glass-panel border-white/60 shadow-2xl p-8 z-30"
            >
              <button 
                onClick={() => setSelectedHotspot(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors"
                aria-label="Close hotspot details"
              >
                <Maximize2 size={20} className="rotate-45" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${selectedHotspot.status === 'critical' ? 'bg-red-500' : 'bg-blue-500'}`}>
                  {selectedHotspot.type === 'emergency' ? <AlertTriangle size={24} /> : selectedHotspot.type === 'food' ? <Droplets size={24} /> : <Zap size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 font-manrope">{selectedHotspot.location}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">{selectedHotspot.status} PRIORITY</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Active Needs</span>
                  <span className="text-lg font-black text-slate-800">24</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500">Resources Allocated</span>
                  <span className="text-lg font-black text-slate-800">12 Units</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all">
                  Dispatch Team
                </button>
                <button className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                  <HandHelping size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-6 left-6 z-10 glass-panel border-white/60 shadow-xl px-4 py-3 flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Critical Needs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Urgent Response</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Resources Found</span>
          </div>
        </div>
      </main>
    </div>
  );
}
