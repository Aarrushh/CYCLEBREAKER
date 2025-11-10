"use client";

import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';

export default function OfflineIndicatorBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[color:var(--warning)]/90 text-white px-md py-sm flex items-center justify-between shadow-md">
      <div className="flex items-center gap-sm">
        <WifiOff className="w-5 h-5" />
        <span className="text-sm font-semibold">Offline Mode • Updates will sync when reconnected</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 rounded focus:outline-none"
        aria-label="Dismiss offline indicator"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
