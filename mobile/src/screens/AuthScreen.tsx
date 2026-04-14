import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { ChoiceRow } from '../screens/shared/ChoiceRow';
import { Field } from '../screens/shared/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import { roles, zones } from '../data/seed';
import { useAppState } from '../state/AppStateContext';
import { Role } from '../types';
import { appTheme } from '../theme';

export function AuthScreen() {
  const { state, signIn } = useAppState();
  const [name, setName] = useState(state.profile.name);
  const [role, setRole] = useState<Role>(state.profile.role);
  const [zone, setZone] = useState(state.profile.zone);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Component: AuthHeroPanel</Text>
        <Text style={styles.title}>A driver-owned control center for the next shift.</Text>
        <Text style={styles.subtitle}>
          Mobile-first local MVP with PlayStation-inspired surfaces, navigation, and driver workflows.
        </Text>
      </View>
      <SurfaceCard
        componentName="AuthSignInCard"
        title="Local sign-in"
        subtitle="Choose a driver profile so we can open the app in prototype mode."
      >
        <Field label="Display name" value={name} onChangeText={setName} />
        <ChoiceRow label="Role" options={roles as unknown as string[]} value={role} onChange={(value) => setRole(value as Role)} />
        <ChoiceRow label="Zone" options={zones} value={zone} onChange={setZone} />
        <ActionButton label="Enter app" onPress={() => signIn({ name, role, zone })} />
      </SurfaceCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.consoleBlack,
  },
  content: {
    padding: 16,
    paddingTop: 28,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: appTheme.colors.shadowBlack,
    borderRadius: appTheme.radii.card,
    borderWidth: 1,
    borderColor: appTheme.colors.playstationBlue,
    padding: 24,
    marginBottom: 4,
  },
  kicker: {
    color: appTheme.colors.darkLinkBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: appTheme.colors.inverseWhite,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '300',
    marginTop: 10,
  },
  subtitle: {
    color: appTheme.colors.muteGray,
    marginTop: 12,
    lineHeight: 22,
  },
});
