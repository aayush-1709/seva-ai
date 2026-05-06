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
  Info,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { apiUrl } from '../lib/api';

const categories = [
  { id: 'infrastructure', name: 'Infrastructure', icon: HardHat, color: 'bg-orange-500' },
  { id: 'lighting', name: 'Street Lighting', icon: Lightbulb, color: 'bg-yellow-500' },
  { id: 'water', name: 'Water & Sanitation', icon: Droplets, color: 'bg-blue-500' },
  { id: 'safety', name: 'Public Safety', icon: ShieldAlert, color: 'bg-red-500' },
  { id: 'env', name: 'Environment', icon: Zap, color: 'bg-green-500' },
  { id: 'other', name: 'Other Issues', icon: Info, color: 'bg-slate-500' },
];

const MAX_IMAGES = 3;

export default function Report() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const imagePreviewUrls = useMemo(
    () => images.map((file) => URL.createObjectURL(file)),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

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
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f): f is File => f instanceof File && f.type.startsWith('image/')
    );
    setImages((prev) => [...prev, ...dropped].slice(0, MAX_IMAGES));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const next = [...images, ...Array.from(e.target.files)].slice(0, MAX_IMAGES);
      setImages(next);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const requestLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setLocationError('Unable to read your location. Allow permission or try again.');
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  };

  const resetForm = () => {
    setCategory(null);
    setDescription('');
    setImages([]);
    setLocation(null);
    setPriority('medium');
    setValidationError(null);
    setLocationError(null);
  };

  const parseApiDetail = (data: {
    detail?: string | Array<{ msg?: string }>;
  }) => {
    const { detail } = data;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail))
      return detail.map((d) => (d && 'msg' in d ? String(d.msg) : '')).filter(Boolean).join('; ');
    return '';
  };

  const handleSubmit = async () => {
    setValidationError(null);
    if (!category) {
      setValidationError('Please select a category.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Please enter a description of the issue.');
      return;
    }
    if (!location) {
      setValidationError('Please set the occurrence location using “Set precise location”.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl('/reports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: description.trim(),
          priority,
          location: { lat: location.lat, lng: location.lng },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        detail?: string | Array<{ msg?: string }>;
      };
      if (!res.ok) {
        throw new Error(parseApiDetail(data) || res.statusText || 'Failed to submit report');
      }
      setToast({ type: 'success', message: 'Report submitted successfully' });
      resetForm();
      window.setTimeout(() => navigate('/'), 1600);
    } catch (err) {
      console.error(err);
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit report. Try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefineWithSevaAI = async () => {
    const text = description.trim();
    if (!text) {
      setToast({
        type: 'error',
        message: 'Write a short description first, then SevaAI can refine it.',
      });
      return;
    }
    setIsRefining(true);
    try {
      const res = await fetch(apiUrl('/reports/refine'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        detail?: string | Array<{ msg?: string }>;
        category?: string;
        urgency?: string;
        summary?: string;
      };
      if (!res.ok) {
        let msg = parseApiDetail(data) || res.statusText || 'Refinement failed';
        if (res.status === 502) {
          msg =
            `${msg}\nGemini unavailable — check GEMINI_API_KEY in .env and restart the API.`.trim();
        }
        throw new Error(msg);
      }
      const cat = data.category;
      const validIds = new Set(categories.map((c) => c.id));
      setCategory(cat && validIds.has(cat) ? cat : 'other');
      const u = data.urgency?.toLowerCase();
      if (u === 'low' || u === 'medium' || u === 'high') {
        setPriority(u);
      }
      setDescription((data.summary ?? '').trim() || text);
      setToast({ type: 'success', message: 'SevaAI updated category, priority, and summary.' });
    } catch (err) {
      console.error(err);
      setToast({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'SevaAI is unavailable. Check your connection and API key, then try again.',
      });
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`fixed bottom-6 left-1/2 z-[100] max-w-md w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl px-5 py-4 shadow-xl font-bold text-sm ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white'
                : 'bg-red-600 text-white'
            }`}
            role="status"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-3 bg-white/80 backdrop-blur shadow-sm rounded-2xl text-slate-600 hover:text-primary transition-all focus-within:ring-2 focus-within:ring-primary"
          aria-label="Go back to Dashboard"
        >
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
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${
                    category === cat.id
                      ? 'border-primary bg-blue-50 shadow-md shadow-primary/10'
                      : 'border-slate-100 bg-white hover:border-blue-200'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center text-white transition-transform group-hover:scale-110 shadow-lg`}
                  >
                    <cat.icon size={24} />
                  </div>
                  <span
                    className={`text-xs font-bold ${category === cat.id ? 'text-primary' : 'text-slate-600'}`}
                  >
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Evidence Upload */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              2. Upload Evidence
              <span className="text-slate-400 font-normal text-sm ml-2">(Max {MAX_IMAGES} photos)</span>
            </h3>

            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-[2rem] p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragging
                  ? 'border-primary bg-blue-50/50 scale-[1.01]'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
              }`}
              onClick={() => document.getElementById('file-upload')?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('file-upload')?.click();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input id="file-upload" type="file" multiple hidden onChange={handleFileSelect} accept="image/*" />
              <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 text-primary group">
                <Camera size={32} className="group-hover:scale-110 transition-transform" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-1">Upload relevant photos</h4>
              <p className="text-slate-500 text-sm max-w-xs">
                Drag and drop images here, or click to browse files
              </p>
            </div>

            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-4 overflow-hidden"
                >
                  {images.map((file, i) => (
                    <motion.div
                      key={`${file.name}-${file.size}-${i}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group"
                    >
                      <img src={imagePreviewUrls[i]} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
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
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                3. Detailed Description
                <span className="text-red-500">*</span>
              </h3>
              <button
                type="button"
                onClick={handleRefineWithSevaAI}
                disabled={isRefining || !description.trim()}
                aria-busy={isRefining}
                className="group relative flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-primary bg-gradient-to-r from-primary to-blue-600 px-5 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/35 sm:min-w-[240px]"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                {isRefining ? (
                  <>
                    <Loader2 size={18} className="animate-spin" aria-hidden />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="text-blue-100" aria-hidden />
                    Refine with SevaAI
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Use SevaAI to classify the issue, set suggested priority, and replace this text with a concise summary.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isRefining}
              placeholder="Describe the issue in detail... (e.g. Broken streetlight near Main St Park entrance, posing safety risk at night)"
              className="w-full h-40 glass-panel p-6 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all placeholder:text-slate-400 text-slate-800 resize-none font-medium disabled:opacity-60"
            />
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Location Picker */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              Occurrence location <span className="text-red-500">*</span>
            </h3>
            <div className="aspect-square bg-slate-100 rounded-[1.5rem] border border-slate-200 relative overflow-hidden group cursor-crosshair">
              <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/0,0,1,0/400x400?access_token=pk.ey')] bg-cover bg-center opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  <MapPin size={32} className="text-primary animate-bounce" />
                  <div className="absolute -bottom-1 left-1.2 w-2 h-1 bg-black/20 rounded-full blur-[1px]" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-white/40 shadow-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
                  Coordinates
                </p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {location
                    ? `${location.lat.toFixed(6)}°, ${location.lng.toFixed(6)}°`
                    : 'Not set — use the button below'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestLocation}
              className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95"
            >
              <MapPin size={16} />
              Set precise location
            </button>
            {locationError && (
              <p className="text-sm text-red-600 font-medium flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                {locationError}
              </p>
            )}
          </div>

          {/* Priority & Action */}
          <div className="glass-panel p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Priority level</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPriority(lvl)}
                  className={`py-4 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 ${
                    priority === lvl
                      ? lvl === 'low'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : lvl === 'medium'
                          ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
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
                Reports with medium severity are typically reviewed within{' '}
                <span className="text-primary font-bold">12-24 hours</span> by our moderation team.
              </p>
            </div>

            {validationError && (
              <div
                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-800 text-sm font-bold flex gap-2"
                role="alert"
              >
                <AlertTriangle size={20} className="shrink-0" />
                {validationError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-white rounded-[2rem] font-black text-lg hover:shadow-2xl hover:shadow-primary/30 transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit Report
                  <ChevronLeft size={24} className="rotate-180" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
