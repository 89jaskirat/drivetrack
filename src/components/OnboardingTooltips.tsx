import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { appTheme } from '../theme';

const ONBOARDING_KEY = 'drivetrack-onboarding-complete';

type Tip = {
  icon: string;
  title: string;
  body: string;
};

const TIPS: Tip[] = [
  {
    icon: '+',
    title: 'Quick-log anything',
    body: 'Tap the + button to log mileage, fuel, expenses, or earnings in seconds.',
  },
  {
    icon: '▶',
    title: 'Shift tracking',
    body: 'Start a shift to auto-track your time and distance on the road.',
  },
  {
    icon: '⬡',
    title: 'Community forum',
    body: 'Ask questions, share tips, and find intel from drivers in your zone.',
  },
  {
    icon: '⛽',
    title: 'Lowest gas prices',
    body: 'See the cheapest gas near you, updated daily by the community.',
  },
  {
    icon: '★',
    title: 'Deals & promos',
    body: 'Exclusive discounts from local mechanics, gas stations, and restaurants.',
  },
];

export function OnboardingTooltips() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const { width } = useWindowDimensions();
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      if (!v) {
        setVisible(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    });
  }, []);

  const handleNext = () => {
    if (step < TIPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const dismiss = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
      AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    });
  };

  if (!visible) return null;

  const tip = TIPS[step];
  const isLast = step === TIPS.length - 1;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={styles.backdrop} onPress={dismiss} />
      <View style={[styles.card, { maxWidth: Math.min(width - 48, 360) }]}>
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

        {/* Step counter */}
        <Text style={styles.counter}>{step + 1} of {TIPS.length}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  card: {
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: appTheme.colors.playstationBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 24,
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
