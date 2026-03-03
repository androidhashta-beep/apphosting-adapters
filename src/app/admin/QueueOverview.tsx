'use client';

import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { collection, getDocs, writeBatch, doc, setDoc, getDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { Ticket, Settings } from '@/lib/types';
import { Icon } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw, Users, Clock } from 'lucide-react';

// ── Colour palette cycling per service ──────────────────────────────────────
const SERVICE_PALETTES = [
  { dark: '#1B3A6B', mid: '#2A5298' },
  { dark: '#1A7B8A', mid: '#2AA3B6' },
  { dark: '#6B3FA0', mid: '#9B59D0' },
  { dark: '#C0392B', mid: '#E74C3C' },
  { dark: '#1E7A4E', mid: '#27AE72' },
  { dark: '#B85C00', mid: '#E67E22' },
  { dark: '#2C3E50', mid: '#3D5A72' },
  { dark: '#7D3C98', mid: '#A569BD' },
];

// ── Status helpers ───────────────────────────────────────────────────────────
function getStatus(count: number): 'normal' | 'warning' | 'critical' {
  if (count >= 20) return 'critical';
  if (count >= 10) return 'warning';
  return 'normal';
}

function statusLabel(status: 'normal' | 'warning' | 'critical') {
  if (status === 'critical') return 'BUSY';
  if (status === 'warning') return 'ACTIVE';
  return 'NORMAL';
}

function statusColors(status: 'normal' | 'warning' | 'critical') {
  if (status === 'critical') return { badge: '#DC2626', badgeBg: '#FEE2E2', bar: '#EF4444', number: '#FECACA' };
  if (status === 'warning') return { badge: '#D97706', badgeBg: '#FEF3C7', bar: '#F59E0B', number: '#FDE68A' };
  return { badge: '#16A34A', badgeBg: '#DCFCE7', bar: '#4ADE80', number: '#FFFFFF' };
}

