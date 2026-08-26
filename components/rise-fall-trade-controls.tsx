'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Localize } from '@deriv-com/translations';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  Calendar as CalendarIcon,
  Clock,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { LANGUAGE_LOCALES } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { BuyResult } from '@deriv/core';
import type { DurationOption, DurationSelectUnit } from '@/lib/duration-utils';
import type { RiseFallProposalDisplay } from '@/hooks/use-rise-fall-trading';
import type { OpenPosition } from '@/lib/types';
import { format } from 'date-fns';

interface RiseFallTradeControlsProps {
  isConnected: boolean;
  
  // Duration
  duration: number;
  onDurationChange: (value: number) => void;
  durationUnit: DurationSelectUnit;
  onDurationUnitChange: (unit: DurationSelectUnit) => void;
  durationOptions: DurationOption[];
  currentDurationOption?: DurationOption;
  expiryDate?: Date;
  onExpiryDateChange: (date: Date | undefined) => void;
  expiryTime: string;
  onExpiryTimeChange: (time: string) => void;

  // Stake & Basis
  stake: string;
  onStakeChange: (value: string) => void;
  basis: 'stake' | 'payout';
  onBasisChange: (basis: 'stake' | 'payout') => void;

  // Proposals
  riseProposal: RiseFallProposalDisplay | null;
  fallProposal: RiseFallProposalDisplay | null;
  isProposalLoading: boolean;

  // Actions
  onBuyRise: () => void;
  onBuyFall: () => void;
  isBuying: boolean;
  isBuyingRise: boolean;
  isBuyingFall: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  onClearBuyResult: () => void;

  // Positions
  openPositions?: OpenPosition[];
  onSell?: (contractId: number, bidPrice: string) => void;
  sellingId?: number | null;
  isAuthenticated?: boolean;
}

