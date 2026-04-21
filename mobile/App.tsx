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

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Today</Text>
          <Text style={styles.metric}>Tap: {todayStats.tap}</Text>
          <Text style={styles.metric}>Shake It Off: {todayStats.shakeItOff}</Text>
          <Text style={styles.metric}>Tap Out: {todayStats.tapOut}</Text>
          <Text style={styles.metric}>Total today: {todayStats.total}</Text>
          <Text style={styles.metric}>Lifetime moments: {events.length}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Smoke-free analytics</Text>
          <Text style={styles.metric}>Current streak: {sessionAnalytics.currentStreak} moments</Text>
          <Text style={styles.metric}>
            Current session: {formatDuration(sessionAnalytics.currentSessionDurationMs)}
          </Text>
          <Text style={styles.metric}>
            Current session moments: {sessionAnalytics.currentSessionMoments}
          </Text>
          <Text style={styles.metric}>
            Best session: {formatDuration(sessionAnalytics.bestSessionDurationMs)}
          </Text>
          <Text style={styles.metric}>Completed sessions: {sessionAnalytics.sessionsCompleted}</Text>
          <Text style={styles.metric}>
            Avg moments before tap out: {sessionAnalytics.averageMomentsBeforeTapOut}
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Device shake</Text>
          <Text style={styles.metric}>{getShakeStatusMessage(shakeStatus)}</Text>
          {__DEV__ ? (
            <Text style={styles.devNote}>
              Expo dev mode maps shake to the developer menu. Keep this off while debugging.
            </Text>
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
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Latest moment</Text>
          {latestEvent ? (
            <Text style={styles.latest}>
              {getEventLabel(latestEvent)} at {formatEventTime(latestEvent.createdAt)}
            </Text>
          ) : (
            <Text style={styles.empty}>No moments yet.</Text>
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.historyHeader}>
            <Text style={styles.panelTitle}>Recent history</Text>
            <Pressable onPress={clearHistory}>
              <Text style={styles.clearLink}>Clear</Text>
            </Pressable>
          </View>
          {events.slice(0, 10).map((event) => (
            <View key={event.id} style={styles.eventRow}>
              <Text style={styles.eventLabel}>{getEventLabel(event)}</Text>
              <Text style={styles.eventTime}>{formatEventTime(event.createdAt)}</Text>
            </View>
          ))}
          {events.length === 0 ? <Text style={styles.empty}>No saved events.</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F2F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#2D3A39',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F2F3EE',
  },
  content: {
    padding: 18,
    gap: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1D3F3A',
  },
  subtitle: {
    fontSize: 16,
    color: '#2E5A55',
    marginBottom: 8,
  },
  errorText: {
    color: '#9E2F2F',
    fontSize: 14,
  },
  panel: {
    backgroundColor: '#FDFCF7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2DFD3',
  },
  panelTitle: {
    color: '#223534',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  metric: {
    fontSize: 15,
    color: '#344848',
    marginBottom: 4,
  },
  latest: {
    fontSize: 15,
    color: '#2D4443',
  },
  empty: {
    color: '#5C6A68',
    fontSize: 14,
  },
  devNote: {
    fontSize: 13,
    color: '#5D6765',
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearLink: {
    color: '#7C3025',
    fontWeight: '600',
    fontSize: 14,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECE8DB',
  },
  eventLabel: {
    fontSize: 14,
    color: '#2E4241',
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 13,
    color: '#5D6765',
  },
});