// ── Main component ───────────────────────────────────────────────────────────
export function QueueOverview({ showReset = true }: { showReset?: boolean }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [lastReset, setLastReset] = useState<string>('—');
  const resetScheduledRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ticketsRef  = useMemoFirebase(() => firestore ? collection(firestore, 'tickets')      : null, [firestore]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'app')     : null, [firestore]);

  const { data: tickets }  = useCollection<Ticket>(ticketsRef);
  const { data: settings } = useDoc<Settings>(settingsRef);

  const services = settings?.services ?? [];

  // ── Queue counts (waiting + serving = "in queue") ────────────────────────
  const queueCounts = useMemo(() => {
    if (!tickets) return {} as Record<string, number>;
    return tickets
      .filter(t => t.status === 'waiting' || t.status === 'serving')
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {});
  }, [tickets]);

  const totalWaiting = useMemo(() =>
    Object.values(queueCounts).reduce((a, b) => a + b, 0),
  [queueCounts]);

  // ── Reset all tickets ─────────────────────────────────────────────────────
  const resetQueue = useCallback(async (isAuto = false) => {
    if (!firestore) return;
    setIsResetting(true);
    try {
      const snapshot = await getDocs(collection(firestore, 'tickets'));
      if (snapshot.empty && !isAuto) {
        toast({ title: 'Queue Already Empty', description: 'No tickets to clear.' });
        setIsResetting(false);
        return;
      }

      // Firestore batch limit is 500 — handle large queues
      const batchSize = 400;
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(firestore);
        docs.slice(i, i + batchSize).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      // Persist last reset timestamp to Firestore so all clients know
      if (settingsRef) {
        await setDoc(settingsRef,
          { lastQueueReset: new Date().toISOString() },
          { merge: true }
        );
      }

      const timeStr = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
      setLastReset(timeStr);

      toast({
        title: isAuto ? '🕛 Auto Queue Reset' : '✅ Queue Reset',
        description: `${docs.length} ticket${docs.length !== 1 ? 's' : ''} cleared${isAuto ? ' at midnight' : ''}.`,
      });
    } catch {
      toast({ variant: 'destructive', title: 'Reset Failed', description: 'Could not clear the queue. Try again.' });
    } finally {
      setIsResetting(false);
    }
  }, [firestore, settingsRef, toast]);

  // ── Startup: check if we missed a midnight reset today ───────────────────
  useEffect(() => {
    const checkMissedReset = async () => {
      if (!firestore || !settingsRef) return;
      try {
        const snap = await getDoc(settingsRef);
        const lastResetIso: string | undefined = snap.data()?.lastQueueReset;
        if (lastResetIso) {
          const lastDate = new Date(lastResetIso).toDateString();
          const today    = new Date().toDateString();
          // Show last reset time in UI
          setLastReset(new Date(lastResetIso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }));
          if (lastDate !== today) {
            // Missed midnight reset — clear now
            await resetQueue(true);
          }
        }
      } catch {
        // Silently ignore — non-critical
      }
    };
    checkMissedReset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore]);

  // ── Schedule exact midnight reset ────────────────────────────────────────
  useEffect(() => {
    const schedule = () => {
      const now         = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 10, 0); // 00:00:10 next day
      const ms = nextMidnight.getTime() - now.getTime();

      resetScheduledRef.current = setTimeout(() => {
        resetQueue(true);
        schedule(); // reschedule for tomorrow
      }, ms);
    };

    schedule();
    return () => {
      if (resetScheduledRef.current) clearTimeout(resetScheduledRef.current);
    };
  }, [resetQueue]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes hb {
          0%,100% { transform: scale(1);   box-shadow: 0 0 0   0 rgba(220,38,38,0.4); }
          14%     { transform: scale(1.04); box-shadow: 0 0 0 10px rgba(220,38,38,0); }
          28%     { transform: scale(1);   box-shadow: 0 0 0   0 rgba(220,38,38,0); }
          42%     { transform: scale(1.03); box-shadow: 0 0 0  6px rgba(220,38,38,0); }
        }
        @keyframes pulseOrange {
          0%,100% { opacity:1;   box-shadow: 0 0 0  0 rgba(217,119,6,0.5); }
          50%     { opacity:0.85; box-shadow: 0 0 0 8px rgba(217,119,6,0); }
        }
        .anim-hb     { animation: hb          1.3s ease-in-out infinite; }
        .anim-pulse  { animation: pulseOrange  1.8s ease-in-out infinite; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              Live Queue Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time status · auto-resets at midnight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Total counter */}
          <div className="text-center px-4 py-2 rounded-xl bg-primary/10 min-w-[80px]">
            <div className="text-4xl font-black text-primary leading-none">{totalWaiting}</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
              Total
            </div>
          </div>

          {/* Reset button — admin only */}
          {showReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetQueue(false)}
              disabled={isResetting}
              className="gap-1.5 border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors"
            >
              <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Clearing…' : 'Reset Queue'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Service Cards ──────────────────────────────────────────────── */}
      {services.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed py-14 text-center text-muted-foreground">
          No services configured yet. Add services in Station Management.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {services.map((service, idx) => {
            const count   = queueCounts[service.id] ?? 0;
            const status  = getStatus(count);
            const sc      = statusColors(status);
            const palette = SERVICE_PALETTES[idx % SERVICE_PALETTES.length];

            return (
              <div
                key={service.id}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300
                  ${status === 'critical' ? 'anim-hb border-red-500'    : ''}
                  ${status === 'warning'  ? 'anim-pulse border-amber-500' : ''}
                  ${status === 'normal'   ? 'border-transparent'          : ''}
                `}
                style={{
                  background: `linear-gradient(145deg, ${palette.dark} 0%, ${palette.mid} 100%)`,
                }}
              >
                {/* Status badge */}
                <span
                  className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider"
                  style={{ background: sc.badgeBg, color: sc.badge }}
                >
                  {statusLabel(status)}
                </span>

                <div className="p-5 pt-6">
                  {/* Service icon + label */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-white/20 shrink-0">
                      <Icon name={service.icon} className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm leading-snug line-clamp-2">
                      {service.label}
                    </span>
                  </div>

                  {/* Big count number */}
                  <div className="text-center mb-2">
                    <span
                      className="font-black leading-none block"
                      style={{ fontSize: '4.5rem', color: sc.number }}
                    >
                      {count}
                    </span>
                    <span className="text-white/60 text-[11px] uppercase tracking-widest">
                      in queue
                    </span>
                  </div>

                  {/* Progress bar — scale to 25 max for visual */}
                  <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (count / 25) * 100)}%`,
                        backgroundColor: sc.bar,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-white/40 text-[10px]">
                    <span>0</span><span>25</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          <span>Normal — under 10</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />
          <span>Active — 10 to 19 (pulsing)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-red-600" />
          <span>Busy — 20 or more (heartbeat)</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-muted-foreground/70">
          <Clock className="h-3 w-3" />
          <span>Last reset: {lastReset}</span>
        </div>
      </div>
    </>
  );
}
