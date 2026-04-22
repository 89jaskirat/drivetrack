import { StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';
import type { DriverStreak } from '../types';

interface Props {
  streak: DriverStreak | null;
}

export function StreakWidget({ streak }: Props) {
  const current = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;
  const toNext = 7 - (current % 7);
  const milestoneHit = current % 7 === 0 && current > 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.flame}>🔥</Text>
        <View style={styles.info}>
          <Text style={styles.count}>{current}-day streak</Text>
          {longest > 0 && <Text style={styles.best}>Best: {longest} days</Text>}
        </View>
        <Text style={styles.milestone}>
          {milestoneHit ? '🎯 7-day!' : `${toNext}d to milestone`}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(100, (current % 7) / 7 * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.lg,
    marginBottom: appTheme.spacing.base,
    gap: appTheme.spacing.sm,
    ...appTheme.elevation.low,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
  },
  flame: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  count: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
    fontWeight: '700',
  },
  best: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
  },
  milestone: {
    color: appTheme.colors.playstationBlue,
    ...appTheme.typography.micro,
    fontWeight: '600',
    textAlign: 'right',
  },
  barTrack: {
    height: 3,
    backgroundColor: appTheme.surface.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: 2,
  },
});
