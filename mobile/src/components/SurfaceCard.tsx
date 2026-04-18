import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';

export function SurfaceCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.xl,
    marginTop: appTheme.spacing.base,
    ...appTheme.elevation.low,
  },
  title: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayM,
    marginTop: appTheme.spacing.sm,
  },
  subtitle: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.caption,
    marginTop: appTheme.spacing.xs,
  },
  body: {
    gap: appTheme.spacing.md,
    marginTop: appTheme.spacing.md,
  },
});
