import React, { useState, useEffect } from "react";
import { Clock, Flame, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const getRemainingTime = (endTime) => {
  if (!endTime) return { isExpired: true, total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const total = end - now;

  if (total <= 0 || isNaN(total)) {
    return { isExpired: true, total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { isExpired: false, total, days, hours, minutes, seconds };
};

const CountdownBadge = ({ endTime, isActive = true }) => {
  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime(endTime));

  useEffect(() => {
    // Immediate initial sync
    setTimeLeft(getRemainingTime(endTime));

    const interval = setInterval(() => {
      const remaining = getRemainingTime(endTime);
      setTimeLeft(remaining);
      if (remaining.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime) {
    return (
      <Badge variant="outline" className="text-muted-foreground text-xs font-normal">
        No End Time
      </Badge>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
        <AlertCircle className="size-3 text-zinc-500" />
        <span>Expired</span>
      </span>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const pad = (n) => String(n).padStart(2, "0");

  const formattedTime =
    days > 0
      ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <Clock className="size-3 text-amber-500" />
        <span>{formattedTime} (Paused)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <Flame className="size-3 text-emerald-600 dark:text-emerald-400" />
      <span className="font-mono tracking-tight">{formattedTime}</span>
    </span>
  );
};

export default CountdownBadge;
