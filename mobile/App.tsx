import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ActionButtonGroup } from './src/styles/components';
import {
  ACTION_LABELS,
  createEvent,
  formatDuration,
  formatEventTime,
  getEventLabel,
  getSessionAnalytics,
  getTodayStats,
  parseStoredEvents,
  shouldRegisterShake,
  STORAGE_KEY,
  type ActionType,
  type EventRecord,
  type EventSource,
} from './src/domain/ciggytap';
import { Card, MetricRow, Panel, StyledText } from './src/styles/components';
import { Colors, Spacing, Typography } from './src/styles/tokens';

type ShakeStatus = 'initializing' | 'active' | 'unavailable' | 'disabled' | 'error';

function getShakeStatusMessage(status: ShakeStatus): string {
  if (status === 'active') {
    return 'Device shake detection is active.';
  }
  if (status === 'disabled') {
    return 'Device shake detection is disabled.';
  }
  if (status === 'unavailable') {
    return 'Accelerometer is unavailable on this device.';
  }
  if (status === 'error') {
    return 'Could not start shake detection.';
  }
  return 'Initializing shake detection...';
}

export default function App() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [shakeStatus, setShakeStatus] = useState<ShakeStatus>('initializing');
  const [lastAutoShakeAtMs, setLastAutoShakeAtMs] = useState(0);
  const [allowShakeInDev, setAllowShakeInDev] = useState(false);

  const autoShakeEnabled = !__DEV__ || allowShakeInDev;

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted) {
          setEvents(parseStoredEvents(raw));
        }
      } catch {
        if (isMounted) {
          setStorageError('Could not load saved moments from this device.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let isMounted = true;

    async function saveEvents() {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        if (isMounted) {
          setStorageError(null);
        }
      } catch {
        if (isMounted) {
          setStorageError('Could not save this moment.');
        }
      }
    }

    void saveEvents();

    return () => {
      isMounted = false;
    };
  }, [events, isLoading]);

  const recordAction = useCallback((action: ActionType, source: EventSource = 'manual') => {
    setEvents((previousEvents) => [createEvent(action, source), ...previousEvents]);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    if (isLoading) {
      return () => {
        isMounted = false;
        subscription?.remove();
      };
    }

    if (!autoShakeEnabled) {
      setShakeStatus('disabled');
      return () => {
        isMounted = false;
        subscription?.remove();
      };
    }

    setShakeStatus('initializing');

    async function startShakeDetection() {
      try {
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isMounted) {
          return;
        }

        if (!isAvailable) {
          setShakeStatus('unavailable');
          return;
        }

        Accelerometer.setUpdateInterval(120);
        setShakeStatus('active');
        subscription = Accelerometer.addListener((sample) => {
          const nowMs = Date.now();
          setLastAutoShakeAtMs((previousTriggerMs) => {
            if (!shouldRegisterShake(sample, previousTriggerMs, nowMs)) {
              return previousTriggerMs;
            }
            recordAction('shake_it_off', 'device');
            return nowMs;
          });
        });
      } catch {
        if (isMounted) {
          setShakeStatus('error');
        }
      }
    }

    void startShakeDetection();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [autoShakeEnabled, isLoading, recordAction]);

  function clearHistory() {
    Alert.alert('Clear history?', 'This removes all saved moments from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setEvents([]);
          setLastAutoShakeAtMs(0);
        },
      },
    ]);
  }

  const todayStats = useMemo(() => getTodayStats(events), [events]);
  const sessionAnalytics = useMemo(() => getSessionAnalytics(events), [events]);
  const latestEvent = events[0];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E6B62" />
        <Text style={styles.loadingText}>Loading CiggyTap...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>CiggyTap</Text>
        <Text style={styles.subtitle}>One tap at a time.</Text>

        {storageError ? <Text style={styles.errorText}>{storageError}</Text> : null}

        <ActionButtonGroup
          buttons={[
            {
              label: 'Tap',
              subtext: 'Acknowledge the urge.',
              variant: 'primary',
              onPress: () => { recordAction('tap'); },
            },
            {
              label: ACTION_LABELS.shake_it_off,
              subtext: 'Disrupt the moment.',
              variant: 'secondary',
              onPress: () => { recordAction('shake_it_off'); },
            },
            {
              label: 'Tap Out',
              subtext: 'End honestly.',
              variant: 'accent',
              onPress: () => { recordAction('tap_out'); },
            },
          ]}
        />

        <Panel title="Today">
          <MetricRow label="Tap" value={todayStats.tap} />
          <MetricRow label="Shake It Off" value={todayStats.shakeItOff} />
          <MetricRow label="Tap Out" value={todayStats.tapOut} />
          <MetricRow label="Total today" value={todayStats.total} />
          <MetricRow label="Lifetime moments" value={events.length} />
        </Panel>

        <Panel title="Smoke-free analytics">
          <MetricRow label="Current streak" value={`${sessionAnalytics.currentStreak} moments`} />
          <MetricRow label="Current session" value={formatDuration(sessionAnalytics.currentSessionDurationMs)} />
          <MetricRow label="Session moments" value={sessionAnalytics.currentSessionMoments} />
          <MetricRow label="Best session" value={formatDuration(sessionAnalytics.bestSessionDurationMs)} />
          <MetricRow label="Completed sessions" value={sessionAnalytics.sessionsCompleted} />
          <MetricRow label="Avg before tap out" value={sessionAnalytics.averageMomentsBeforeTapOut} />
        </Panel>

        <Panel title="Device shake">
          <StyledText variant="bodyMd" color="secondary">{getShakeStatusMessage(shakeStatus)}</StyledText>
          {__DEV__ ? (
            <StyledText variant="bodyXs" color="muted">
              Expo dev mode maps shake to the developer menu. Keep this off while debugging.
            </StyledText>
          ) : null}
          {__DEV__ ? (
            <Pressable
              onPress={() => {
                setAllowShakeInDev((enabled) => !enabled);
              }}
            >
              <Text style={styles.clearLink}>
                {allowShakeInDev ? 'Disable shake detection in dev mode' : 'Enable shake detection in dev mode'}
              </Text>
            </Pressable>
          ) : null}
        </Panel>

        <Panel title="Latest moment">
          {latestEvent ? (
            <StyledText variant="bodyMd" color="secondary">
              {getEventLabel(latestEvent)} at {formatEventTime(latestEvent.createdAt)}
            </StyledText>
          ) : (
            <StyledText variant="bodySm" color="muted">No moments yet.</StyledText>
          )}
        </Panel>

        <Card>
          <View style={styles.historyHeader}>
            <Text style={styles.panelTitle}>Recent history</Text>
            <Pressable onPress={clearHistory}>
              <Text style={styles.clearLink}>Clear</Text>
            </Pressable>
          </View>
          {events.slice(0, 10).map((event) => (
            <MetricRow
              key={event.id}
              label={getEventLabel(event)}
              value={formatEventTime(event.createdAt)}
            />
          ))}
          {events.length === 0 ? <StyledText variant="bodySm" color="muted">No saved events.</StyledText> : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body.lg,
    color: Colors.gray[700],
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.heading.xxl,
    color: Colors.secondary[900],
  },
  subtitle: {
    ...Typography.body.lg,
    color: Colors.secondary[700],
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.body.sm,
    color: Colors.error,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  panelTitle: {
    ...Typography.heading.md,
    color: Colors.gray[900],
  },
  clearLink: {
    ...Typography.label.md,
    color: Colors.accent[700],
  },
});
