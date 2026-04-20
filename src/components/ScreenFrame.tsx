import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appTheme } from '../theme';

export function ScreenFrame({
  header,
  children,
  onRefresh,
  refreshing = false,
}: {
  header: ReactNode;
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {header}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={appTheme.colors.playstationBlue}
                colors={[appTheme.colors.playstationBlue]}
              />
            ) : undefined
          }
        >
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
