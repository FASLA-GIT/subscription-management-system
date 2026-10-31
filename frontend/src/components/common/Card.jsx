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
      className={`bg-white rounded-2xl border border-[#E2E8F0] shadow-card edge-lighting ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && (
              <h2 className={`text-sm font-bold text-[#111D35] ${titleClassName}`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
