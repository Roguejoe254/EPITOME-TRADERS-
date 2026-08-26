'use client';

import { Suspense, useEffect, useState } from 'react';
import { FusedTradingApp } from '@/components/fused-trading-app';
import { SplashScreen } from '@/components/custom/splash-screen';
import { normalizeAppConfig, type AccumulatorsAppConfig } from '@/lib/app-config';

export default function HomePage() {
  const [config, setConfig] = useState<AccumulatorsAppConfig | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    fetch(`${base}/app-config.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setConfig(normalizeAppConfig(data));
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Suspense fallback={<div className="min-h-dvh bg-background" />}>
        <FusedTradingApp appConfig={config ?? undefined} />
      </Suspense>
    </>
  );
}

