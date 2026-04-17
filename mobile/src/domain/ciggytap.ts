export const STORAGE_KEY = 'ciggytap.events.v1';

export type ActionType = 'tap' | 'shake_it_off' | 'tap_out';

export type EventSource = 'manual' | 'device';

export type EventRecord = {
  id: string;
  action: ActionType;
  createdAt: string;
  source: EventSource;
};

export type TodayStats = {
  tap: number;
  shakeItOff: number;
  tapOut: number;
  total: number;
};

export type SessionAnalytics = {
  currentStreak: number;
  currentSessionMoments: number;
  currentSessionDurationMs: number;
  currentSessionStartedAt: string | null;
  bestSessionDurationMs: number;
  sessionsCompleted: number;
  averageMomentsBeforeTapOut: number;
  lastTapOutAt: string | null;
};

export type AccelerometerSample = {
  x: number;
  y: number;
  z: number;
};

export const ACTION_LABELS: Record<ActionType, string> = {
  tap: 'Tap',
  shake_it_off: 'Shake It Off',
  tap_out: 'Tap Out',
};

function isActionType(value: unknown): value is ActionType {
  return value === 'tap' || value === 'shake_it_off' || value === 'tap_out';
}

function isEventSource(value: unknown): value is EventSource {
  return value === 'manual' || value === 'device';
}

function toTimestamp(isoTimestamp: string): number {
  const timestamp = new Date(isoTimestamp).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function parseStoredEvents(raw: string | null): EventRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const events = parsed.filter(
      (event): event is EventRecord =>
        event &&
        typeof event.id === 'string' &&
        typeof event.createdAt === 'string' &&
        isActionType(event.action) &&
        (event.source === undefined || isEventSource(event.source))
    );

    return sortDescending(
      events.map((event) => ({
        ...event,
        source: event.source ?? 'manual',
      }))
    );
  } catch {
    return [];
  }
}

export function createEvent(
  action: ActionType,
  source: EventSource = 'manual',
  nowMs = Date.now()
): EventRecord {
  return {
    id: `${nowMs}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    createdAt: new Date(nowMs).toISOString(),
    source,
  };
}

export function formatEventTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function formatDuration(durationMs: number): string {
  const safeDuration = Math.max(0, Math.floor(durationMs));
  const seconds = Math.floor(safeDuration / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function getEventLabel(event: EventRecord): string {
  if (event.action === 'shake_it_off' && event.source === 'device') {
    return 'Shake It Off (motion)';
  }

  return ACTION_LABELS[event.action];
}

export function getTodayStats(events: EventRecord[], now = new Date()): TodayStats {
  return events.reduce<TodayStats>(
    (stats, event) => {
      const date = new Date(event.createdAt);
      const isSameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

      if (!isSameDay) {
        return stats;
      }

      const next = { ...stats, total: stats.total + 1 };
      if (event.action === 'tap') {
        return { ...next, tap: next.tap + 1 };
      }
      if (event.action === 'shake_it_off') {
        return { ...next, shakeItOff: next.shakeItOff + 1 };
      }
      return { ...next, tapOut: next.tapOut + 1 };
    },
    { tap: 0, shakeItOff: 0, tapOut: 0, total: 0 }
  );
}

export function getSessionAnalytics(events: EventRecord[], now = new Date()): SessionAnalytics {
  const desc = sortDescending(events);
  const asc = [...desc].reverse();
  const nowMs = now.getTime();

  let currentStreak = 0;
  for (const event of desc) {
    if (event.action === 'tap_out') {
      break;
    }
    currentStreak += 1;
  }

  let currentSessionMoments = 0;
  for (const event of desc) {
    if (event.action === 'tap_out') {
      break;
    }
    currentSessionMoments += 1;
  }

  const lastTapOut = desc.find((event) => event.action === 'tap_out') ?? null;
  const sessionsCompleted = desc.filter((event) => event.action === 'tap_out').length;

  let currentSessionStartedAt: string | null = null;
  let currentSessionDurationMs = 0;
  if (desc.length > 0) {
    const startMs = lastTapOut ? toTimestamp(lastTapOut.createdAt) : toTimestamp(asc[0].createdAt);
    currentSessionStartedAt = new Date(startMs).toISOString();
    currentSessionDurationMs = Math.max(0, nowMs - startMs);
  }

  let bestSessionDurationMs = 0;
  if (asc.length > 0) {
    let segmentStart = toTimestamp(asc[0].createdAt);
    for (const event of asc) {
      if (event.action !== 'tap_out') {
        continue;
      }

      const tapOutAt = toTimestamp(event.createdAt);
      bestSessionDurationMs = Math.max(bestSessionDurationMs, Math.max(0, tapOutAt - segmentStart));
      segmentStart = tapOutAt;
    }

    bestSessionDurationMs = Math.max(bestSessionDurationMs, Math.max(0, nowMs - segmentStart));
  }

  const momentsBeforeTapOut: number[] = [];
  let momentsInCurrentSegment = 0;
  for (const event of asc) {
    if (event.action === 'tap_out') {
      momentsBeforeTapOut.push(momentsInCurrentSegment);
      momentsInCurrentSegment = 0;
      continue;
    }
    momentsInCurrentSegment += 1;
  }

  const averageMomentsBeforeTapOut =
    momentsBeforeTapOut.length === 0
      ? 0
      : Number(
          (
            momentsBeforeTapOut.reduce((sum, value) => sum + value, 0) / momentsBeforeTapOut.length
          ).toFixed(1)
        );

  return {
    currentStreak,
    currentSessionMoments,
    currentSessionDurationMs,
    currentSessionStartedAt,
    bestSessionDurationMs,
    sessionsCompleted,
    averageMomentsBeforeTapOut,
    lastTapOutAt: lastTapOut?.createdAt ?? null,
  };
}

function sortDescending(events: EventRecord[]): EventRecord[] {
  return [...events].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
}

export function shouldRegisterShake(
  sample: AccelerometerSample,
  lastTriggeredAtMs: number,
  nowMs = Date.now(),
  options?: { threshold?: number; cooldownMs?: number }
): boolean {
  const threshold = options?.threshold ?? 1.15;
  const cooldownMs = options?.cooldownMs ?? 1500;

  if (
    !Number.isFinite(sample.x) ||
    !Number.isFinite(sample.y) ||
    !Number.isFinite(sample.z) ||
    nowMs - lastTriggeredAtMs < cooldownMs
  ) {
    return false;
  }

  const magnitude = Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z);
  const deltaFromGravity = Math.abs(magnitude - 1);
  return deltaFromGravity >= threshold;
}
