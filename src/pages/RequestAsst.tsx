import { 
  HandHelping, 
  ChevronLeft, 
  Heart, 
  Stethoscope, 
  UtensilsCrossed, 
  Home, 
  Baby, 
  BookOpen,
  Plus,
  Minus,
  AlertCircle,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { apiUrl } from '../lib/api';

const resources = [
  { id: 'food', name: 'Food & Groceries', icon: UtensilsCrossed, color: 'bg-green-500' },
  { id: 'medical', name: 'Medical Aid', icon: Stethoscope, color: 'bg-red-500' },
  { id: 'shelter', name: 'Shelter Support', icon: Home, color: 'bg-blue-500' },
  { id: 'childcare', name: 'Childcare Basics', icon: Baby, color: 'bg-pink-500' },
  { id: 'education', name: 'Education/Books', icon: BookOpen, color: 'bg-purple-500' },
  { id: 'mental', name: 'Mental Support', icon: Heart, color: 'bg-teal-500' },
];

type NGO = {
  name: string;
  category: string;
  contact: string;
  distance_km?: number | null;
};

export default function RequestAsst() {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [urgency, setUrgency] = useState('standard');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [matchedNgos, setMatchedNgos] = useState<NGO[]>([]);
  const [ticketId, setTicketId] = useState('');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');

  const toggleResource = (id: string) => {
    setSelectedResources(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const submitHelpRequest = async () => {
    setError('');
    if (selectedResources.length === 0) {
      setError('Select at least one type of support.');
      return;
    }

    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      setError('Latitude and longitude must be valid numbers.');
      return;
    }

    const selectedLabels = resources
      .filter((resource) => selectedResources.includes(resource.id))
      .map((resource) => resource.name);
    const requestText = [
      `Urgency: ${urgency}`,
      `Beneficiaries: ${quantity}`,
      `Needed resources: ${selectedLabels.join(', ')}`,
      notes.trim() ? `Notes: ${notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join('. ');

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl('/help'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_text: requestText,
          location: { lat: parsedLat, lng: parsedLng },
        }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text || `Request failed with status ${response.status}`);
      const data = (text ? JSON.parse(text) : []) as NGO[];
      setMatchedNgos(Array.isArray(data) ? data : []);
      setTicketId(`RQ-${Date.now().toString().slice(-8)}`);
      setIsSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full glass-panel p-10 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 font-manrope">Request Received</h2>
          <p className="text-slate-600 font-medium">
            Your request for assistance has been logged and prioritized by SevaAI. We are matching you with local resources right now.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl text-left border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Ticket ID</div>
            <div className="text-lg font-mono font-bold text-slate-800 tracking-wider">#{ticketId || 'RQ-PENDING'}</div>
          </div>
          {matchedNgos.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-2xl text-left border border-blue-100 space-y-2">
              <div className="text-[10px] uppercase font-bold text-blue-500 mb-1">Matched NGOs</div>
              {matchedNgos.slice(0, 3).map((ngo) => (
                <div key={`${ngo.name}-${ngo.contact}`} className="text-sm">
                  <div className="font-bold text-slate-800">{ngo.name}</div>
                  <div className="text-slate-600">{ngo.category} - {ngo.contact}</div>
                </div>
              ))}
            </div>
          )}
          {matchedNgos.length === 0 && (
            <p className="text-xs text-slate-500">No NGO matches were returned. Our team will still review this request.</p>
          )}
          <Link to="/" className="block w-full py-4 bg-primary text-white rounded-2xl font-black transition-all hover:shadow-xl active:scale-95">
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-all">
            <ChevronLeft size={20} /> Back to Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 font-manrope tracking-tight uppercase italic">
            Request <span className="text-primary">Support</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl text-lg">
            Tell us what you need, and SevaAI will bridge the gap to the nearest available volunteer or NGO resources.
          </p>
        </div>
        
        <div className="glass-card bg-secondary/5 border-secondary/20 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-on-secondary shadow-lg">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-secondary uppercase tracking-widest leading-none mb-1">AI Recommendation</p>
            <p className="text-sm font-bold text-slate-800">Resources are plentiful today.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          {/* Resource Picker */}
          <section className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 font-manrope border-l-4 border-primary pl-4">I need help with...</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {resources.map((res) => {
                const isActive = selectedResources.includes(res.id);
                return (
                  <button
                    key={res.id}
                    onClick={() => toggleResource(res.id)}
                    className={`relative p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-4 overflow-hidden group ${
                      isActive 
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' 
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${res.color} flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-hover:-rotate-6`}>
                      <res.icon size={24} />
                    </div>
                    <span className={`text-sm font-black italic uppercase ${isActive ? 'text-primary' : 'text-slate-800'}`}>{res.name}</span>
                    {isActive && (
                      <div className="absolute top-4 right-4 text-primary">
                        <CheckCircle2 size={24} fill="currentColor" className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Details */}
          <section className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-lg font-black text-slate-800 font-manrope">Beneficiary Count</label>
                <div className="flex items-center gap-6 bg-white rounded-2xl p-4 border border-slate-200">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all font-bold active:scale-90"
                    aria-label="Decrease beneficiary count"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="flex-1 text-center text-3xl font-black text-primary font-manrope">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all font-bold active:scale-90"
                    aria-label="Increase beneficiary count"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-lg font-black text-slate-800 font-manrope">Target Urgency</label>
                <div className="flex gap-2">
                  {['Standard', 'Urgent', 'Critical'].map((u) => (
                    <button
                      key={u}
                      onClick={() => setUrgency(u.toLowerCase())}
                      className={`flex-1 py-4 px-2 rounded-2xl font-black text-xs uppercase transition-all border-2 active:scale-95 ${
                        urgency === u.toLowerCase()
                          ? u === 'Standard' ? 'bg-blue-50 border-primary text-primary'
                            : u === 'Urgent' ? 'bg-orange-50 border-orange-500 text-orange-600'
                            : 'bg-red-50 border-red-600 text-red-600'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-lg font-black text-slate-800 font-manrope">Situational Context</label>
                <span className="text-xs font-bold text-slate-400">Optional but helpful</span>
              </div>
              <textarea 
                placeholder="Briefly describe the specific needs (e.g. 'Infant formula needed for 3 month old, preference for brand X if possible')"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-32 glass-panel p-6 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude"
                  className="w-full rounded-2xl border border-slate-200 p-4 font-medium outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude"
                  className="w-full rounded-2xl border border-slate-200 p-4 font-medium outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar/Review */}
        <div className="space-y-8">
          <div className="glass-panel p-8 bg-zinc-900 border-zinc-800 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
            <h3 className="text-xl font-black font-manrope mb-6 relative z-10 flex items-center gap-2">
              <AlertCircle size={20} className="text-primary" />
              Safety Verification
            </h3>
            <ul className="space-y-4 text-xs font-medium text-zinc-400 relative z-10 list-disc pl-4 leading-relaxed">
              <li>All requests are verified by community moderators before dispatch.</li>
              <li>Your precise location is only shared once a verified volunteer is assigned.</li>
              <li>Emergency medical needs should STILL call local authorities directly.</li>
            </ul>
          </div>

          <div className="glass-panel p-8 space-y-6">
            <h3 className="text-xl font-black text-slate-800 font-manrope border-b border-slate-100 pb-4">Request Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">Selected Needs</span>
                <span className="font-black text-primary">{selectedResources.length} Categories</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">Total Beneficiaries</span>
                <span className="font-black text-slate-800">{quantity} Persons</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">Priority Status</span>
                <span className={`font-black uppercase tracking-widest text-[10px] px-2 py-1 rounded ${
                  urgency === 'critical' ? 'bg-red-100 text-red-600' : 
                  urgency === 'urgent' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {urgency} Response
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <HandHelping size={18} className="text-primary flex-shrink-0" />
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">
                  SevaAI is currently matching similar requests in your area to optimize logistics.
                </p>
              </div>

              <button 
                onClick={() => void submitHelpRequest()}
                disabled={selectedResources.length === 0 || isSubmitting}
                className="w-full py-5 bg-primary text-white rounded-[2.5rem] font-black text-xl uppercase tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl hover:shadow-primary/30 transition-all transform active:scale-95 flex items-center justify-center gap-4"
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
                <HandHelping size={24} />
              </button>
              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
