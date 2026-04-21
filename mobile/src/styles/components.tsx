/**
 * Reusable styled components with consistent design tokens
 */

import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Animated, ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing, Transitions, Typography } from './tokens';

// ============================================================================
// Button Component
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant: ButtonVariant;
  size?: ButtonSize;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  testID?: string;
}

export function Button({
  variant,
  size = 'md',
  onPress,
  disabled = false,
  children,
  testID,
}: ButtonProps) {
  const buttonStyles = getButtonStyles(variant, size, disabled);

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyles.container,
        pressed && !disabled && buttonStyles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {typeof children === 'string' ? (
        <Text style={buttonStyles.text}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

function getButtonStyles(variant: ButtonVariant, size: ButtonSize, disabled: boolean) {
  const baseStyle: ViewStyle = {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.6 : 1,
  };

  const sizeStyles = {
    sm: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      minHeight: 40,
    },
    md: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      minHeight: 44,
    },
    lg: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      minHeight: 52,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: Colors.primary[500],
      pressedBg: Colors.primary[600],
    },
    secondary: {
      backgroundColor: Colors.secondary[500],
      pressedBg: Colors.secondary[600],
    },
    accent: {
      backgroundColor: Colors.accent[500],
      pressedBg: Colors.accent[600],
    },
  };

  const colorScheme = variantStyles[variant];

  return StyleSheet.create({
    container: {
      ...baseStyle,
      ...sizeStyles[size],
      backgroundColor: colorScheme.backgroundColor,
      ...Shadows.md,
    },
    pressed: {
      backgroundColor: colorScheme.pressedBg,
      transform: [{ scale: 0.98 }],
    },
    text: {
      color: Colors.white,
      ...Typography.heading.sm,
      textAlign: 'center',
    },
  });
}

// ============================================================================
// Card Component
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  testID?: string;
  style?: ViewStyle;
}

export function Card({ children, testID, style }: CardProps) {
  const styles = getCardStyles();
  return (
    <View style={[styles.container, style]} testID={testID}>
      {children}
    </View>
  );
}

function getCardStyles() {
  return StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Shadows.sm,
    },
  });
}

// ============================================================================
// Panel Component (Card with Title)
// ============================================================================

interface PanelProps {
  title: string;
  children: React.ReactNode;
  testID?: string;
}

export function Panel({ title, children, testID }: PanelProps) {
  const styles = getPanelStyles();
  return (
    <Card testID={testID}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </Card>
  );
}

function getPanelStyles() {
  return StyleSheet.create({
    title: {
      ...Typography.heading.md,
      color: Colors.gray[900],
      marginBottom: Spacing.md,
    },
    content: {
      gap: Spacing.xs,
    },
  });
}

// ============================================================================
// Text Component (With preset styles)
// ============================================================================

export type TextVariant =
  | 'headingXxl'
  | 'headingXl'
  | 'headingLg'
  | 'headingMd'
  | 'headingSm'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'bodyXs'
  | 'labelMd'
  | 'labelSm'
  | 'caption';

export type TextColor = 'primary' | 'secondary' | 'muted' | 'error' | 'success';

interface StyledTextProps {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
  testID?: string;
}

export function StyledText({
  variant = 'bodyMd',
  color = 'primary',
  children,
  testID,
}: StyledTextProps) {
  const styles = getTextStyles(variant, color);
  return (
    <Text style={styles.text} testID={testID}>
      {children}
    </Text>
  );
}

function getTextStyles(variant: TextVariant, color: TextColor) {
  const typographyMap = {
    headingXxl: Typography.heading.xxl,
    headingXl: Typography.heading.xl,
    headingLg: Typography.heading.lg,
    headingMd: Typography.heading.md,
    headingSm: Typography.heading.sm,
    bodyLg: Typography.body.lg,
    bodyMd: Typography.body.md,
    bodySm: Typography.body.sm,
    bodyXs: Typography.body.xs,
    labelMd: Typography.label.md,
    labelSm: Typography.label.sm,
    caption: Typography.caption.md,
  };

  const colorMap = {
    primary: Colors.gray[900],
    secondary: Colors.gray[700],
    muted: Colors.gray[500],
    error: Colors.error,
    success: Colors.success,
  };

  return StyleSheet.create({
    text: {
      ...typographyMap[variant],
      color: colorMap[color],
    },
  });
}

