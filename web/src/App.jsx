import { useState, useEffect } from 'react';
import { Search, Package, Check, Loader2, Info, X, ShieldCheck, Globe, Clock } from 'lucide-react';

const STEPS = [
  { slug: 'placed', label: 'Placed' },
  { slug: 'processing', label: 'Processing' },
  { slug: 'shipped', label: 'In Transit' },
  { slug: 'delivered', label: 'Delivered' },
];

// Typewriter Hook for About Us
function useTypewriter(text, speed = 50) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed((prev) => prev + text.charAt(i));
      i++;
      if (i === text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return displayed;
}

export default function App() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  
  const typedTitle = useTypewriter('EagleCourier International Shipping Services');

  // Handle URL Auto-fill (e.g. ?track=EGL-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get('track');
    if (trackParam) {
      setTrackingNumber(trackParam);
      handleTrack(null, trackParam);
    }
  }, []);

  async function handleTrack(e, overrideNumber = null) {
    if (e) e.preventDefault();
    const numToTrack = overrideNumber || trackingNumber;
    if (!numToTrack.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      // 🆕 Strip hyphens and spaces for a smarter search
      const cleanNumber = numToTrack.replace(/[-\s]/g, '').trim();
      
      // Fallback to localhost if env variable is missing
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
      // Note: We pass cleanNumber to the backend
      const res = await fetch(`${apiUrl}/api/track/${cleanNumber}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Shipment not found');
      
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const currentStepIndex = data ? STEPS.findIndex((s) => s.slug === data.order.status_slug) : -1;
  const isOnHold = data && (data.order.status_slug.includes('pending') || data.order.status_slug === 'parked');
  const activeStep = currentStepIndex === -1 ? (isOnHold ? 1 : 0) : currentStepIndex;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Package size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">EagleCourier</span>
          </div>
          <button onClick={() => setShowAbout(true)} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <Info size={16} /> About
          </button>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto px-4 py-12 flex flex-col">
        
        {/* Search Box */}
        <div className={`transition-all duration-500 ${data || loading ? 'mb-6' : 'mt-10 mb-12'}`}>
          {!data && !loading && (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Track your shipment</h1>
              <p className="text-slate-500 text-sm">Enter your tracking number below.</p>
            </div>
          )}

          <form onSubmit={handleTrack} className="relative shadow-sm">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400" size={20} />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="Enter tracking number"
                className="w-full bg-white border border-slate-300 rounded-xl py-4 pl-12 pr-32 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg font-mono transition-all placeholder:font-sans placeholder:text-base"
              />
              <button
                type="submit"
                disabled={loading || !trackingNumber}
                className="absolute right-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Track'}
              </button>
            </div>
          </form>

          {error && <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center font-medium">{error}</div>}
        </div>

        {/* Results */}
        {data && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 space-y-6 pb-12">
            
            {/* Progress Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-xs font-bold text-blue-600 mb-1 tracking-wider">{data.order.order_number}</div>
                  <h2 className="text-xl font-bold text-slate-900">{data.order.item_name}</h2>
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-bold whitespace-nowrap">
                  {data.order.status_label}
                </div>
              </div>

              {/* 🆕 Current Location Tiny Text */}
              <div className="mb-8 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <Globe size={14} className="text-blue-500" />
                <span className="font-medium text-slate-700">Current Location:</span> 
                {data.order.current_location || 'In Transit'}
              </div>

              {/* Stepper with Ticks and Pulsing Dot */}
              <div className="flex items-center justify-between relative mt-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full" />
                <div 
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 transition-all duration-700 -z-10 rounded-full ${isOnHold ? 'bg-amber-500' : 'bg-blue-600'}`}
                  style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }} 
                />
                {STEPS.map((step, idx) => {
                  const isCompleted = idx < activeStep;
                  const isActive = idx === activeStep;
                  return (
                    <div key={step.slug} className="flex flex-col items-center gap-2 bg-white px-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCompleted ? 'bg-blue-600 text-white' : 
                        isActive ? (isOnHold ? 'bg-amber-100 text-amber-600 border-2 border-amber-500' : 'bg-blue-100 text-blue-600 border-2 border-blue-600') : 
                        'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : 
                         isActive ? <div className={`w-2 h-2 rounded-full animate-pulse ${isOnHold ? 'bg-amber-500' : 'bg-blue-600'}`} /> : 
                         idx + 1}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        isActive ? (isOnHold ? 'text-amber-600' : 'text-blue-600') : isCompleted ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="pt-2 flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 bg-white" />
                  <div className="w-0.5 h-6 bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </div>
                <div className="flex flex-col justify-between h-12 w-full text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Origin</span>
                    <span className="text-slate-900 font-medium">{data.order.from_location}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Destination</span>
                    <span className="text-slate-900 font-medium">{data.order.to_location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">History</h3>
              <ol className="space-y-6">
                {data.events.map((ev, idx) => (
                  <li key={idx} className="relative flex gap-4">
                    {idx !== data.events.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-[-24px] w-0.5 bg-slate-200" />
                    )}
                    <div className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-blue-50 border border-blue-200">
                      <Check size={10} className="text-blue-600" strokeWidth={3} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{ev.label}</div>
                      {ev.note && <p className="text-sm text-slate-500 mt-1">{ev.note}</p>}
                      <div className="text-xs text-slate-400 font-medium mt-1">{new Date(ev.created_at).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <button onClick={() => { setData(null); setTrackingNumber(''); }} className="w-full py-4 text-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Track another shipment
            </button>
          </div>
        )}
      </main>

      {/* Professional About Us Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAbout(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 bg-slate-100 p-1.5 rounded-full transition-colors">
              <X size={18} />
            </button>
            
            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-600/20">
              <Globe size={28} />
            </div>
            
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mb-3 min-h-[64px]">
              {typedTitle}<span className="animate-pulse text-blue-600">|</span>
            </h2>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              EagleCourier is the trusted internal logistics network powering global operations. We ensure secure, rapid, and transparent international delivery for critical corporate assets. 
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <ShieldCheck size={18} className="text-emerald-500" /> 100% Secure Handling
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <Clock size={18} className="text-blue-500" /> On-Time Global Delivery
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Trusted by enterprise teams worldwide.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}