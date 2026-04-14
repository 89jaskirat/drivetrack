import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { AppMenu } from '../components/AppMenu';
import { ScreenFrame } from '../components/ScreenFrame';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { ChoiceRow } from './shared/ChoiceRow';
import { useState } from 'react';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { state, setUnits, setGpsConsent } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title={state.profile.name}
            subtitle="Settings"
            onMenuPress={() => setMenuOpen(true)}
            onProfilePress={() => navigation.navigate('Profile')}
          />
        }
      >
        <SurfaceCard componentName="SettingsPreferencesCard" title="Preferences" subtitle="Local controls that used to live in the bottom tab.">
          <ChoiceRow label="Units" options={['metric', 'imperial']} value={state.units} onChange={(value) => setUnits(value as 'metric' | 'imperial')} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>GPS activity detection</Text>
              <Text style={styles.toggleBody}>Consent-based tracking, disabled unless the driver chooses it.</Text>
            </View>
            <Switch value={state.gpsConsent} onValueChange={setGpsConsent} />
          </View>
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
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    color: appTheme.colors.displayInk,
    fontSize: 16,
    fontWeight: '700',
  },
  toggleBody: {
    color: appTheme.colors.bodyGray,
    lineHeight: 20,
  },
});
