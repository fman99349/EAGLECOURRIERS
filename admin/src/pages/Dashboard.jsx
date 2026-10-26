import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle2, DollarSign, Loader2, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import api from '../api/client';
import AdminLayout from '../components/AdminLayout';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '6px',
  color: '#f1f5f9',
  fontSize: '12px',
  padding: '6px 10px',
};

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setData(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data || !data.totals) {
    return (
      <AdminLayout>
        <div className="bg-red-950/40 border border-red-900 text-red-300 text-sm rounded-md px-4 py-3">
          {error || 'Failed to load dashboard data.'}
        </div>
      </AdminLayout>
    );
  }

  const totals = data.totals;
  const revenue = Number(totals.total_declared_value || 0);
  const pieData = data.by_status.map((s) => ({ name: s.label, value: s.count, color: s.color }));
  const timelineData = data.timeline.map((t) => ({ ...t, dateLabel: fmtDate(t.date) }));

  return (
    <AdminLayout>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {totals.orders_today} Items{totals.orders_today === 1 ? '' : 's'} created today
          </p>
        </div>
        <Link
          to="/orders/new"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
        >
          <span>New item</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total items" value={totals.orders} icon={Package} color="#60a5fa" href="/orders" subtext={`${totals.orders_this_week} in last 7 days`} />
        <StatCard label="In Transit" value={totals.orders_in_transit} icon={Truck} color="#22d3ee" href="/orders" subtext="Processing or shipped" />
        <StatCard label="Delivered" value={totals.orders_delivered} icon={CheckCircle2} color="#34d399" href="/orders?status=delivered" subtext="Completed shipments" />
        <StatCard label="Declared Value" value={revenue} icon={DollarSign} color="#fbbf24" href="/orders" format={(v) => `$${v.toLocaleString('en-US')}`} subtext={totals.orders_on_hold > 0 ? `${totals.orders_on_hold} on financial hold` : 'No financial holds'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <TrendingUp size={15} className="text-slate-500" />
              <span>Orders · last 14 days</span>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              {timelineData.reduce((a, b) => a + b.count, 0)} total
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#334155' }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#areaGrad)" animationDuration={700} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-300">
            <Activity size={15} className="text-slate-500" />
            <span>Status breakdown</span>
          </div>
          <div className="h-40">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-600 text-xs">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={2} animationDuration={700}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto">
            {pieData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-400 truncate">{s.name}</span>
                </div>
                <span className="text-slate-300 font-medium tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">Recent Items</h3>
            <Link to="/orders" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
          {data.recent_orders.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No items yet.{' '}
              <Link to="/orders/new" className="text-blue-400 hover:text-blue-300">
                Create your first
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {data.recent_orders.map((o) => (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-900/60 -mx-2 px-2 rounded transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-blue-400">{o.order_number}</div>
                    <div className="text-sm text-slate-300 truncate">
                      {o.item_name} <span className="text-slate-600">·</span>{' '}
                      <span className="text-slate-500">{o.from_location} → {o.to_location}</span>
                    </div>
                  </div>
                  <StatusBadge label={o.status_label} color={o.status_color} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">System</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Active statuses</dt>
              <dd className="text-slate-200 tabular-nums font-medium">{data.system.statuses}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Transitions</dt>
              <dd className="text-slate-200 tabular-nums font-medium">{data.system.transitions}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Financial holds</dt>
              <dd className={`tabular-nums font-medium ${totals.orders_on_hold > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                {totals.orders_on_hold}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AdminLayout>
  );
}