import { StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';

export function ComponentLabel({ name, tone = 'dark' }: { name: string; tone?: 'dark' | 'light' }) {
  return (
    <View style={[styles.label, tone === 'light' && styles.labelLight]}>
      <Text style={[styles.text, tone === 'light' && styles.textLight]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    alignSelf: 'flex-start',
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  labelLight: {
    backgroundColor: appTheme.colors.iceMist,
  },
  text: {
    color: appTheme.colors.inverseWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  textLight: {
    color: appTheme.colors.playstationBlue,
  },
});
