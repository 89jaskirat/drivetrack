import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';
import { ComponentLabel } from './ComponentLabel';

export function SurfaceCard({
  componentName,
  title,
  subtitle,
  children,
}: {
  componentName: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <ComponentLabel name={componentName} tone="light" />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appTheme.colors.paperWhite,
    borderRadius: appTheme.radii.card,
    padding: 18,
    marginTop: 16,
    ...appTheme.shadows.light,
  },
  title: {
    color: appTheme.colors.displayInk,
    fontSize: 28,
    fontWeight: '300',
    marginTop: 10,
  },
  subtitle: {
    color: appTheme.colors.bodyGray,
    marginTop: 6,
    lineHeight: 20,
  },
  body: {
    gap: 12,
    marginTop: 14,
  },
});
