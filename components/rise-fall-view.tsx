'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Localize } from '@deriv-com/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/custom/footer';
import { Header } from '@/components/custom/header';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useContractMarkers } from '@/hooks/use-contract-markers';
import { RiseFallTradeControls } from './rise-fall-trade-controls';
import type {
  AuthState,
  DerivAccount,
  ActiveSymbol,
  BuyResult,
} from '@deriv/core';
import type { DurationOption, DurationSelectUnit } from '@/lib/duration-utils';
import type { RiseFallProposalDisplay } from '@/hooks/use-rise-fall-trading';
import type { UseSmartChartsApiReturn } from '@/hooks/use-smartcharts-api';
import type { SmartChartChartData } from '@/hooks/use-smartchart-chart-data';
import type { OpenPosition } from '@/lib/types';

const RiseFallChart = dynamic(
  () => import('./rise-fall-chart').then((module) => module.RiseFallChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-md border border-border/50 dark:border-white/[0.08] bg-muted/30" />
    ),
  }
);

export interface RiseFallViewProps {
  // Auth
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;

  // Connection / loading
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Market data
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  prices?: number[];
  pipSize?: number;

  // Duration
  duration: number;
  setDuration: (value: number) => void;
  durationUnit: DurationSelectUnit;
  setDurationUnit: (unit: DurationSelectUnit) => void;
  durationOptions: DurationOption[];
  currentDurationOption?: DurationOption;
  expiryDate?: Date;
  setExpiryDate: (date: Date | undefined) => void;
  expiryTime: string;
  setExpiryTime: (time: string) => void;

  // Stake & Basis
  stake: string;
  setStake: (value: string) => void;
  basis: 'stake' | 'payout';
  setBasis: (basis: 'stake' | 'payout') => void;

  // Proposals
  riseProposal: RiseFallProposalDisplay | null;
  fallProposal: RiseFallProposalDisplay | null;
  isProposalLoading: boolean;

  // Trade Execution
  buyRise: () => Promise<void>;
  buyFall: () => Promise<void>;
  isBuying: boolean;
  isBuyingRise: boolean;
  isBuyingFall: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;

  // Positions
  openPositions: OpenPosition[];
  sellContract: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;

  // Chart data
  chartData: SmartChartChartData | undefined;
  getQuotes: UseSmartChartsApiReturn['getQuotes'];
  subscribeQuotes: UseSmartChartsApiReturn['subscribeQuotes'];
  unsubscribeQuotes: UseSmartChartsApiReturn['unsubscribeQuotes'];
  isLive?: boolean;
  endEpoch?: number;

  // Branding
  logoSrc?: string;
  appName?: string;
  showAppName?: boolean;

  // Optional top tab slots
  topTabsSlot?: React.ReactNode;
}

