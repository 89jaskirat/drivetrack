import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../types';
import { appTheme } from '../theme';
import { ComponentLabel } from './ComponentLabel';

export function AppHeader({
  title,
  subtitle,
  onMenuPress,
  onProfilePress,
}: {
  title: string;
  subtitle: string;
  onMenuPress: () => void;
  onProfilePress: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={onMenuPress} style={styles.menuButton}>
          <Text style={styles.menuText}>≡</Text>
        </Pressable>
        <Pressable onPress={onProfilePress} style={styles.profileBlock}>
          <ComponentLabel name="AppHeader" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  menuButton: {
    width: 52,
    height: 52,
    borderRadius: appTheme.radii.button,
    backgroundColor: appTheme.colors.playstationBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: appTheme.colors.inverseWhite,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
  profileBlock: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: appTheme.colors.inverseWhite,
    fontSize: 30,
    fontWeight: '300',
  },
  subtitle: {
    color: appTheme.colors.darkLinkBlue,
    fontSize: 14,
  },
});
