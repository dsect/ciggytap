/**
 * Reusable styled components with consistent design tokens
 */

import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from './tokens';

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
  testID?: string;
}

function ActionButton({ label, subtext, variant, onPress, testID }: ActionButtonProps) {
  const styles = getActionButtonStyles();
  return (
    <Pressable
      style={({ pressed }) => [
        styles[variant],
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${subtext}`}
    >
      <Text style={styles.buttonText}>{label}</Text>
      <Text style={styles.buttonSubtext}>{subtext}</Text>
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