// ============================================================================
// Metric Row (For stats displays)
// ============================================================================

interface MetricRowProps {
  label: string;
  value: string | number;
  testID?: string;
}

export function MetricRow({ label, value, testID }: MetricRowProps) {
  const styles = getMetricRowStyles();
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function getMetricRowStyles() {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: Colors.divider,
    },
    label: {
      ...Typography.body.md,
      color: Colors.gray[700],
    },
    value: {
      ...Typography.body.md,
      color: Colors.gray[900],
      fontWeight: '600',
    },
  });
}

// ============================================================================
// Badge Component
// ============================================================================

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  testID?: string;
}

export function Badge({ variant = 'default', children, testID }: BadgeProps) {
  const styles = getBadgeStyles(variant);
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

function getBadgeStyles(variant: BadgeVariant) {
  const variantMap = {
    default: {
      bg: Colors.primary[100],
      text: Colors.primary[900],
    },
    success: {
      bg: Colors.success + '20',
      text: Colors.success,
    },
    warning: {
      bg: Colors.warning + '20',
      text: Colors.warning,
    },
    error: {
      bg: Colors.error + '20',
      text: Colors.error,
    },
  };

  const colors = variantMap[variant];

  return StyleSheet.create({
    container: {
      backgroundColor: colors.bg,
      borderRadius: Radius.full,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      alignSelf: 'flex-start',
    },
    text: {
      ...Typography.label.sm,
      color: colors.text,
    },
  });
}

// ============================================================================
// Action Button Group (For main CTA buttons)
// ============================================================================

interface ActionButtonGroupProps {
  buttons: Array<{
    label: string;
    subtext: string;
    variant: ButtonVariant;
    onPress: () => void;
    disabled?: boolean;
    testID?: string;
  }>;
}

export function ActionButtonGroup({ buttons }: ActionButtonGroupProps) {
  const styles = StyleSheet.create({
    container: {
      gap: Spacing.md,
    },
  });
  return (
    <View style={styles.container}>
      {buttons.map((button, index) => (
        <ActionButton
          key={index}
          label={button.label}
          subtext={button.subtext}
          variant={button.variant}
          onPress={button.onPress}
          disabled={button.disabled}
          testID={button.testID}
        />
      ))}
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  subtext: string;
  variant: ButtonVariant;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

function ActionButton({ label, subtext, variant, onPress, disabled = false, testID }: ActionButtonProps) {
  const styles = getActionButtonStyles();
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    if (disabled) return;
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: 0.97,
      duration: Transitions.fast,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    if (disabled) return;
    scale.stopAnimation();
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.04, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: Transitions.base, useNativeDriver: true }),
    ]).start();
  }

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${subtext}`}
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={[
          styles[variant],
          { transform: [{ scale }] },
          disabled && { opacity: 0.5 },
        ]}
      >
        <Text style={styles.buttonText}>{label}</Text>
        <Text style={styles.buttonSubtext}>{subtext}</Text>
      </Animated.View>
    </Pressable>
  );
}

function getActionButtonStyles() {
  return StyleSheet.create({
    primary: {
      backgroundColor: Colors.primary[500],
      borderRadius: Radius.lg,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      ...Shadows.md,
    },
    secondary: {
      backgroundColor: Colors.secondary[500],
      borderRadius: Radius.lg,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      ...Shadows.md,
    },
    accent: {
      backgroundColor: Colors.accent[500],
      borderRadius: Radius.lg,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      ...Shadows.md,
    },
    buttonText: {
      color: Colors.white,
      ...Typography.heading.md,
      textAlign: 'center',
    },
    buttonSubtext: {
      ...Typography.body.sm,
      color: Colors.gray[100],
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
  });
}

// ============================================================================
// Toast Component (Temporary success/error feedback)
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  visible: boolean;
  variant?: ToastVariant;
}

export function Toast({ message, visible, variant = 'success' }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -16, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  const styles = getToastStyles(variant);

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

function getToastStyles(variant: ToastVariant) {
  const variantColors = {
    success: { bg: Colors.success, text: Colors.white },
    error: { bg: Colors.error, text: Colors.white },
    info: { bg: Colors.info, text: Colors.white },
  };

  const colors = variantColors[variant];

  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: Spacing.xl,
      left: Spacing.xl,
      right: Spacing.xl,
      backgroundColor: colors.bg,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
      zIndex: 999,
      ...Shadows.lg,
    },
    text: {
      ...Typography.label.md,
      color: colors.text,
    },
  });
}

// ============================================================================
// ErrorBanner Component (Styled inline error feedback)
// ============================================================================

interface ErrorBannerProps {
  message: string;
  testID?: string;
}

export function ErrorBanner({ message, testID }: ErrorBannerProps) {
  const styles = getErrorBannerStyles();
  return (
    <View style={styles.container} testID={testID} accessibilityRole="alert">
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function getErrorBannerStyles() {
  return StyleSheet.create({
    container: {
      backgroundColor: Colors.error + '18',
      borderWidth: 1,
      borderColor: Colors.error + '50',
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    icon: {
      fontSize: 16,
    },
    text: {
      ...Typography.body.sm,
      color: Colors.error,
      flex: 1,
    },
  });
}

// ============================================================================
// LoadingSkeleton Component (Placeholder layout while loading)
// ============================================================================

export function LoadingSkeleton() {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const styles = getSkeletonStyles();

  return (
    <Animated.View style={[styles.content, { opacity }]}>
      <View style={styles.titleBar} />
      <View style={styles.subtitleBar} />
      <View style={styles.buttonGroup}>
        <View style={[styles.button, { backgroundColor: Colors.primary[200] }]} />
        <View style={[styles.button, { backgroundColor: Colors.secondary[200] }]} />
        <View style={[styles.button, { backgroundColor: Colors.accent[200] }]} />
      </View>
      <View style={styles.panel}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.row} />
        ))}
      </View>
      <View style={styles.panel}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.row} />
        ))}
      </View>
    </Animated.View>
  );
}

function getSkeletonStyles() {
  return StyleSheet.create({
    content: {
      padding: Spacing.xl,
      gap: Spacing.lg,
    },
    titleBar: {
      height: 40,
      width: '55%',
      backgroundColor: Colors.gray[200],
      borderRadius: Radius.sm,
    },
    subtitleBar: {
      height: 20,
      width: '40%',
      backgroundColor: Colors.gray[200],
      borderRadius: Radius.sm,
      marginBottom: Spacing.lg,
    },
    buttonGroup: {
      gap: Spacing.md,
    },
    button: {
      height: 72,
      borderRadius: Radius.lg,
    },
    panel: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    row: {
      height: 18,
      backgroundColor: Colors.gray[200],
      borderRadius: Radius.xs,
    },
  });
}

// ============================================================================
// EmptyState Component (Improved empty content placeholder)
// ============================================================================

interface EmptyStateProps {
  message: string;
  subtext?: string;
  testID?: string;
}

export function EmptyState({ message, subtext, testID }: EmptyStateProps) {
  const styles = getEmptyStateStyles();
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.icon}>✦</Text>
      <Text style={styles.message}>{message}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
    </View>
  );
}

function getEmptyStateStyles() {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
      gap: Spacing.sm,
    },
    icon: {
      fontSize: 22,
      color: Colors.gray[400],
    },
    message: {
      ...Typography.body.md,
      color: Colors.gray[600],
      textAlign: 'center',
    },
    subtext: {
      ...Typography.body.sm,
      color: Colors.gray[400],
      textAlign: 'center',
    },
  });
}
