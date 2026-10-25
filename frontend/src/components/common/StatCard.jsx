import React from 'react';

export default function StatCard({ title, value, icon: Icon, changeText, color = 'blue' }) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      ring: 'group-hover:border-blue-300'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      ring: 'group-hover:border-purple-300'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      ring: 'group-hover:border-emerald-300'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      ring: 'group-hover:border-amber-300'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      ring: 'group-hover:border-rose-300'
    }
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`group bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 ${style.ring}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 truncate">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-mono-num truncate">
            {value}
          </h3>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl ${style.bg} ${style.text} border ${style.border} shrink-0`}>
          {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>
      </div>
      {changeText && (
        <div className="mt-2.5 sm:mt-3 flex items-center text-[11px] sm:text-xs text-slate-500 truncate">
          <span className="truncate">{changeText}</span>
        </div>
      )}
    </div>
  );
}
