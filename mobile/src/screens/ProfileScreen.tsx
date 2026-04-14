import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { ComponentLabel } from '../components/ComponentLabel';
import { ScreenFrame } from '../components/ScreenFrame';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAppState } from '../state/AppStateContext';
import { appTheme } from '../theme';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state } = useAppState();

  return (
    <ScreenFrame
      header={
        <View style={styles.header}>
          <ComponentLabel name="ProfileScreenHeader" />
        </View>
      }
    >
      <SurfaceCard componentName="ProfileIdentityCard" title={state.profile.name} subtitle={`${state.profile.zone} • ${state.profile.role}`}>
        <DetailRow label="Phone" value={state.profile.phone} />
        <DetailRow label="Email" value={state.profile.email} />
        <DetailRow label="Zone" value={state.profile.zone} />
        <ActionButton label="Open settings" onPress={() => navigation.navigate('Settings')} />
      </SurfaceCard>
    </ScreenFrame>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelWrap}>
        <ComponentLabel name={`ProfileField:${label}`} tone="light" />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
  },
  detailRow: {
    backgroundColor: appTheme.colors.iceMist,
    borderRadius: appTheme.radii.media,
    padding: 14,
    gap: 6,
  },
  detailLabelWrap: {
    marginBottom: 4,
  },
  detailLabel: {
    color: appTheme.colors.bodyGray,
    fontSize: 12,
  },
  detailValue: {
    color: appTheme.colors.displayInk,
    fontSize: 18,
    fontWeight: '600',
  },
});
