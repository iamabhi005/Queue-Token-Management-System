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
    <div className={`group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 ${style.ring}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono-num">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${style.bg} ${style.text} border ${style.border}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      {changeText && (
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span>{changeText}</span>
        </div>
      )}
    </div>
  );
}
