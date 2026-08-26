'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LiveAccumulator } from './live-accumulator';
import { LiveRiseFall } from './live-rise-fall';
import { TradeModeTabs, type TradeMode } from './custom/trade-mode-tabs';
import { useDerivWSContext } from './custom/deriv-ws-provider';
import { useOpenPositions } from '@/hooks/use-open-positions';
import type { AccumulatorsAppConfig } from '@/lib/app-config';

interface FusedTradingAppProps {
  appConfig?: AccumulatorsAppConfig;
}

const ACCU_CONTRACT_TYPES = ['ACCU'];
const RISE_FALL_CONTRACT_TYPES = ['CALL', 'PUT', 'CALLE', 'PUTE'];

export function FusedTradingApp({ appConfig }: FusedTradingAppProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { ws, isConnected, auth } = useDerivWSContext();

  // Read initial trade mode from query param if available
  const tabParam = searchParams.get('trade_type') || searchParams.get('tab');
  const initialMode: TradeMode = tabParam === 'rise-fall' || tabParam === 'rise_fall' ? 'rise-fall' : 'accumulator';

  const [activeTab, setActiveTab] = useState<TradeMode>(initialMode);

  // Sync tab with URL search parameter
  const handleTabChange = useCallback(
    (newTab: TradeMode) => {
      setActiveTab(newTab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('trade_type', newTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // Synchronize with external query changes (e.g. back/forward button)
  useEffect(() => {
    const currentParam = searchParams.get('trade_type') || searchParams.get('tab');
    if (currentParam === 'rise-fall' || currentParam === 'rise_fall') {
      setActiveTab('rise-fall');
    } else if (currentParam === 'accumulator') {
      setActiveTab('accumulator');
    }
  }, [searchParams]);

  // Track open positions count across both modes
  const { positions: allOpenPositions } = useOpenPositions(
    ws,
    isConnected,
    !!auth.wsUrl
  );

  const accuOpenCount = useMemo(
    () => allOpenPositions.filter((p) => ACCU_CONTRACT_TYPES.includes(p.contract_type)).length,
    [allOpenPositions]
  );

  const riseFallOpenCount = useMemo(
    () => allOpenPositions.filter((p) => RISE_FALL_CONTRACT_TYPES.includes(p.contract_type)).length,
    [allOpenPositions]
  );

  const topTabs = (
    <TradeModeTabs
      activeTab={activeTab}
      onTabChange={handleTabChange}
      accumulatorOpenCount={accuOpenCount}
      riseFallOpenCount={riseFallOpenCount}
    />
  );

  return (
    <div className="w-full">
      {activeTab === 'accumulator' ? (
        <LiveAccumulator
          appConfig={appConfig}
          topTabsSlot={topTabs}
        />
      ) : (
        <LiveRiseFall
          topTabsSlot={topTabs}
        />
      )}
    </div>
  );
}