export function RiseFallTradeControls({
  isConnected,
  duration,
  onDurationChange,
  durationUnit,
  onDurationUnitChange,
  durationOptions,
  currentDurationOption,
  expiryDate,
  onExpiryDateChange,
  expiryTime,
  onExpiryTimeChange,
  stake,
  onStakeChange,
  basis,
  onBasisChange,
  riseProposal,
  fallProposal,
  isProposalLoading,
  onBuyRise,
  onBuyFall,
  isBuying,
  isBuyingRise,
  isBuyingFall,
  buyResult,
  buyError,
  onClearBuyResult,
  openPositions = [],
  onSell,
  sellingId,
  isAuthenticated,
}: RiseFallTradeControlsProps) {
  const { currentLang, localize } = useAppTranslations();
  const numberLocale = LANGUAGE_LOCALES[currentLang];
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (buyError) {
      toast.error(localize('Purchase Failed'), { description: buyError });
      onClearBuyResult();
    }
  }, [buyError, onClearBuyResult, localize]);

  useEffect(() => {
    if (buyResult) {
      toast.success(localize('Contract Purchased'), {
        description: localize(
          'Buy price: {{buy_price}} USD | Payout: {{payout}} USD | Balance: {{balance}} USD',
          {
            buy_price: buyResult.buyPrice.toFixed(2),
            payout: buyResult.payout.toFixed(2),
            balance: buyResult.balanceAfter.toFixed(2),
          }
        ),
      });
      onClearBuyResult();
    }
  }, [buyResult, onClearBuyResult, localize]);

  // Stepper handlers
  const handleStepDuration = (delta: number) => {
    if (!currentDurationOption) return;
    const next = duration + delta;
    if (next >= currentDurationOption.min && next <= currentDurationOption.max) {
      onDurationChange(next);
    }
  };

  const handleQuickDuration = (val: number) => {
    if (!currentDurationOption) return;
    if (val >= currentDurationOption.min && val <= currentDurationOption.max) {
      onDurationChange(val);
    }
  };

  const handleQuickStake = (add: number) => {
    const current = parseFloat(stake) || 0;
    onStakeChange(Math.max(1, current + add).toFixed(0));
  };

  // Preset chips based on unit
  const durationPresets = () => {
    if (durationUnit === 't') return [1, 5, 10];
    if (durationUnit === 's') return [15, 30, 45];
    if (durationUnit === 'm') return [1, 5, 15, 30];
    if (durationUnit === 'h') return [1, 2, 4, 8];
    if (durationUnit === 'd') return [1, 7, 14, 30];
    return [];
  };

  return (
    <div className="w-full space-y-3 lg:max-w-[400px] lg:space-y-4">
      {/* Duration Control */}
      <div className="space-y-1.5 rounded-lg border border-border/70 bg-card p-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              <Localize i18n_default_text="Duration" />
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] text-muted-foreground">
                    <Info className="h-2.5 w-2.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="text-xs">
                    <Localize i18n_default_text="Set how long the trade stays open before determining if it closes higher (Rise) or lower (Fall)." />
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {currentDurationOption && durationUnit !== 'end-time' && (
            <span className="text-[11px] text-muted-foreground">
              {currentDurationOption.min} - {currentDurationOption.max} {currentDurationOption.label}
            </span>
          )}
        </div>

        {/* Unit & Value Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Unit selector */}
          <Select
            value={durationUnit}
            onValueChange={(val) => onDurationUnitChange(val as DurationSelectUnit)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map((opt) => (
                <SelectItem key={opt.unit} value={opt.unit} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stepper or End-Time Date */}
          {durationUnit === 'end-time' ? (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-9 justify-start text-left text-xs font-normal',
                    !expiryDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {expiryDate ? format(expiryDate, 'PP') : <span>Pick date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={(d) => {
                    onExpiryDateChange(d);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <div className="relative flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-0.5 z-10 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => handleStepDuration(-1)}
                disabled={currentDurationOption ? duration <= currentDurationOption.min : false}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={duration}
                onChange={(e) => onDurationChange(parseInt(e.target.value, 10) || 0)}
                className="h-9 px-8 text-center text-xs font-semibold"
                min={currentDurationOption?.min ?? 1}
                max={currentDurationOption?.max ?? 365}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0.5 z-10 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => handleStepDuration(1)}
                disabled={currentDurationOption ? duration >= currentDurationOption.max : false}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* End-time time selector */}
        {durationUnit === 'end-time' && (
          <div className="flex items-center gap-2 pt-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="time"
              step="1"
              value={expiryTime}
              onChange={(e) => onExpiryTimeChange(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        )}

        {/* Quick presets */}
        {durationPresets().length > 0 && (
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
            {durationPresets().map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={duration === preset ? 'secondary' : 'outline'}
                size="sm"
                className={cn(
                  'h-6 px-2 text-[11px] rounded-md font-medium transition-colors',
                  duration === preset && 'bg-primary/15 text-primary border-primary/30'
                )}
                onClick={() => handleQuickDuration(preset)}
              >
                {preset} {currentDurationOption?.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Stake & Basis Control */}
      <div className="space-y-1.5 rounded-lg border border-border/70 bg-card p-3 shadow-xs">
        <div className="flex items-center justify-between">
          <Label htmlFor="rf-stake" className="text-xs font-medium text-muted-foreground">
            <Localize i18n_default_text="Amount" />
          </Label>
          <div className="flex items-center rounded-md bg-muted/60 p-0.5">
            <button
              type="button"
              className={cn(
                'px-2 py-0.5 text-[11px] font-medium rounded transition-all',
                basis === 'stake'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onBasisChange('stake')}
            >
              <Localize i18n_default_text="Stake" />
            </button>
            <button
              type="button"
              className={cn(
                'px-2 py-0.5 text-[11px] font-medium rounded transition-all',
                basis === 'payout'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onBasisChange('payout')}
            >
              <Localize i18n_default_text="Payout" />
            </button>
          </div>
        </div>

        <Input
          id="rf-stake"
          type="number"
          value={stake}
          onChange={(e) => onStakeChange(e.target.value)}
          onKeyDown={(e) => {
            if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
          }}
          min={0.35}
          step="1"
          labelRight="USD"
          className="h-9 text-sm font-semibold"
        />

        {/* Quick Amount Chips */}
        <div className="flex items-center gap-1.5 pt-1">
          {[5, 10, 25, 50, 100].map((chip) => (
            <Button
              key={chip}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 flex-1 px-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              onClick={() => handleQuickStake(chip)}
            >
              +{chip}
            </Button>
          ))}
        </div>
      </div>

      {/* Dual Trade Action Cards (Rise / Fall) */}
      <div className="grid grid-cols-2 gap-3 max-lg:fixed max-lg:bottom-[calc(env(safe-area-inset-bottom)+2.5rem)] max-lg:left-3 max-lg:right-3 max-lg:z-40 lg:static">
        {/* Rise Button */}
        <Button
          type="button"
          disabled={!isConnected || !riseProposal || isBuying}
          onClick={onBuyRise}
          className={cn(
            'group relative flex flex-col items-stretch justify-between p-3 rounded-xl shadow-md transition-all h-auto min-h-[72px]',
            'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white border-0 dark:bg-emerald-600 dark:hover:bg-emerald-500'
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1 font-bold text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 stroke-[2.5]" />
              <Localize i18n_default_text="Rise" />
            </span>
            {riseProposal && (
              <Badge className="bg-emerald-950/40 text-emerald-100 hover:bg-emerald-950/40 text-[10px] px-1.5 py-0 border-emerald-400/30">
                +{riseProposal.returnPercentage.toFixed(1)}%
              </Badge>
            )}
          </div>

          <div className="flex items-end justify-between w-full mt-1.5 pt-1.5 border-t border-white/15 text-left">
            <div>
              <span className="block text-[10px] text-emerald-100/80 leading-none">
                {basis === 'stake' ? localize('Payout') : localize('Stake')}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                {riseProposal
                  ? (basis === 'stake' ? riseProposal.payout : riseProposal.askPrice).toLocaleString(numberLocale, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '--'}{' '}
                USD
              </span>
            </div>
            {isBuyingRise && (
              <span className="text-[10px] font-semibold animate-pulse text-emerald-100">
                <Localize i18n_default_text="Buying..." />
              </span>
            )}
          </div>
        </Button>

        {/* Fall Button */}
        <Button
          type="button"
          disabled={!isConnected || !fallProposal || isBuying}
          onClick={onBuyFall}
          className={cn(
            'group relative flex flex-col items-stretch justify-between p-3 rounded-xl shadow-md transition-all h-auto min-h-[72px]',
            'bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white border-0 dark:bg-rose-600 dark:hover:bg-rose-500'
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1 font-bold text-sm sm:text-base">
              <TrendingDown className="h-4 w-4 stroke-[2.5]" />
              <Localize i18n_default_text="Fall" />
            </span>
            {fallProposal && (
              <Badge className="bg-rose-950/40 text-rose-100 hover:bg-rose-950/40 text-[10px] px-1.5 py-0 border-rose-400/30">
                +{fallProposal.returnPercentage.toFixed(1)}%
              </Badge>
            )}
          </div>

          <div className="flex items-end justify-between w-full mt-1.5 pt-1.5 border-t border-white/15 text-left">
            <div>
              <span className="block text-[10px] text-rose-100/80 leading-none">
                {basis === 'stake' ? localize('Payout') : localize('Stake')}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                {fallProposal
                  ? (basis === 'stake' ? fallProposal.payout : fallProposal.askPrice).toLocaleString(numberLocale, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '--'}{' '}
                USD
              </span>
            </div>
            {isBuyingFall && (
              <span className="text-[10px] font-semibold animate-pulse text-rose-100">
                <Localize i18n_default_text="Buying..." />
              </span>
            )}
          </div>
        </Button>
      </div>

      {/* Active Running Positions List */}
      {openPositions.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              <Localize i18n_default_text="Open Rise/Fall Positions" />
            </span>
            <Badge variant="outline" className="text-[11px] h-5">
              {openPositions.length}
            </Badge>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
            {openPositions.map((pos) => {
              const profit = parseFloat(pos.profit);
              const isProfit = profit >= 0;
              const isRise = pos.contract_type === 'CALL' || pos.contract_type === 'CALLE';

              return (
                <div
                  key={pos.contract_id}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-card p-2.5 text-xs shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 font-bold text-[11px] px-1.5 py-0.2 rounded',
                          isRise
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {isRise ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {isRise ? 'Rise' : 'Fall'}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        ${parseFloat(pos.buy_price).toFixed(2)}
                      </span>
                    </div>
                    {pos.tick_count && pos.tick_stream ? (
                      <span className="text-[10px] text-muted-foreground">
                        Tick: {pos.tick_stream.length}/{pos.tick_count}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span
                        className={cn(
                          'block font-bold text-xs',
                          isProfit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {isProfit ? '+' : ''}
                        {profit.toFixed(2)} {pos.currency}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Bid: {parseFloat(pos.bid_price).toFixed(2)}
                      </span>
                    </div>

                    {onSell && pos.is_valid_to_sell === 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2"
                        disabled={sellingId === pos.contract_id}
                        onClick={() => onSell(pos.contract_id, pos.bid_price)}
                      >
                        {sellingId === pos.contract_id ? (
                          <Localize i18n_default_text="Selling..." />
                        ) : (
                          <Localize i18n_default_text="Sell" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports link */}
      {isAuthenticated && (
        <Button
          asChild
          variant="ghost"
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          <Link href="/reports">
            <Localize i18n_default_text="View your positions →" />
          </Link>
        </Button>
      )}
    </div>
  );
}
