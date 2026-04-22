import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { appTheme } from '../theme';

const ONBOARDING_KEY = 'drivetrack-onboarding-complete';

const TAB_BAR_H = 64;

type Tip = {
  icon: string;
  title: string;
  body: string;
  cx: number;
  cy: number;
  sectionW: number;
  sectionH: number;
  radius: number;
  cardAnchor: 'top' | 'bottom';
  scrollY?: number;
};

function makeTips(width: number, height: number): Tip[] {
  return [
    {
      icon: '+',
      title: 'Quick-log anything',
      body: 'Tap the + button to log mileage, fuel, expenses, or earnings in seconds.',
      cx: width * 0.87,
      cy: height * 0.80,
      sectionW: 64,
      sectionH: 64,
      radius: 32,
      cardAnchor: 'top',
    },
    {
      icon: '▶',
      title: 'Shift tracking',
      body: 'Start a shift to auto-track your time and distance on the road.',
      cx: width * 0.50,
      cy: height * 0.19,
      sectionW: width * 0.88,
      sectionH: 72,
      radius: 16,
      cardAnchor: 'bottom',
    },
    {
      icon: '⬡',
      title: 'Community forum',
      body: 'Ask questions, share tips, and find intel from drivers in your zone.',
      cx: width * 0.30,
      cy: height * 0.965,
      sectionW: width * 0.19,
      sectionH: TAB_BAR_H - 8,
      radius: 12,
      cardAnchor: 'top',
    },
    {
      icon: '⛽',
      title: 'Lowest gas prices',
      body: 'See the cheapest gas near you, updated daily by the community.',
      cx: width * 0.50,
      cy: height * 0.62,
      sectionW: width * 0.90,
      sectionH: 112,
      radius: 16,
      cardAnchor: 'top',
      scrollY: 300,
    },
    {
      icon: '★',
      title: 'Deals & promos',
      body: 'Exclusive discounts from local mechanics, gas stations, and restaurants.',
      cx: width * 0.50,
      cy: height * 0.965,
      sectionW: width * 0.19,
      sectionH: TAB_BAR_H - 8,
      radius: 12,
      cardAnchor: 'top',
    },
  ];
}

interface Props {
  /** Called when a tip requires a scroll position to bring the target into view */
  onScrollRequest?: (y: number) => void;
}

