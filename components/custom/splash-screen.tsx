'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete?: () => void;
  autoDismissTimeMs?: number;
}

export function SplashScreen({ onComplete, autoDismissTimeMs = 2000 }: SplashScreenProps) {
  const [isMounted, setIsMounted] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(20);
  const [statusText, setStatusText] = useState('Connecting to real-time market streams...');

  useEffect(() => {
    // Progress progression steps
    const t1 = setTimeout(() => {
      setProgress(55);
      setStatusText('Synchronizing real-time price quotes...');
    }, 450);

    const t2 = setTimeout(() => {
      setProgress(90);
      setStatusText('Loading Accumulators & Rise/Fall engines...');
    }, 1000);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Platform Ready');
    }, 1500);

    const tAuto = setTimeout(() => {
      handleDismiss();
    }, autoDismissTimeMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tAuto);
    };
  }, [autoDismissTimeMs]);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsMounted(false);
      onComplete?.();
    }, 450);
  };

  if (!isMounted) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d0a18] text-white px-4 select-none overflow-hidden transition-all duration-500 ease-out',
        isFadingOut ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      )}
    >
      {/* Ambient Purple Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Center Brand Content */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Glowing Logo Icon */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-700 via-violet-600 to-fuchsia-500 p-0.5 shadow-2xl shadow-purple-600/40 ring-4 ring-purple-500/20">
          <div className="w-full h-full bg-[#130f24] rounded-[14px] flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-purple-400 stroke-[2.2]" />
              <Sparkles className="w-4 h-4 text-fuchsia-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-300 uppercase font-sans">
            EPITOME TRADERS
          </h1>
          <p className="text-xs sm:text-sm font-medium text-purple-300/80 tracking-wide">
            Precision Trading • Accumulators & Rise/Fall
          </p>
        </div>

        {/* Progress / Loading Indicator */}
        <div className="w-full space-y-2 pt-2">
          <div className="h-1.5 w-full bg-purple-950/60 rounded-full overflow-hidden border border-purple-800/30 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-violet-400 to-fuchsia-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-purple-300/70">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              {statusText}
            </span>
            <span className="font-mono font-medium">{progress}%</span>
          </div>
        </div>

        {/* Quick Enter Button for Instant Access */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="h-8 px-4 text-xs font-semibold text-purple-200 border-purple-700/50 bg-purple-950/40 hover:bg-purple-900/60 hover:text-white hover:border-purple-500 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Enter Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
