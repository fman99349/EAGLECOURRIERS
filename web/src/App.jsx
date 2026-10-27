import { useState, useEffect } from 'react';
import { Search, Package, Check, Loader2, Info, X, ShieldCheck, Globe, Clock, Download } from 'lucide-react';

const STEPS = [
  { label: 'Placed', threshold: 10 },
  { label: 'Processing', threshold: 30 },
  { label: 'In Transit', threshold: 70 },
  { label: 'Delivered', threshold: 80 },
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
  const [showLogo, setShowLogo] = useState(false); // 🆕 State for Logo Lightbox
  
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
      const cleanNumber = numToTrack.replace(/[-\s]/g, '').trim();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
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

  let activeStep = 0;
  let isOnHold = false;

  if (data) {
    const currentOrder = data.order.status_sort_order || 0;
    const category = data.order.status_category;

    if (currentOrder >= 80) activeStep = 3;
    else if (currentOrder >= 70) activeStep = 2;
    else if (currentOrder >= 20) activeStep = 1;
    else activeStep = 0;

    if (category === 'hold_financial' || category === 'hold_operational') {
      isOnHold = true;
    }
  }

  // Fallback color if none is set
  const activeColor = data?.order?.status_color || '#3b82f6';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* 🆕 Clickable Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => setShowLogo(true)}
          >
            <img 
              src="/EAGLE.jpg" 
              alt="EagleCourier Logo" 
              className="w-8 h-8 rounded-lg object-cover shadow-sm" 
            />
            <span className="font-bold text-lg tracking-tight">EagleCourier</span>
          </div>

          <button onClick={() => setShowAbout(true)} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5">
            <Info size={16} /> About
          </button>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto px-4 py-12 flex flex-col">
        
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

        {data && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 space-y-6 pb-12">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="text-xs font-bold text-blue-600 mb-1 tracking-wider">{data.order.order_number}</div>
                  <h2 className="text-xl font-bold text-slate-900">{data.order.item_name}</h2>
                </div>
                
                {/* Dynamic Status Badge Color */}
                <div 
                  className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border"
                  style={{ 
                    backgroundColor: `${activeColor}15`, 
                    borderColor: `${activeColor}30`, 
                    color: activeColor 
                  }}
                >
                  {data.order.status_label}
                </div>
              </div>

              <div className="mb-8 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <Globe size={14} style={{ color: activeColor }} />
                <span className="font-medium text-slate-700">Current Location:</span> 
                {data.order.current_location || 'In Transit'}
              </div>

              <div className="flex items-center justify-between relative mt-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full" />
                
                {/* Dynamic Progress Line Color */}
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 transition-all duration-700 -z-10 rounded-full" 
                  style={{ 
                    width: `${(activeStep / (STEPS.length - 1)) * 100}%`,
                    backgroundColor: isOnHold ? '#f59e0b' : activeColor
                  }} 
                />

                {STEPS.map((step, idx) => {
                  const isCompleted = idx < activeStep;
                  const isActive = idx === activeStep;
                  return (
                    <div key={step.label} className="flex flex-col items-center gap-2 bg-white px-2">
                      {/* Dynamic Step Circle Color */}
                      <div 
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          !isCompleted && !isActive ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'border-2'
                        }`}
                        style={
                          isCompleted 
                            ? { backgroundColor: activeColor, borderColor: activeColor, color: '#fff' } 
                            : isActive 
                              ? { backgroundColor: `${activeColor}15`, borderColor: activeColor, color: activeColor } 
                              : {}
                        }
                      >
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : 
                         isActive ? <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeColor }} /> : 
                         idx + 1}
                      </div>
                      <span 
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={
                          isActive ? { color: activeColor } : 
                          isCompleted ? { color: '#334155' } : 
                          { color: '#94a3b8' }
                        }
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 bg-white" />
                  <div className="w-0.5 h-8 bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeColor }} />
                </div>
                <div className="flex flex-col justify-between h-14 w-full text-sm">
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

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>Declared Value</span>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                  {data.order.currency} {Number(data.order.declared_value).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">History</h3>
              <ol className="space-y-6">
                {data.events.map((ev, idx) => {
                  const isLatest = idx === data.events.length - 1;
                  
                  return (
                    <li key={idx} className="relative flex gap-4">
                      {!isLatest && (
                        <div className="absolute left-[9px] top-6 bottom-[-24px] w-0.5 bg-slate-200" />
                      )}
                      
                      {/* Dynamic Timeline Dot Color */}
                      <div 
                        className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
                        style={{
                          backgroundColor: isLatest ? ev.color : `${ev.color}15`,
                          borderColor: ev.color,
                          color: isLatest ? '#fff' : ev.color,
                          boxShadow: isLatest ? `0 0 8px ${ev.color}80` : 'none'
                        }}
                      >
                        {isLatest ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        ) : (
                          <Check size={10} strokeWidth={3} />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className={`flex items-baseline flex-wrap gap-x-1.5 ${
                          isLatest ? 'text-base font-extrabold text-slate-900' : 'text-sm font-medium text-slate-700'
                        }`}>
                          <span>{ev.label}</span>
                          {ev.location && (
                            <span className={`font-normal ${isLatest ? 'text-slate-500 text-sm' : 'text-slate-400 text-xs'}`}>
                              - {ev.location}
                            </span>
                          )}
                        </div>
                        
                        {ev.note && (
                          <p className={`mt-1 ${isLatest ? 'text-sm text-slate-600' : 'text-sm text-slate-500'}`}>
                            {ev.note}
                          </p>
                        )}
                        
                        <div className="text-xs text-slate-400 font-medium mt-1.5">
                          {new Date(ev.created_at).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="pt-2">
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/track/${data.order.order_number}/receipt`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
              >
                <Download size={16} /> Download My Receipt
              </a>
            </div>

            <button onClick={() => { setData(null); setTrackingNumber(''); }} className="w-full py-4 text-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Track another shipment
            </button>
          </div>
        )}
      </main>

      {/* About Us Modal */}
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

      {/* 🆕 Logo Lightbox Modal */}
      {showLogo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <button 
            onClick={() => setShowLogo(false)} 
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-colors z-[110]"
          >
            <X size={24} />
          </button>
          
          <img 
            src="/EAGLE.jpg" 
            alt="EagleCourier Logo Full" 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
          />
        </div>
      )}
    </div>
  );
}