import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenFrame } from '../components/ScreenFrame';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';
import { ChoiceRow } from './shared/ChoiceRow';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { state, setUnits, setGpsConsent } = useAppState();

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title="Settings"
            subtitle={state.profile.zone}
            onBack={() => navigation.goBack()}
          />
        }
      >
        <SurfaceCard title="Preferences">
          <ChoiceRow
            label="Units"
            options={['metric', 'imperial']}
            value={state.units}
            onChange={(v) => setUnits(v as 'metric' | 'imperial')}
          />
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.toggleTitle}>GPS activity detection</Text>
              <Text style={styles.toggleBody}>Opt-in tracking. Requires your explicit consent.</Text>
            </View>
            <Switch
              value={state.gpsConsent}
              onValueChange={setGpsConsent}
              trackColor={{ false: appTheme.surface.border, true: appTheme.colors.playstationBlue }}
              thumbColor={appTheme.colors.inverseWhite}
            />
          </View>
        </SurfaceCard>

      </ScreenFrame>

    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: appTheme.spacing.md,
    alignItems: 'center',
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.media,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
    fontWeight: '600',
  },
  toggleBody: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.caption,
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.media,
    padding: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  linkRowPressed: {
    borderColor: appTheme.colors.playstationBlue,
  },
  linkContent: {
    flex: 1,
    gap: 2,
    marginRight: appTheme.spacing.sm,
  },
  linkTitle: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.body,
    fontWeight: '600',
  },
  linkBody: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.caption,
    marginTop: 2,
  },
  chevron: {
    color: appTheme.colors.playstationBlue,
    fontSize: 18,
    fontWeight: '700',
  },
});
