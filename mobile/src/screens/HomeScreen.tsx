import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { AppMenu } from '../components/AppMenu';
import { CarouselRail } from '../components/CarouselRail';
import { ComponentLabel } from '../components/ComponentLabel';
import { ScreenFrame } from '../components/ScreenFrame';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAppState } from '../state/AppStateContext';
import { RootStackParamList } from '../types';
import { appTheme } from '../theme';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { state, analytics } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title={state.profile.name}
            subtitle={`${state.profile.zone} driver view`}
            onMenuPress={() => setMenuOpen(true)}
            onProfilePress={() => navigation.navigate('Profile')}
          />
        }
      >
        <View style={styles.heroPanel}>
          <ComponentLabel name="HomeHeroPanel" />
          <Text style={styles.heroTitle}>Quiet authority, clear numbers, faster decisions.</Text>
          <Text style={styles.heroCopy}>
            A driver-first dashboard with premium dark surfaces, bright editorial cards, and fast local context.
          </Text>
        </View>

        <SurfaceCard componentName="HomeMetricsPanel" title="Shift snapshot" subtitle="Big numbers first, clutter last.">
          <View style={styles.metricGrid}>
            <MetricCell title="Distance" value={`${analytics.km.toFixed(0)} ${state.units === 'metric' ? 'km' : 'mi'}`} />
            <MetricCell title="Profit" value={`$${analytics.profit.toFixed(0)}`} />
            <MetricCell title="Fuel spend" value={`$${analytics.fuelCost.toFixed(0)}`} />
            <MetricCell title="Efficiency" value={`${analytics.fuelPer100.toFixed(1)} L/100km`} />
          </View>
        </SurfaceCard>

        <SurfaceCard componentName="GasStationCarousel" title="Lowest gas" subtitle="Swipe through the top three nearby placeholders.">
          <CarouselRail mode="gas" items={state.gas} />
        </SurfaceCard>

        <SurfaceCard
          componentName="CommunityPulseCarousel"
          title="Community pulse"
          subtitle="Swipe through the top trending posts in your zone."
        >
          <CarouselRail mode="community" items={state.posts} onOpenCommunity={() => navigation.navigate('Community')} />
        </SurfaceCard>
      </ScreenFrame>

      <AppMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onProfilePress={() => {
          setMenuOpen(false);
          navigation.navigate('Profile');
        }}
        onSettingsPress={() => {
          setMenuOpen(false);
          navigation.navigate('Settings');
        }}
      />
    </View>
  );
}

function MetricCell({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroPanel: {
    backgroundColor: appTheme.colors.shadowBlack,
    borderRadius: appTheme.radii.card,
    borderWidth: 1,
    borderColor: appTheme.colors.playstationBlue,
    padding: 24,
    marginTop: 4,
  },
  heroTitle: {
    color: appTheme.colors.inverseWhite,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '300',
    marginTop: 12,
  },
  heroCopy: {
    color: appTheme.colors.muteGray,
    lineHeight: 22,
    marginTop: 12,
  },
  metricGrid: {
    gap: 12,
  },
  metricCell: {
    backgroundColor: appTheme.colors.iceMist,
    borderRadius: appTheme.radii.media,
    padding: 14,
  },
  metricLabel: {
    color: appTheme.colors.bodyGray,
    fontSize: 12,
  },
  metricValue: {
    color: appTheme.colors.displayInk,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 6,
  },
});