export function RiseFallView({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onSignUp,
  onLogout,
  onSwitchAccount,
  isConnected,
  isLoading,
  error,
  symbols,
  activeSymbol,
  selectSymbol,
  prices,
  pipSize,
  duration,
  setDuration,
  durationUnit,
  setDurationUnit,
  durationOptions,
  currentDurationOption,
  expiryDate,
  setExpiryDate,
  expiryTime,
  setExpiryTime,
  stake,
  setStake,
  basis,
  setBasis,
  riseProposal,
  fallProposal,
  isProposalLoading,
  buyRise,
  buyFall,
  isBuying,
  isBuyingRise,
  isBuyingFall,
  buyResult,
  buyError,
  clearBuyResult,
  openPositions,
  sellContract,
  sellingId,
  chartData,
  getQuotes,
  subscribeQuotes,
  unsubscribeQuotes,
  isLive,
  endEpoch,
  logoSrc,
  appName,
  showAppName,
  topTabsSlot,
}: RiseFallViewProps) {
  const isMobile = useIsMobile();
  const contractMarkers = useContractMarkers(openPositions, activeSymbol?.underlying_symbol, isMobile);

  const headerEl = useMemo(() => {
    return (
      <Header
        authState={authState}
        accounts={accounts}
        activeAccount={activeAccount}
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
        onSwitchAccount={onSwitchAccount}
        logoSrc={logoSrc}
        appName={appName}
        showAppName={showAppName}
        actions={<ThemeToggle />}
      />
    );
  }, [
    authState,
    accounts,
    activeAccount,
    onLogin,
    onSignUp,
    onLogout,
    onSwitchAccount,
    logoSrc,
    appName,
    showAppName,
  ]);

  const chartBlock = useMemo(
    () => (
      <div className="relative max-lg:h-[50dvh] lg:h-[min(33.6rem,66vh)] lg:min-h-[384px]">
        <div className="h-full">
          {chartData ? (
            <RiseFallChart
              symbolKey="rise-fall-chart"
              symbol={activeSymbol?.underlying_symbol}
              isConnectionOpened={isConnected}
              isMobile={isMobile}
              chartData={chartData}
              getQuotes={getQuotes}
              subscribeQuotes={subscribeQuotes}
              unsubscribeQuotes={unsubscribeQuotes}
              onSymbolChange={selectSymbol}
              isLive={isLive}
              endEpoch={endEpoch}
              contractsArray={contractMarkers}
            />
          ) : (
            <Skeleton className="h-full w-full rounded-md" />
          )}
        </div>
      </div>
    ),
    [
      chartData,
      activeSymbol,
      isConnected,
      isMobile,
      getQuotes,
      subscribeQuotes,
      unsubscribeQuotes,
      selectSymbol,
      isLive,
      endEpoch,
      contractMarkers,
    ]
  );

  if (error) {
    return (
      <main className="flex flex-col bg-background items-center justify-center px-4 min-h-dvh">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">
              <Localize i18n_default_text="Connection Error" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col bg-background max-lg:h-dvh lg:overflow-visible">
      {headerEl}
      
      {/* Spacer to push content below fixed header */}
      <div className={authState === 'authenticated' ? 'h-[76px] shrink-0' : 'h-[66px] shrink-0'} />

      {/* Top Tabs Slot */}
      {topTabsSlot && (
        <div className="w-full max-w-7xl mx-auto px-3 pt-2 sm:px-4 sm:pt-3">
          {topTabsSlot}
        </div>
      )}

      {/* 2-column layout on desktop, responsive stack on mobile */}
      <div className="flex w-full max-w-7xl mx-auto flex-col px-3 py-2 sm:px-4 sm:py-3 gap-2 sm:gap-3 max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-hidden lg:flex-none lg:overflow-visible">
        <div className="max-lg:flex max-lg:flex-col max-lg:flex-1 max-lg:min-h-0 lg:grid lg:grid-cols-[1fr_400px] lg:gap-4">
          {/* Column 1: Chart */}
          <div className="max-lg:shrink-0 flex flex-col gap-2 max-lg:pb-2 pt-1 lg:py-0">
            {chartBlock}
          </div>

          {/* Column 2: Trade controls in a Card */}
          <div className="max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:border-t max-lg:border-border max-lg:pt-3 max-lg:pb-24 lg:pt-0 flex flex-col gap-3">
            {isLoading ? (
              <Skeleton className="lg:h-[min(33.6rem,66vh)] lg:min-h-[384px] max-lg:h-48 w-full rounded-xl" />
            ) : (
              <Card className="lg:h-[min(33.6rem,66vh)] lg:min-h-[384px] lg:overflow-y-auto shadow-xs">
                <CardContent className="pt-4">
                  <RiseFallTradeControls
                    isConnected={isConnected}
                    duration={duration}
                    onDurationChange={setDuration}
                    durationUnit={durationUnit}
                    onDurationUnitChange={setDurationUnit}
                    durationOptions={durationOptions}
                    currentDurationOption={currentDurationOption}
                    expiryDate={expiryDate}
                    onExpiryDateChange={setExpiryDate}
                    expiryTime={expiryTime}
                    onExpiryTimeChange={setExpiryTime}
                    stake={stake}
                    onStakeChange={setStake}
                    basis={basis}
                    onBasisChange={setBasis}
                    riseProposal={riseProposal}
                    fallProposal={fallProposal}
                    isProposalLoading={isProposalLoading}
                    onBuyRise={buyRise}
                    onBuyFall={buyFall}
                    isBuying={isBuying}
                    isBuyingRise={isBuyingRise}
                    isBuyingFall={isBuyingFall}
                    buyResult={buyResult}
                    buyError={buyError}
                    onClearBuyResult={clearBuyResult}
                    openPositions={openPositions}
                    onSell={sellContract}
                    sellingId={sellingId}
                    isAuthenticated={authState === 'authenticated'}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 py-2 text-center bg-background/80 backdrop-blur-sm">
        <Footer />
      </div>
    </main>
  );
}
