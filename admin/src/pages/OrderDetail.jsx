import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import api from '../api/client';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';

const STEPS = [
  { slug: 'placed', label: 'Placed' },
  { slug: 'processing', label: 'Processing' },
  { slug: 'shipped', label: 'In Transit' },
  { slug: 'delivered', label: 'Delivered' },
];

export default function OrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [customerVisible, setCustomerVisible] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    if (!selectedStatus) { setUpdateError('Select a status'); return; }
    setUpdating(true);
    try {
      await api.post(`/orders/${id}/status`, { to_status_slug: selectedStatus, note: note || undefined, is_customer_visible: customerVisible });
      setSelectedStatus(''); setNote(''); setCustomerVisible(true); setUpdateSuccess('Status updated successfully');
      await load();
    } catch (err) {
      setUpdateError(err?.response?.data?.error || 'Failed to update status');
    } finally { setUpdating(false); }
  }

  if (loading) return <AdminLayout><div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div></AdminLayout>;
  if (error || !data) return <AdminLayout><div className="bg-red-950/40 border border-red-900 text-red-300 text-sm rounded-md px-4 py-3">{error || 'Item not found'}</div></AdminLayout>;

  const { order, events, validNextStatuses } = data;

  // Calculate Progress Bar State
  const currentStepIndex = STEPS.findIndex((s) => s.slug === order.status_slug);
  const isOnHold = order.status_category === 'hold_financial' || order.status_category === 'hold_operational';
  // If it's on hold, we show it as stuck at "Processing" visually
  const activeStep = currentStepIndex === -1 ? (isOnHold ? 1 : 0) : currentStepIndex;

  return (
    <AdminLayout>
      <div className="mb-5">
        <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition">
          <ArrowLeft size={14} /> Back to items
        </Link>
        <div className="flex items-start justify-between mt-3 gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-slate-100 font-mono">{order.order_number}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{order.item_name}</p>
          </div>
          <StatusBadge label={order.status_label} color={order.status_color} />
        </div>
      </div>

      {/* 🟢 PROGRESS TRACKER */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          {/* Background Line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10" />
          {/* Active Line */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-500 -z-10" 
            style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }} 
          />

          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isActive = idx === activeStep;
            
            return (
              <div key={step.slug} className="flex flex-col items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted ? 'bg-blue-500 text-white' : 
                  isActive ? 'bg-slate-900 border-2 border-blue-500 text-blue-400' : 
                  'bg-slate-900 border-2 border-slate-700 text-slate-600'
                }`}>
                  {isCompleted ? <Check size={12} /> : idx + 1}
                </div>
                <span className={`text-[11px] font-medium uppercase tracking-wider ${
                  isActive ? 'text-blue-400' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        {isOnHold && (
          <div className="mt-4 text-center">
            <span className="inline-block bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs px-2.5 py-1 rounded-md">
              ⚠️ Currently On Hold: {order.status_label}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-slate-500 mb-0.5">Item Name</dt><dd className="text-slate-200">{order.item_name}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-0.5">Value</dt><dd className="text-slate-200 tabular-nums">{order.currency} {Number(order.declared_value).toFixed(2)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500 mb-0.5">Description</dt><dd className="text-slate-200">{order.item_description || '—'}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-0.5">From</dt><dd className="text-slate-200">{order.from_location}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-0.5">To</dt><dd className="text-slate-200">{order.to_location}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-0.5">Insurance</dt><dd className="text-slate-200">{order.insurance_required ? 'Required' : 'Not required'}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-0.5">Created</dt><dd className="text-slate-200">{new Date(order.created_at).toLocaleString()}</dd></div>
            </dl>
          </section>

          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recipient</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-slate-500 mb-0.5">Name</dt><dd className="text-slate-200">{order.first_name} {order.last_name}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-0.5">Email</dt><dd className="text-slate-200">{order.email}</dd></div>
              <div><dt className="text-xs text-slate-500 mb-0.5">Phone</dt><dd className="text-slate-200">{order.phone}</dd></div>
            </dl>
          </section>

          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Timeline</h3>
            <ol className="space-y-3">
              {events.map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.to_color }} />
                    <div className="w-px flex-1 bg-slate-800 my-1" />
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge label={ev.to_label} color={ev.to_color} />
                      {!ev.is_customer_visible && <span className="text-[10px] text-slate-600 uppercase tracking-wider">internal</span>}
                    </div>
                    {ev.note && <p className="text-slate-300 text-sm mt-1">{ev.note}</p>}
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(ev.created_at).toLocaleString()} · by {ev.by_admin}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div>
          <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 sticky top-20">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Update Status</h3>
            {validNextStatuses.length === 0 ? (
              <p className="text-slate-500 text-sm">No transitions available from the current status.</p>
            ) : (
              <form onSubmit={handleStatusUpdate} className="space-y-3">
                {updateError && <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-md px-3 py-2">{updateError}</div>}
                {updateSuccess && <div className="bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs rounded-md px-3 py-2">{updateSuccess}</div>}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">New status *</label>
                  <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="">— Select —</option>
                    {validNextStatuses.map((s) => <option key={s.id} value={s.slug}>{s.customer_label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Note (optional)</label>
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500" placeholder="Message or context…" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="visible" type="checkbox" checked={customerVisible} onChange={(e) => setCustomerVisible(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                  <label htmlFor="visible" className="text-xs text-slate-400">Visible to customer</label>
                </div>
                <button type="submit" disabled={updating} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors">
                  {updating ? 'Updating…' : 'Update Status'}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}