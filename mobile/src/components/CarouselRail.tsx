import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GasPrice, ForumPost } from '../types';
import { appTheme } from '../theme';
import { ActionButton } from './ActionButton';

type GasRailProps = {
  mode: 'gas';
  items: GasPrice[];
};

type CommunityRailProps = {
  mode: 'community';
  items: ForumPost[];
  onOpenCommunity: () => void;
};

export function CarouselRail(props: GasRailProps | CommunityRailProps) {
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {props.mode === 'gas'
        ? props.items.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.slide}>
              <Text style={styles.slideTitle}>{item.station}</Text>
              <Text style={styles.slideValue}>${item.price.toFixed(2)} / L</Text>
              <Text style={styles.slideBody}>{item.distanceKm.toFixed(1)} km away</Text>
              <Text style={styles.slideBody}>{item.address}</Text>
              <ActionButton
                label="Open in Google Maps"
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address)}`,
                  )
                }
              />
            </View>
          ))
        : props.items.slice(0, 3).map((item) => (
            <Pressable key={item.id} style={styles.slide} onPress={props.onOpenCommunity}>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideValue}>{item.votes} votes</Text>
              <Text style={styles.slideBody} numberOfLines={4}>
                {item.body}
              </Text>
              <Text style={styles.linkText}>Open thread</Text>
            </Pressable>
          ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    gap: 12,
  },
  slide: {
    width: 290,
    backgroundColor: appTheme.colors.iceMist,
    borderRadius: appTheme.radii.card,
    padding: 16,
    gap: 8,
  },
  slideTitle: {
    color: appTheme.colors.displayInk,
    fontSize: 20,
    fontWeight: '300',
  },
  slideValue: {
    color: appTheme.colors.playstationBlue,
    fontSize: 24,
    fontWeight: '700',
  },
  slideBody: {
    color: appTheme.colors.bodyGray,
    lineHeight: 20,
  },
  linkText: {
    color: appTheme.colors.playstationBlue,
    fontWeight: '700',
    marginTop: 8,
  },
});
