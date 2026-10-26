import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Package, Eye, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';

const LIMIT = 10;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Modal State
  const [editingOrder, setEditingOrder] = useState(null);
  const [validStatuses, setValidStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [location, setLocation] = useState(''); // 🆕 New state for location
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  async function load(term = '', currentPage = 0) {
    setLoading(true);
    try {
      const params = { limit: LIMIT, offset: currentPage * LIMIT };
      if (term) params.search = term;
      
      const res = await api.get('/orders', { params });
      setOrders(res.data.orders);
      setTotal(res.data.total);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(search, page); }, [page]); // eslint-disable-line

  function handleSearch(e) {
    e.preventDefault();
    setPage(0);
    load(search, 0);
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    try {
      await api.delete(`/orders/${id}`);
      load(search, page);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete item');
    }
  }

  async function openEditModal(order) {
    setEditingOrder(order);
    setNewStatus('');
    setNote('');
    try {
      const res = await api.get(`/orders/${order.id}`);
      setValidStatuses(res.data.statuses || []); // Fallback if fetching all
      // Fetch all statuses for the dropdown
      const allStatusesRes = await api.get('/statuses');
      setValidStatuses(allStatusesRes.data.statuses);
      
      // Pre-fill current location
      setLocation(res.data.order.current_location || '');
    } catch (err) {
      alert('Failed to load status options');
    }
  }

  async function handleUpdateStatus(e) {
    e.preventDefault();
    if (!newStatus) return;
    setUpdating(true);
    try {
      await api.post(`/orders/${editingOrder.id}/status`, {
        to_status_slug: newStatus,
        note: note || undefined,
        force_override: true,
        current_location: location // 🆕 Send location to backend
      });
      setEditingOrder(null);
      load(search, page);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Items</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} item{total === 1 ? '' : 's'} found</p>
        </div>
        <Link to="/orders/new" className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors">
          <span>New Item</span>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tracking #, recipient, item name…"
          className="flex-1 bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
        />
        <button type="submit" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm rounded-md transition-colors">
          Search
        </button>
      </form>

      {error && <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-sm rounded-md px-4 py-3 mb-3">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-10 text-center">
          <div className="inline-flex w-10 h-10 rounded-md bg-slate-800 items-center justify-center text-slate-500 mb-3"><Package size={18} /></div>
          <div className="text-slate-300 text-sm font-medium">No items found</div>
          <p className="text-slate-500 text-xs mt-1.5">{search ? `No results for "${search}".` : 'Create your first item to get started.'}</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Tracking #</th>
                <th className="text-left px-4 py-2.5 font-medium">Item Name</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Route</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-900/80 transition-colors group">
                  <td className="px-4 py-3 font-mono text-xs text-blue-400">{o.order_number}</td>
                  <td className="px-4 py-3 text-slate-200 truncate max-w-xs">{o.item_name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell whitespace-nowrap">
                    {o.from_location} <span className="text-slate-600">→</span> {o.to_location}
                  </td>
                  <td className="px-4 py-3"><StatusBadge label={o.status_label} color={o.status_color} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Link to={`/orders/${o.id}`} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition" title="View Details">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => openEditModal(o)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition" title="Update Status">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(o.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition" title="Delete Item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md disabled:opacity-50 hover:bg-slate-700 transition">
              <ChevronLeft size={14} /> Prev
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md disabled:opacity-50 hover:bg-slate-700 transition">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm shadow-2xl my-8 sm:my-0 relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100">Update Status</h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-4 sm:p-5 space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-md">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Item</div>
                <div className="text-sm text-slate-200 font-medium truncate">{editingOrder.item_name}</div>
                <div className="text-xs font-mono text-blue-400 mt-0.5">{editingOrder.order_number}</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">New Status *</label>
                <select required value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="">— Select —</option>
                  {validStatuses.map(s => <option key={s.id} value={s.slug}>{s.customer_label}</option>)}
                </select>
              </div>

              {/* 🆕 Current Location Input */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Current Location *</label>
                <input 
                  type="text" 
                  required
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500" 
                  placeholder="e.g. London Heathrow Hub" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Note (optional)</label>
                <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none" placeholder="Message for the customer..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingOrder(null)} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={updating || !newStatus || !location} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition">
                  {updating ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}