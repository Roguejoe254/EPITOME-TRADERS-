'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useBuy, useProposal } from '@deriv/core';
import type {
  DerivWS,
  ActiveSymbol,
  Tick,
  BuyResult,
  ProposalInfo,
  ProposalParams,
} from '@deriv/core';
import { useBaseTrading } from '@/hooks/use-base-trading';
import type { UseBaseTradingParams } from '@/hooks/use-base-trading';
import {
  getDurationOptions,
  getDurationUnitLabels,
  computeEndTimeEpoch,
  type DurationOption,
  type DurationSelectUnit,
} from '@/lib/duration-utils';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import type { OpenPosition, ClosedPosition } from '@/lib/types';

const CONTRACT_TYPES = ['CALL', 'PUT', 'CALLE', 'PUTE'];

export interface RiseFallProposalDisplay {
  id: string;
  askPrice: number;
  payout: number;
  profit: number;
  returnPercentage: number;
  longcode: string;
  minStake: number;
  maxPayout: number;
}

export interface UseRiseFallTradingReturn {
  ws: DerivWS | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  currentTick: Tick | null;
  prices: number[];
  pipSize: number;
  
  // Duration config
  duration: number;
  setDuration: (value: number) => void;
  durationUnit: DurationSelectUnit;
  setDurationUnit: (unit: DurationSelectUnit) => void;
  durationOptions: DurationOption[];
  currentDurationOption: DurationOption | undefined;
  expiryDate: Date | undefined;
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
  closedPositions: ClosedPosition[];
  sellContract: (contractId: number, bidPrice: string) => Promise<void>;
  sellingId: number | null;
  sellError: string | null;
  clearSellError: () => void;
}

export type UseRiseFallTradingParams = Pick<
  UseBaseTradingParams,
  'ws' | 'isConnected' | 'isExhausted' | 'isAuthenticated' | 'onAuthWSFailed'
>;

