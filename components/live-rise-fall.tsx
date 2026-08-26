'use client';

import { useSmartChartsApi } from '@/hooks/use-smartcharts-api';
import { useSmartChartChartData } from '@/hooks/use-smartchart-chart-data';
import { useRiseFallTrading } from '@/hooks/use-rise-fall-trading';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { RiseFallView } from './rise-fall-view';

export function LiveRiseFall({
  logoSrc: logoSrcOverride,
  appName,
  showAppName,
  topTabsSlot,
}: {
  logoSrc?: string;
  appName?: string;
  showAppName?: boolean;
  topTabsSlot?: React.ReactNode;
}) {
  const providerLogo = useLogoSrc();
  const logoSrc = logoSrcOverride ?? providerLogo;
  const { ws, isConnected, isExhausted, auth } = useDerivWSContext();
  const { authState, accounts, activeAccount, login, signUp, logout, switchAccount } = auth;

  const trading = useRiseFallTrading({
    ws,
    isConnected,
    isExhausted,
    isAuthenticated: !!auth.wsUrl,
    onAuthWSFailed: logout,
  });

  const { chartData } = useSmartChartChartData(trading.ws, trading.isConnected, trading.symbols);
  const { getQuotes, subscribeQuotes, unsubscribeQuotes } = useSmartChartsApi(trading.ws);

  return (
    <RiseFallView
      authState={authState}
      accounts={accounts}
      activeAccount={activeAccount}
      onLogin={login}
      onSignUp={signUp}
      onLogout={logout}
      onSwitchAccount={switchAccount}
      logoSrc={logoSrc}
      appName={appName}
      showAppName={showAppName}
      isConnected={trading.isConnected}
      isLoading={trading.isLoading}
      error={trading.error}
      symbols={trading.symbols}
      activeSymbol={trading.activeSymbol}
      selectSymbol={trading.selectSymbol}
      prices={trading.prices}
      pipSize={trading.pipSize}
      duration={trading.duration}
      setDuration={trading.setDuration}
      durationUnit={trading.durationUnit}
      setDurationUnit={trading.setDurationUnit}
      durationOptions={trading.durationOptions}
      currentDurationOption={trading.currentDurationOption}
      expiryDate={trading.expiryDate}
      setExpiryDate={trading.setExpiryDate}
      expiryTime={trading.expiryTime}
      setExpiryTime={trading.setExpiryTime}
      stake={trading.stake}
      setStake={trading.setStake}
      basis={trading.basis}
      setBasis={trading.setBasis}
      riseProposal={trading.riseProposal}
      fallProposal={trading.fallProposal}
      isProposalLoading={trading.isProposalLoading}
      buyRise={trading.buyRise}
      buyFall={trading.buyFall}
      isBuying={trading.isBuying}
      isBuyingRise={trading.isBuyingRise}
      isBuyingFall={trading.isBuyingFall}
      buyResult={trading.buyResult}
      buyError={trading.buyError}
      clearBuyResult={trading.clearBuyResult}
      openPositions={trading.openPositions}
      sellContract={trading.sellContract}
      sellingId={trading.sellingId}
      chartData={chartData}
      getQuotes={getQuotes}
      subscribeQuotes={subscribeQuotes}
      unsubscribeQuotes={unsubscribeQuotes}
      topTabsSlot={topTabsSlot}
    />
  );
}
