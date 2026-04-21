import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { appTheme } from '../theme';

const ONBOARDING_KEY = 'drivetrack-onboarding-complete';

type Tip = {
  icon: string;
  title: string;
  body: string;
  /** Spotlight position as fraction of screen (0-1) */
  spotX: number;
  spotY: number;
  /** Where to anchor the card — 'top' = card sits near top, 'bottom' = near bottom */
  cardAnchor: 'top' | 'bottom';
};

const TIPS: Tip[] = [
  {
    icon: '+',
    title: 'Quick-log anything',
    body: 'Tap the + button to log mileage, fuel, expenses, or earnings in seconds.',
    spotX: 0.87,
    spotY: 0.85,
    cardAnchor: 'top',
  },
  {
    icon: '▶',
    title: 'Shift tracking',
    body: 'Start a shift to auto-track your time and distance on the road.',
    spotX: 0.5,
    spotY: 0.27,
    cardAnchor: 'bottom',
  },
  {
    icon: '⬡',
    title: 'Community forum',
    body: 'Ask questions, share tips, and find intel from drivers in your zone.',
    spotX: 0.3,
    spotY: 0.96,
    cardAnchor: 'top',
  },
  {
    icon: '⛽',
    title: 'Lowest gas prices',
    body: 'See the cheapest gas near you, updated daily by the community.',
    spotX: 0.5,
    spotY: 0.52,
    cardAnchor: 'top',
  },
  {
    icon: '★',
    title: 'Deals & promos',
    body: 'Exclusive discounts from local mechanics, gas stations, and restaurants.',
    spotX: 0.5,
    spotY: 0.96,
    cardAnchor: 'top',
  },
];

const SPOT_SIZE = 72;

export function OnboardingTooltips() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { width, height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      if (!v) {
        setVisible(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        startPulse();
      }
    });
    return () => pulseLoop.current?.stop();
  }, []);

  // Restart pulse when step changes
  useEffect(() => {
    if (!visible) return;
    pulseAnim.setValue(1);
    startPulse();
    return () => pulseLoop.current?.stop();
  }, [step, visible]);

  function startPulse() {
    pulseLoop.current?.stop();
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulseLoop.current.start();
  }

  const handleNext = () => {
    if (step < TIPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const dismiss = () => {
    pulseLoop.current?.stop();
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
      AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    });
  };

  if (!visible) return null;

  const tip = TIPS[step];
  const isLast = step === TIPS.length - 1;

  // Spotlight centre in absolute pixels
  const spotCX = tip.spotX * width;
  const spotCY = tip.spotY * height;

  // Card position: anchor top or bottom, keeping away from spotlight
  const cardMaxWidth = Math.min(width - 48, 340);
  const cardLeft = (width - cardMaxWidth) / 2;

  const cardStyle = tip.cardAnchor === 'top'
    ? { top: 60, left: cardLeft, width: cardMaxWidth }
    : { bottom: 100, left: cardLeft, width: cardMaxWidth };

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: fadeAnim }]}>
      {/* Dimmed backdrop */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={dismiss}>
        <View style={[StyleSheet.absoluteFillObject, styles.backdrop]} />
      </Pressable>

      {/* Spotlight ring */}
      <View
        style={[
          styles.spotlightWrap,
          {
            left: spotCX - SPOT_SIZE / 2,
            top: spotCY - SPOT_SIZE / 2,
            width: SPOT_SIZE,
            height: SPOT_SIZE,
          },
        ]}
        pointerEvents="none"
      >
        {/* Solid highlight circle */}
        <View style={styles.spotlightInner} />
        {/* Pulsing outer ring */}
        <Animated.View
          style={[
            styles.spotlightRing,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
      </View>

      {/* Tooltip card */}
      <View style={[styles.card, cardStyle]}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {TIPS.map((_, i) => (
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

        <Text style={styles.counter}>{step + 1} of {TIPS.length}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  spotlightWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightInner: {
    position: 'absolute',
    width: SPOT_SIZE,
    height: SPOT_SIZE,
    borderRadius: SPOT_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: appTheme.colors.playstationBlue,
  },
  spotlightRing: {
    position: 'absolute',
    width: SPOT_SIZE,
    height: SPOT_SIZE,
    borderRadius: SPOT_SIZE / 2,
    borderWidth: 2,
    borderColor: appTheme.colors.playstationBlue,
    opacity: 0.5,
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
