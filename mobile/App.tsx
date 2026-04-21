import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import {
  Card,
  AnimatedHistoryItem,
  EmptyState,
  ErrorBanner,
  LoadingSkeleton,
  MetricRow,
  Panel,
  StyledText,
  Toast,
} from './src/styles/components';
import { Colors, Spacing, Transitions, Typography } from './src/styles/tokens';

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
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const autoShakeEnabled = !__DEV__ || allowShakeInDev;

  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: Transitions.slow,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, contentOpacity]);

  useEffect(() => {
    if (!successToast) return;
    const id = setTimeout(() => setSuccessToast(null), 2000);
    return () => clearTimeout(id);
  }, [successToast]);

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
    if (source === 'manual') {
      const toastMessages: Record<ActionType, string> = {
        tap: '✓ Moment recorded',
        shake_it_off: '✓ Shaking it off!',
        tap_out: '✓ Tapped out — well done',
      };
      setSuccessToast(toastMessages[action]);
    }
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
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <Toast message={successToast ?? ''} visible={successToast !== null} />
      <Animated.View style={[{ flex: 1 }, { opacity: contentOpacity }]}>
        <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">CiggyTap</Text>
        <Text style={styles.subtitle}>One tap at a time.</Text>

        {storageError ? <ErrorBanner message={storageError} /> : null}

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
              accessibilityRole="switch"
              accessibilityLabel={allowShakeInDev ? 'Disable shake detection in dev mode' : 'Enable shake detection in dev mode'}
              accessibilityState={{ checked: allowShakeInDev }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => pressed && styles.pressedLink}
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
            <EmptyState
              message="No moments yet."
              subtext="Use the buttons above to record your first moment."
            />
          )}
        </Panel>

        <Card>
          <View style={styles.historyHeader}>
            <Text style={styles.panelTitle}>Recent history</Text>
            <Pressable
              onPress={clearHistory}
              accessibilityRole="button"
              accessibilityLabel="Clear history"
              accessibilityHint="Opens a confirmation dialog to remove all saved events"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => pressed && styles.pressedLink}
            >
              <Text style={styles.clearLink}>Clear</Text>
            </Pressable>
          </View>
          {events.length === 0 ? (
            <EmptyState
              message="No saved events yet."
              subtext="Start tapping to see your history here."
            />
          ) : (
            events.slice(0, 10).map((event, index) => (
              <AnimatedHistoryItem key={event.id} index={index}>
                <MetricRow
                  label={getEventLabel(event)}
                  value={formatEventTime(event.createdAt)}
                />
              </AnimatedHistoryItem>
            ))
          )}
        </Card>
      </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    ...Typography.heading.xxl,
    color: Colors.secondary[900],
  },
  subtitle: {
    ...Typography.body.lg,
    color: Colors.secondary[700],
    marginBottom: Spacing.lg,
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
  pressedLink: {
    opacity: 0.6,
  },
});
