import { useState } from 'react';
import { Search, Package, MapPin, CheckCircle2, ChevronRight, Loader2, Info, ArrowRight, X } from 'lucide-react';

const STEPS = [
  { slug: 'placed', label: 'Placed' },
  { slug: 'processing', label: 'Processing' },
  { slug: 'shipped', label: 'In Transit' },
  { slug: 'delivered', label: 'Delivered' },
];

// 🦅 Brand Logo (Same as admin)
const EagleMark = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6l9 6-9 6M12 6l9 6-9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function App() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAbout, setShowAbout] = useState(false);

  async function handleTrack(e) {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/track/${trackingNumber.trim()}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Failed to track');
      
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Calculate progress bar state
  const currentStepIndex = data ? STEPS.findIndex((s) => s.slug === data.order.status_slug) : -1;
  const isOnHold = data && (data.order.status_slug.includes('pending') || data.order.status_slug === 'parked');
  const activeStep = currentStepIndex === -1 ? (isOnHold ? 1 : 0) : currentStepIndex;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <EagleMark size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">EagleCourier</span>
          </div>
          <button onClick={() => setShowAbout(true)} className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
            <Info size={16} /> About Us
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col">
        
        {/* Hero / Search */}
        <div className={`transition-all duration-500 ease-in-out ${data || loading ? 'mb-6' : 'mt-10 mb-12'}`}>
          {!data && !loading && (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Track your shipment</h1>
              <p className="text-slate-400">Enter your tracking number below to see the latest updates.</p>
            </div>
          )}

          <form onSubmit={handleTrack} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-500" size={20} />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="e.g. EGL-ABCD-1234"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 pl-12 pr-32 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg font-mono uppercase transition-all"
              />
              <button
                type="submit"
                disabled={loading || !trackingNumber}
                className="absolute right-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Track'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-950/40 border border-red-900/60 rounded-xl text-red-300 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Results View */}
        {data && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 space-y-6 pb-12">
            
            {/* Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs font-mono text-blue-400 mb-1">{data.order.order_number}</div>
                  <h2 className="text-xl font-bold text-white">{data.order.item_name}</h2>
                </div>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap"
                  style={{ 
                    backgroundColor: `${data.order.status_color}15`, 
                    borderColor: `${data.order.status_color}40`, 
                    color: data.order.status_color 
                  }}
                >
                  {data.order.status_label}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center justify-between relative mt-8 mb-2 px-2">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-10" />
                <div 
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 transition-all duration-700 -z-10 ${isOnHold ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }} 
                />
                {STEPS.map((step, idx) => {
                  const isCompleted = idx < activeStep;
                  const isActive = idx === activeStep;
                  return (
                    <div key={step.slug} className="flex flex-col items-center gap-2 bg-slate-900 py-1 px-2 rounded-lg">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isCompleted ? 'bg-blue-500 text-white' : 
                        isActive ? (isOnHold ? 'bg-amber-500 text-white border-2 border-amber-300' : 'bg-blue-500 text-white border-2 border-blue-300') : 
                        'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                      </div>
                      <span className={`text-[10px] font-medium uppercase tracking-wider ${
                        isActive ? (isOnHold ? 'text-amber-400' : 'text-blue-400') : isCompleted ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Route & Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-slate-900" />
                  <div className="w-0.5 h-8 bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                </div>
                <div className="flex flex-col justify-between h-14 w-full">
                  <div className="text-sm text-slate-400 flex justify-between">
                    <span>From</span>
                    <span className="text-slate-200 font-medium text-right max-w-[60%]">{data.order.from_location}</span>
                  </div>
                  <div className="text-sm text-slate-400 flex justify-between">
                    <span>To</span>
                    <span className="text-slate-200 font-medium text-right max-w-[60%]">{data.order.to_location}</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Recipient</div>
                  <div className="text-sm text-slate-200 mt-0.5">{data.order.first_name} {data.order.last_name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Declared Value</div>
                  <div className="text-sm text-slate-200 mt-0.5">{data.order.currency} {Number(data.order.declared_value).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-6">Tracking History</h3>
              <ol className="space-y-6">
                {data.events.map((ev, idx) => (
                  <li key={idx} className="relative flex gap-4">
                    {idx !== data.events.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-slate-800" />
                    )}
                    <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${ev.color}20`, border: `1px solid ${ev.color}` }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color }} />
                    </div>
                    <div className="pb-2">
                      <div className="text-sm font-semibold text-slate-200">{ev.label}</div>
                      {ev.note && <p className="text-sm text-slate-400 mt-1">{ev.note}</p>}
                      <div className="text-xs text-slate-500 mt-1">{new Date(ev.created_at).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <button 
              onClick={() => { setData(null); setTrackingNumber(''); }}
              className="w-full py-4 text-center text-sm text-slate-400 hover:text-white transition-colors"
            >
              Track another shipment
            </button>
          </div>
        )}
      </main>

      {/* About Us Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X size={20} />
            </button>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-4">
              <EagleMark size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">About EagleCourier</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              EagleCourier is the internal global logistics network powering shipments for our worldwide staff. We ensure secure, fast, and reliable international delivery for critical company assets.
            </p>
            <p className="text-xs text-slate-500 mt-6">
              © {new Date().getFullYear()} EagleCourier International. Internal use only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}