export function OnboardingTooltips({ onScrollRequest }: Props = {}) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { width, height } = useWindowDimensions();

  // Outer fade — native driver (opacity only)
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Glow pulse — JS driver (shadow props)
  const glowAnim = useRef(new Animated.Value(0)).current;
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const tips = makeTips(width, height);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      if (!v) {
        setVisible(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        startGlow();
      }
    });
    return () => glowLoopRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!visible) return;
    glowAnim.setValue(0);
    startGlow();
    const tip = tips[step];
    if (tip.scrollY !== undefined) onScrollRequest?.(tip.scrollY);
    return () => glowLoopRef.current?.stop();
  }, [step, visible]);

  function startGlow() {
    glowLoopRef.current?.stop();
    glowLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 950, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.25, duration: 950, useNativeDriver: false }),
      ]),
    );
    glowLoopRef.current.start();
  }

  const handleNext = () => {
    if (step < tips.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const dismiss = () => {
    glowLoopRef.current?.stop();
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
      AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    });
  };

  if (!visible) return null;

  const tip = tips[step];
  const isLast = step === tips.length - 1;

  // Section bounds in absolute pixels (from cx/cy absolute coords)
  const secLeft = Math.max(0, tip.cx - tip.sectionW / 2);
  const secTop = Math.max(0, tip.cy - tip.sectionH / 2);
  const secRight = Math.min(width, secLeft + tip.sectionW);
  const secBottom = Math.min(height, secTop + tip.sectionH);
  const clampedSecW = secRight - secLeft;
  const clampedSecH = secBottom - secTop;

  // Tooltip card — stays in screen bounds, avoids highlighted section
  const cardMaxWidth = Math.min(width - 48, 340);
  const cardLeft = (width - cardMaxWidth) / 2;
  const cardStyle =
    tip.cardAnchor === 'top'
      ? { top: 20, left: cardLeft, width: cardMaxWidth }
      : { bottom: TAB_BAR_H + 12, left: cardLeft, width: cardMaxWidth };

  // Glow animation interpolations (JS thread — shadow props)
  const glowShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1.0],
  });
  const glowShadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 34],
  });
  const glowBgOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.0, 0.12],
  });

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>

        {/* ── Dimmed backdrop — 4 rects surrounding the revealed section ── */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={dismiss}>
          {/* Top */}
          <View
            style={[styles.dim, { top: 0, left: 0, width, height: secTop }]}
          />
          {/* Left */}
          <View
            style={[styles.dim, { top: secTop, left: 0, width: secLeft, height: clampedSecH }]}
          />
          {/* Right */}
          <View
            style={[
              styles.dim,
              { top: secTop, left: secRight, width: Math.max(0, width - secRight), height: clampedSecH },
            ]}
          />
          {/* Bottom */}
          <View
            style={[
              styles.dim,
              { top: secBottom, left: 0, width, height: Math.max(0, height - secBottom) },
            ]}
          />
        </Pressable>

        {/* ── Glow fill — tinted overlay inside the section ── */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowFill,
            {
              left: secLeft,
              top: secTop,
              width: clampedSecW,
              height: clampedSecH,
              borderRadius: tip.radius,
              opacity: glowBgOpacity,
            },
          ]}
        />

        {/* ── Glow border ring — animated shadow + border ── */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowBorder,
            {
              left: secLeft,
              top: secTop,
              width: clampedSecW,
              height: clampedSecH,
              borderRadius: tip.radius,
              shadowOpacity: glowShadowOpacity,
              shadowRadius: glowShadowRadius,
            },
          ]}
        />

        {/* ── Outer halo ring (extra glow layer for depth) ── */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowHalo,
            {
              left: secLeft - 6,
              top: secTop - 6,
              width: clampedSecW + 12,
              height: clampedSecH + 12,
              borderRadius: tip.radius + 6,
              opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] }),
            },
          ]}
        />

        {/* ── Tooltip card ── */}
        <View style={[styles.card, cardStyle]}>
          {/* Progress dots */}
          <View style={styles.dots}>
            {tips.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{tip.icon}</Text>
          </View>

          {/* Content */}
          <Text style={styles.title}>{tip.title}</Text>
          <Text style={styles.body}>{tip.body}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={dismiss} hitSlop={8}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextText}>{isLast ? 'Get started' : 'Next'}</Text>
            </Pressable>
          </View>

          <Text style={styles.counter}>
            {step + 1} of {tips.length}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const DIM_COLOR = 'rgba(0,0,0,0.82)';
const GLOW_COLOR = appTheme.colors.playstationBlue;

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    backgroundColor: DIM_COLOR,
  },
  glowFill: {
    position: 'absolute',
    backgroundColor: GLOW_COLOR,
  },
  glowBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: GLOW_COLOR,
    backgroundColor: 'transparent',
    shadowColor: GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity + shadowRadius are animated
  },
  glowHalo: {
    position: 'absolute',
    backgroundColor: GLOW_COLOR,
    borderRadius: 20,
  },
  card: {
    position: 'absolute',
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.cardLarge,
    padding: appTheme.spacing.xl,
    alignItems: 'center',
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appTheme.colors.playstationBlue,
    ...appTheme.elevation.high,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: appTheme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appTheme.surface.border,
  },
  dotActive: {
    backgroundColor: appTheme.colors.playstationBlue,
    width: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: appTheme.colors.playstationBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 20,
    fontWeight: '700',
  },
  title: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayS,
    textAlign: 'center',
  },
  body: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: appTheme.spacing.sm,
  },
  skipText: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.caption,
  },
  nextBtn: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingHorizontal: appTheme.spacing.xl,
    paddingVertical: 10,
  },
  nextText: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.button,
  },
  counter: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
  },
});
