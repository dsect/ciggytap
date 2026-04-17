import {
  getSessionAnalytics,
  getTodayStats,
  shouldRegisterShake,
  type EventRecord,
} from './ciggytap';

function buildEvent(
  action: EventRecord['action'],
  localDate: [number, number, number, number, number],
  source: EventRecord['source'] = 'manual'
): EventRecord {
  const [year, month, day, hour, minute] = localDate;
  const date = new Date(year, month - 1, day, hour, minute, 0);
  return {
    id: `${action}-${date.getTime()}`,
    action,
    createdAt: date.toISOString(),
    source,
  };
}

describe('getTodayStats', () => {
  it('counts only moments from the current day', () => {
    const now = new Date(2026, 2, 8, 12, 0, 0);
    const events: EventRecord[] = [
      buildEvent('tap', [2026, 3, 8, 9, 0]),
      buildEvent('shake_it_off', [2026, 3, 8, 10, 15]),
      buildEvent('tap_out', [2026, 3, 7, 22, 45]),
    ];

    const stats = getTodayStats(events, now);

    expect(stats).toEqual({
      tap: 1,
      shakeItOff: 1,
      tapOut: 0,
      total: 2,
    });
  });
});

describe('getSessionAnalytics', () => {
  it('computes streak and session metrics across tap-out boundaries', () => {
    const now = new Date(2026, 2, 8, 15, 0, 0);
    const events: EventRecord[] = [
      buildEvent('tap', [2026, 3, 8, 12, 0]),
      buildEvent('tap_out', [2026, 3, 8, 11, 0]),
      buildEvent('tap', [2026, 3, 8, 10, 0]),
      buildEvent('tap_out', [2026, 3, 8, 9, 0]),
      buildEvent('shake_it_off', [2026, 3, 8, 8, 0]),
      buildEvent('tap', [2026, 3, 8, 7, 0]),
    ];

    const analytics = getSessionAnalytics(events, now);

    expect(analytics.currentStreak).toBe(1);
    expect(analytics.currentSessionMoments).toBe(1);
    expect(analytics.sessionsCompleted).toBe(2);
    expect(analytics.averageMomentsBeforeTapOut).toBe(1.5);
    expect(analytics.currentSessionDurationMs).toBe(4 * 60 * 60 * 1000);
    expect(analytics.bestSessionDurationMs).toBe(4 * 60 * 60 * 1000);
    expect(analytics.lastTapOutAt).toBe(buildEvent('tap_out', [2026, 3, 8, 11, 0]).createdAt);
  });
});

describe('shouldRegisterShake', () => {
  it('returns true when acceleration spike exceeds threshold and cooldown elapsed', () => {
    const shouldTrigger = shouldRegisterShake({ x: 2, y: 2, z: 2 }, 1000, 3000);
    expect(shouldTrigger).toBe(true);
  });

  it('returns false when inside cooldown window', () => {
    const shouldTrigger = shouldRegisterShake({ x: 2, y: 2, z: 2 }, 2500, 3000, {
      cooldownMs: 1000,
    });
    expect(shouldTrigger).toBe(false);
  });

  it('returns false for low movement samples', () => {
    const shouldTrigger = shouldRegisterShake({ x: 0, y: 0, z: 1 }, 0, 3000);
    expect(shouldTrigger).toBe(false);
  });
});
