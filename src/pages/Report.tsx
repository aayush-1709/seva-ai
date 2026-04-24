import { 
  ShieldAlert, 
  Camera, 
  MapPin, 
  ChevronLeft, 
  Trash2, 
  Sparkles,
  Zap,
  Clock,
  AlertTriangle,
  Lightbulb,
  Droplets,
  HardHat,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const categories = [
  { id: 'infrastructure', name: 'Infrastructure', icon: HardHat, color: 'bg-orange-500' },
  { id: 'lighting', name: 'Street Lighting', icon: Lightbulb, color: 'bg-yellow-500' },
  { id: 'water', name: 'Water & Sanitation', icon: Droplets, color: 'bg-blue-500' },
  { id: 'safety', name: 'Public Safety', icon: ShieldAlert, color: 'bg-red-500' },
  { id: 'env', name: 'Environment', icon: Zap, color: 'bg-green-500' },
  { id: 'other', name: 'Other Issues', icon: Info, color: 'bg-slate-500' },
];

export default function Report() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-3 bg-white/80 backdrop-blur shadow-sm rounded-2xl text-slate-600 hover:text-primary transition-all focus-within:ring-2 focus-within:ring-primary" aria-label="Go back to Dashboard">
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-800 font-manrope">Submit Report</h1>
          <p className="text-slate-500 font-medium">Flag local issues for AI-prioritized response</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Category Selection */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              1. Select Category
              <span className="text-red-500">*</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${
                    selectedCategory === cat.id 
                      ? 'border-primary bg-blue-50 shadow-md shadow-primary/10' 
                      : 'border-slate-100 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-lg`}>
                    <cat.icon size={24} />
                  </div>
                  <span className={`text-xs font-bold ${selectedCategory === cat.id ? 'text-primary' : 'text-slate-600'}`}>{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Evidence Upload */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              2. Upload Evidence
              <span className="text-slate-400 font-normal text-sm ml-2">(Max 3 photos)</span>
            </h3>
            
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-[2rem] p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragging ? 'border-primary bg-blue-50/50 scale-[1.01]' : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
              }`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" 
                type="file" 
                multiple 
                hidden 
                onChange={handleFileSelect} 
                accept="image/*"
              />
              <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 text-primary group">
                <Camera size={32} className="group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-1">Upload relevant photos</h4>
              <p className="text-slate-500 text-sm max-w-xs">
                Drag and drop images here, or click to browse files
              </p>
            </div>

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-4 overflow-hidden"
                >
                  {files.map((file, i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group"
                    >
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="absolute top-1 right-1 p-2 bg-red-500 text-white rounded-lg opacity-70 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        aria-label="Remove photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Description */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                3. Detailed Description
              </h3>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-secondary-container text-on-secondary-container text-xs font-black rounded-lg hover:shadow-md transition-all active:scale-95">
                <Sparkles size={14} />
                Refine with SevaAI
              </button>
            </div>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail... (e.g. Broken streetlight near Main St Park entrance, posing safety risk at night)"
              className="w-full h-40 glass-panel p-6 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all placeholder:text-slate-400 text-slate-800 resize-none font-medium"
            />
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Location Picker */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Occurrence Location</h3>
            <div className="aspect-square bg-slate-100 rounded-[1.5rem] border border-slate-200 relative overflow-hidden group cursor-crosshair">
              <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/0,0,1,0/400x400?access_token=pk.ey')] bg-cover bg-center opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  <MapPin size={32} className="text-primary animate-bounce" />
                  <div className="absolute -bottom-1 left-1.2 w-2 h-1 bg-black/20 rounded-full blur-[1px]" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-white/40 shadow-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Detected Coordinates</p>
                <p className="text-xs font-bold text-slate-800 truncate">40.7128° N, 74.0060° W</p>
              </div>
            </div>
            <button className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95">
              <MapPin size={16} />
              Set Precise Location
            </button>
          </div>

          {/* Severity & Action */}
          <div className="glass-panel p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Priority Level</h3>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSeverity(lvl)}
                  className={`py-4 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 ${
                    severity === lvl 
                      ? lvl === 'low' ? 'bg-green-50 border-green-500 text-green-700' 
                      : lvl === 'medium' ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                      : 'bg-red-50 border-red-500 text-red-700 shadow-lg shadow-red-500/10'
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
              <Clock size={20} className="text-primary flex-shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Reports with medium severity are typically reviewed within <span className="text-primary font-bold">12-24 hours</span> by our moderation team.
              </p>
            </div>

            <button className="w-full py-4 bg-primary text-white rounded-[2rem] font-black text-lg hover:shadow-2xl hover:shadow-primary/30 transition-all transform active:scale-95 flex items-center justify-center gap-3">
              Submit Report
              <ChevronLeft size={24} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
