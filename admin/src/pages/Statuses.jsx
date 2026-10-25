import { useEffect, useState } from 'react';
import { Activity, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import api from '../api/client';
import AdminLayout from '../components/AdminLayout';

const CATEGORIES = ['initial', 'in_transit', 'hold_financial', 'hold_operational', 'action_required', 'delivered', 'failed'];

export default function Statuses() {
  const [statuses, setStatuses] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [formData, setFormData] = useState({
    slug: '', internal_name: '', customer_label: '', category: 'in_transit', 
    color: '#3b82f6', requires_action: false, is_active: true, transitions_to: []
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/statuses/admin');
      setStatuses(res.data.statuses);
      setTransitions(res.data.transitions);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load statuses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openModal(status = null) {
    setEditingStatus(status);
    setModalError('');
    if (status) {
      // Find where this status can go
      const outgoing = transitions.filter(t => t.from_status_id === status.id).map(t => t.to_status_id);
      setFormData({
        slug: status.slug,
        internal_name: status.internal_name,
        customer_label: status.customer_label,
        category: status.category,
        color: status.color,
        requires_action: status.requires_action,
        is_active: status.is_active,
        transitions_to: outgoing
      });
    } else {
      setFormData({
        slug: '', internal_name: '', customer_label: '', category: 'in_transit', 
        color: '#3b82f6', requires_action: false, is_active: true, transitions_to: []
      });
    }
    setIsModalOpen(true);
  }

  function handleNameChange(val) {
    const formatted = val.trim().toUpperCase(); // Only for internal name
    // Auto-generate slug if creating new
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    setFormData(prev => ({ 
      ...prev, 
      customer_label: val,
      internal_name: val,
      ...(editingStatus ? {} : { slug }) 
    }));
  }

  function toggleTransition(id) {
    setFormData(prev => ({
      ...prev,
      transitions_to: prev.transitions_to.includes(id) 
        ? prev.transitions_to.filter(tId => tId !== id)
        : [...prev.transitions_to, id]
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setModalError('');
    try {
      if (editingStatus) {
        await api.put(`/statuses/${editingStatus.id}`, formData);
      } else {
        await api.post('/statuses', formData);
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      setModalError(err?.response?.data?.error || 'Failed to save status');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to deactivate this status? It will be hidden from dropdowns.')) return;
    try {
      await api.delete(`/statuses/${id}`);
      load();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete status');
    }
  }

  const inputCls = "w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition";
  const labelCls = "block text-xs font-medium text-slate-400 mb-1.5";

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Status Manager</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage order lifecycles and transitions</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors">
          <Plus size={16} /> New Status
        </button>
      </div>

      {error && <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-sm rounded-md px-4 py-3 mb-3">{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-x-auto">
  <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Label</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-2.5 font-medium">Category</th>
                <th className="text-left px-4 py-2.5 font-medium">Action Req?</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {statuses.map((s) => (
                <tr key={s.id} className={`hover:bg-slate-900/80 transition-colors group ${!s.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-200 font-medium">{s.customer_label}</span>
                      {s.is_system && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">SYSTEM</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden md:table-cell">{s.slug}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.category}</td>
                  <td className="px-4 py-3">
                    {s.requires_action ? <span className="text-amber-400 text-xs font-medium">Yes</span> : <span className="text-slate-600 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(s)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition" title="Edit Status">
                        <Pencil size={16} />
                      </button>
                      {!s.is_system && (
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition" title="Deactivate Status">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
  <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl my-8 sm:my-0 relative">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-100">{editingStatus ? 'Edit Status' : 'Create New Status'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {modalError && <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-md px-3 py-2">{modalError}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Customer Label *</label>
                  <input required value={formData.customer_label} onChange={e => handleNameChange(e.target.value)} className={inputCls} placeholder="e.g. Held at Customs" />
                </div>
                <div>
                  <label className={labelCls}>System Slug</label>
                  <input disabled value={formData.slug} className={`${inputCls} opacity-50 cursor-not-allowed`} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select disabled={editingStatus?.is_system} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Color Badge</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer p-0" />
                    <input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-5">
                   <label className="flex items-center gap-2 text-sm text-slate-300">
                     <input type="checkbox" checked={formData.requires_action} onChange={e => setFormData({...formData, requires_action: e.target.checked})} className="w-4 h-4 accent-blue-500" />
                     Requires Customer Action
                   </label>
                   <label className="flex items-center gap-2 text-sm text-slate-300">
                     <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 accent-blue-500" />
                     Active (visible in dropdowns)
                   </label>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className={labelCls}>State Machine: Where can this status go next?</label>
                <p className="text-[11px] text-slate-500 mb-2">If you don't select any, items will get stuck at this status.</p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-md">
                  {statuses.filter(s => s.id !== editingStatus?.id).map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1 hover:bg-slate-900 rounded">
                      <input type="checkbox" checked={formData.transitions_to.includes(s.id)} onChange={() => toggleTransition(s.id)} className="w-3.5 h-3.5 accent-blue-500" />
                      {s.customer_label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-medium transition">
                  {saving ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}