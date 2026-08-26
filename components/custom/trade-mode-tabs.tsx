'use client';

import { useAppTranslations } from '@/components/custom/i18n-provider';
import { Localize } from '@deriv-com/translations';
import { cn } from '@/lib/utils';
import { TrendingUp, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type TradeMode = 'accumulator' | 'rise-fall';

interface TradeModeTabsProps {
  activeTab: TradeMode;
  onTabChange: (tab: TradeMode) => void;
  accumulatorOpenCount?: number;
  riseFallOpenCount?: number;
  className?: string;
}

export function TradeModeTabs({
  activeTab,
  onTabChange,
  accumulatorOpenCount = 0,
  riseFallOpenCount = 0,
  className,
}: TradeModeTabsProps) {
  const { localize } = useAppTranslations();

  const tabs: { id: TradeMode; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    {
      id: 'accumulator',
      label: localize('Accumulators'),
      icon: <Layers className="h-3.5 w-3.5" />,
      badgeCount: accumulatorOpenCount,
    },
    {
      id: 'rise-fall',
      label: localize('Rise / Fall'),
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      badgeCount: riseFallOpenCount,
    },
  ];

  return (
    <div className={cn('w-full flex items-center justify-start overflow-x-auto no-scrollbar py-1', className)}>
      <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60 shadow-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all select-none whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-background text-foreground shadow-xs ring-1 ring-border/50 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              )}
            >
              <span className={cn('transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className={cn(
                    'h-4 min-w-4 px-1 text-[10px] font-bold rounded-full leading-none flex items-center justify-center',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                  )}
                >
                  {tab.badgeCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
