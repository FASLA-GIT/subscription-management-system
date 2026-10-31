import React from 'react';

export default function Card({ 
  children, 
  title, 
  subtitle, 
  actions, 
  className = '',
  titleClassName = '',
}) {
  return (
    <section 
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-150 ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && (
              <h2 className={`text-base font-semibold text-slate-900 ${titleClassName}`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