export function useRiseFallTrading({
  ws,
  isConnected,
  isExhausted,
  isAuthenticated,
  onAuthWSFailed,
}: UseRiseFallTradingParams): UseRiseFallTradingReturn {
  const { localize } = useAppTranslations();

  const {
    ws: tradingWs,
    isConnected: tradingIsConnected,
    isLoading,
    error,
    symbols,
    activeSymbol,
    selectSymbol,
    currentTick,
    prices,
    pipSize,
    contracts,
    openPositions: allOpenPositions,
    closedPositions: allClosedPositions,
    sellContract,
    sellingId,
    sellError,
    clearSellError,
  } = useBaseTrading({
    ws,
    isConnected,
    isExhausted,
    isAuthenticated,
    onAuthWSFailed,
    contractTypes: CONTRACT_TYPES,
  });

  const durationLabels = useMemo(() => getDurationUnitLabels(localize), [localize]);

  const durationOptions = useMemo(
    () => getDurationOptions(contracts, durationLabels),
    [contracts, durationLabels]
  );

  const [durationUnit, setDurationUnit] = useState<DurationSelectUnit>('t');
  const [duration, setDuration] = useState<number>(5);
  const [stake, setStake] = useState<string>('10');
  const [basis, setBasis] = useState<'stake' | 'payout'>('stake');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [expiryTime, setExpiryTime] = useState<string>('23:59:00');

  // Keep duration within valid limits when duration options / unit change
  const currentDurationOption = useMemo(
    () => durationOptions.find((opt) => opt.unit === durationUnit),
    [durationOptions, durationUnit]
  );

  useEffect(() => {
    if (durationOptions.length > 0) {
      const exists = durationOptions.some((opt) => opt.unit === durationUnit);
      if (!exists) {
        const firstOpt = durationOptions[0];
        setDurationUnit(firstOpt.unit);
        setDuration(firstOpt.min);
      } else if (currentDurationOption) {
        if (duration < currentDurationOption.min) {
          setDuration(currentDurationOption.min);
        } else if (duration > currentDurationOption.max) {
          setDuration(currentDurationOption.max);
        }
      }
    }
  }, [durationOptions, durationUnit, currentDurationOption, duration]);

  // Determine contract types available (CALL / CALLE / PUT / PUTE)
  const riseContractType = useMemo(() => {
    return contracts.some((c) => c.contract_type === 'CALLE') ? 'CALLE' : 'CALL';
  }, [contracts]);

  const fallContractType = useMemo(() => {
    return contracts.some((c) => c.contract_type === 'PUTE') ? 'PUTE' : 'PUT';
  }, [contracts]);

  // Build proposal params for Rise & Fall
  const riseProposalParams: ProposalParams | null = useMemo(() => {
    if (!activeSymbol || !tradingIsConnected) return null;
    const amountNum = parseFloat(stake);
    if (!amountNum || amountNum <= 0) return null;

    if (durationUnit === 'end-time') {
      const dateExpiry = computeEndTimeEpoch(expiryDate, expiryTime);
      if (!dateExpiry) return null;
      return {
        contractType: riseContractType,
        symbol: activeSymbol.underlying_symbol,
        amount: amountNum,
        duration: 0,
        durationUnit: 'd',
        dateExpiry,
        basis,
        currency: 'USD',
      };
    }

    if (duration <= 0) return null;

    return {
      contractType: riseContractType,
      symbol: activeSymbol.underlying_symbol,
      amount: amountNum,
      duration,
      durationUnit,
      basis,
      currency: 'USD',
    };
  }, [activeSymbol, tradingIsConnected, stake, durationUnit, duration, expiryDate, expiryTime, basis, riseContractType]);

  const fallProposalParams: ProposalParams | null = useMemo(() => {
    if (!activeSymbol || !tradingIsConnected) return null;
    const amountNum = parseFloat(stake);
    if (!amountNum || amountNum <= 0) return null;

    if (durationUnit === 'end-time') {
      const dateExpiry = computeEndTimeEpoch(expiryDate, expiryTime);
      if (!dateExpiry) return null;
      return {
        contractType: fallContractType,
        symbol: activeSymbol.underlying_symbol,
        amount: amountNum,
        duration: 0,
        durationUnit: 'd',
        dateExpiry,
        basis,
        currency: 'USD',
      };
    }

    if (duration <= 0) return null;

    return {
      contractType: fallContractType,
      symbol: activeSymbol.underlying_symbol,
      amount: amountNum,
      duration,
      durationUnit,
      basis,
      currency: 'USD',
    };
  }, [activeSymbol, tradingIsConnected, stake, durationUnit, duration, expiryDate, expiryTime, basis, fallContractType]);

  const { proposal: rawRiseProposal } = useProposal(tradingWs, tradingIsConnected, riseProposalParams);
  const { proposal: rawFallProposal } = useProposal(tradingWs, tradingIsConnected, fallProposalParams);

  const formatProposalDisplay = useCallback((p: ProposalInfo | null): RiseFallProposalDisplay | null => {
    if (!p) return null;
    const profit = Math.max(0, p.payout - p.askPrice);
    const returnPercentage = p.askPrice > 0 ? (profit / p.askPrice) * 100 : 0;
    return {
      id: p.id,
      askPrice: p.askPrice,
      payout: p.payout,
      profit,
      returnPercentage,
      longcode: p.longcode,
      minStake: p.minStake,
      maxPayout: p.maxPayout,
    };
  }, []);

  const riseProposal = useMemo(() => formatProposalDisplay(rawRiseProposal), [rawRiseProposal, formatProposalDisplay]);
  const fallProposal = useMemo(() => formatProposalDisplay(rawFallProposal), [rawFallProposal, formatProposalDisplay]);

  const isProposalLoading = !rawRiseProposal && !rawFallProposal && !!activeSymbol;

  // Buy actions
  const { buyContract: executeBuy, isBuying, buyResult, buyError, clearBuyResult } =
    useBuy(tradingWs, tradingIsConnected);

  const [buyingDirection, setBuyingDirection] = useState<'rise' | 'fall' | null>(null);

  const buyRise = useCallback(async () => {
    if (!rawRiseProposal) return;
    setBuyingDirection('rise');
    try {
      await executeBuy(rawRiseProposal);
    } finally {
      setBuyingDirection(null);
    }
  }, [rawRiseProposal, executeBuy]);

  const buyFall = useCallback(async () => {
    if (!rawFallProposal) return;
    setBuyingDirection('fall');
    try {
      await executeBuy(rawFallProposal);
    } finally {
      setBuyingDirection(null);
    }
  }, [rawFallProposal, executeBuy]);

  // Filter positions specifically for Rise/Fall
  const openPositions = useMemo(
    () => allOpenPositions.filter((p) => CONTRACT_TYPES.includes(p.contract_type)),
    [allOpenPositions]
  );

  const closedPositions = useMemo(
    () => allClosedPositions.filter((p) => CONTRACT_TYPES.includes(p.contract_type)),
    [allClosedPositions]
  );

  return {
    ws: tradingWs,
    isConnected: tradingIsConnected,
    isLoading,
    error,
    symbols,
    activeSymbol,
    selectSymbol,
    currentTick,
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
    isBuyingRise: isBuying && buyingDirection === 'rise',
    isBuyingFall: isBuying && buyingDirection === 'fall',
    buyResult,
    buyError,
    clearBuyResult,
    openPositions,
    closedPositions,
    sellContract,
    sellingId,
    sellError,
    clearSellError,
  };
}
