"use client";

import { useEffect, useState } from 'react';

export default function ResponsivePreviewToggle() {
  const [mode, setMode] = useState<'laptop' | 'phone'>('laptop');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-preview', mode);
    return () => {
      document.documentElement.removeAttribute('data-preview');
    };
  }, [mode]);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="hidden sm:flex items-center gap-2">
      <button
        className={`px-2 py-1 rounded border ${mode === 'laptop' ? 'bg-gray-200' : ''}`}
        onClick={() => setMode('laptop')}
        aria-pressed={mode === 'laptop'}
      >
        Laptop
      </button>
      <button
        className={`px-2 py-1 rounded border ${mode === 'phone' ? 'bg-gray-200' : ''}`}
        onClick={() => setMode('phone')}
        aria-pressed={mode === 'phone'}
      >
        Phone
      </button>
    </div>
  );
}
