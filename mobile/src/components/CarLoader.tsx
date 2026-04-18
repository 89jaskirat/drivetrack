import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';

// ─── CarLoader ─────────────────────────────────────────────────────────────────
// Animated sedan silhouette with speed lines. Use on any loading/processing screen.
export function CarLoader({ label = 'Loading…' }: { label?: string }) {
  const slideX = useRef(new Animated.Value(-60)).current;
  const line1 = useRef(new Animated.Value(0)).current;
  const line2 = useRef(new Animated.Value(0)).current;
  const line3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Car slides in from left, then oscillates slightly
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideX, {
          toValue: -8,
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideX, {
          toValue: 4,
          duration: 250,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slideX, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    ).start();

    // Speed lines fade in/out staggered
    function animateLine(anim: Animated.Value, delay: number) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(800 - delay),
        ]),
      ).start();
    }

    animateLine(line1, 0);
    animateLine(line2, 120);
    animateLine(line3, 240);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.scene}>
        {/* Speed lines (left of car) */}
        <View style={styles.linesGroup}>
          <Animated.View style={[styles.line, styles.lineTop, { opacity: line1 }]} />
          <Animated.View style={[styles.line, styles.lineMid, { opacity: line2 }]} />
          <Animated.View style={[styles.line, styles.lineBot, { opacity: line3 }]} />
        </View>

        {/* Sedan silhouette (emoji-based for cross-platform) */}
        <Animated.View style={[styles.carWrap, { transform: [{ translateX: slideX }] }]}>
          <Text style={styles.carEmoji}>🚗</Text>
        </Animated.View>
      </View>

      {/* Ground line */}
      <View style={styles.ground} />

      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xl,
  },
  scene: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  linesGroup: {
    justifyContent: 'center',
    gap: 5,
    paddingBottom: 6,
  },
  line: {
    height: 2,
    borderRadius: 2,
    backgroundColor: appTheme.colors.playstationBlue,
  },
  lineTop: { width: 28 },
  lineMid: { width: 20 },
  lineBot: { width: 14 },
  carWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carEmoji: {
    fontSize: 40,
    lineHeight: 46,
  },
  ground: {
    width: 120,
    height: 1.5,
    backgroundColor: appTheme.surface.border,
    borderRadius: 2,
  },
  label: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.caption,
    letterSpacing: 0.3,
  },
});
