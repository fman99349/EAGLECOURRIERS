import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/client';
import AdminLayout from '../components/AdminLayout';

const initial = {
  item_name: '', item_description: '',
  from_location: '', to_location: '',
  declared_value: '', currency: 'USD', insurance_required: false,
  internal_notes: '',
  first_name: '', last_name: '', email: '', phone: '',
};

export default function NewOrder() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        item_name: form.item_name,
        item_description: form.item_description || null,
        from_location: form.from_location,
        to_location: form.to_location,
        declared_value: form.declared_value ? Number(form.declared_value) : 0,
        currency: form.currency,
        insurance_required: form.insurance_required,
        internal_notes: form.internal_notes || null,
        recipient: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
        },
      });
      navigate(`/orders/${res.data.order.id}`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

  return (
    <AdminLayout>
      <div className="mb-5">
        <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition">
          <ArrowLeft size={14} />
          Back to items
        </Link>
        <h2 className="text-xl font-semibold text-slate-100 mt-2">New Item</h2>
        <p className="text-sm text-slate-500 mt-0.5">Create a new international shipment.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
        {error && (
          <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-sm rounded-md px-4 py-3">
            {error}
          </div>
        )}

        <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Item name *</label>
              <input required value={form.item_name} onChange={(e) => set('item_name', e.target.value)} className={inputCls} placeholder="e.g. Laptop" />
            </div>
            <div>
              <label className={labelCls}>Declared value</label>
              <input type="number" min="0" step="0.01" value={form.declared_value} onChange={(e) => set('declared_value', e.target.value)} className={inputCls} placeholder="0.00" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea rows={2} value={form.item_description} onChange={(e) => set('item_description', e.target.value)} className={inputCls} placeholder="Optional details…" />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className={inputCls}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ZAR">ZAR</option>
                <option value="AUD">AUD</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
            <div className="flex items-center gap-2 md:mt-6">
              <input id="ins" type="checkbox" checked={form.insurance_required} onChange={(e) => set('insurance_required', e.target.checked)} className="w-4 h-4 accent-blue-500 rounded" />
              <label htmlFor="ins" className="text-sm text-slate-300">Insurance required</label>
            </div>
          </div>
        </section>

        <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>From *</label>
              <input required value={form.from_location} onChange={(e) => set('from_location', e.target.value)} className={inputCls} placeholder="City, Country" />
            </div>
            <div>
              <label className={labelCls}>To *</label>
              <input required value={form.to_location} onChange={(e) => set('to_location', e.target.value)} className={inputCls} placeholder="City, Country" />
            </div>
          </div>
        </section>

        <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>First name *</label><input required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Last name *</label><input required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Email *</label><input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Phone *</label><input required value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} /></div>
          </div>
        </section>

        <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Internal</h3>
          <div>
            <label className={labelCls}>Internal notes (not visible to customer)</label>
            <textarea rows={2} value={form.internal_notes} onChange={(e) => set('internal_notes', e.target.value)} className={inputCls} />
          </div>
        </section>

        {/* 📱 Mobile-Optimized Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 pb-8">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-2.5 text-sm rounded-md transition-colors text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-md transition-colors"
          >
            {submitting ? 'Creating…' : 'Create Item'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}