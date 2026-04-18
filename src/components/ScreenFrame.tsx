import { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { appTheme } from '../theme';

export function ScreenFrame({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {header}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.surface.screen,
  },
  container: {
    flex: 1,
    paddingHorizontal: appTheme.spacing.base,
    paddingTop: appTheme.spacing.sm,
  },
  content: {
    paddingBottom: 120,
  },
});
