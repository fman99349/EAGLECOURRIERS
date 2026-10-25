import { Link } from 'react-router-dom';
import { useCountUp } from '../hooks/useCountUp';

export default function StatCard({
  label, value, icon: Icon, color, href, subtext, format = (v) => v.toLocaleString(),
}) {
  const animated = useCountUp(value);

  return (
    <Link
      to={href || '#'}
      className="group block bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 hover:bg-slate-900/80 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        {Icon && <Icon size={16} className="text-slate-600" style={{ color: `${color}88` }} />}
      </div>
      <div className="text-2xl font-semibold tabular-nums text-slate-100">
        {format(animated)}
      </div>
      {subtext && <div className="text-xs text-slate-500 mt-1">{subtext}</div>}
    </Link>
  );
}