import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenFrame } from '../components/ScreenFrame';
import { useAppState } from '../state/AppStateContext';
import { Deal, DealCategory } from '../types';
import { appTheme } from '../theme';

const CATEGORIES: Array<DealCategory | 'All'> = ['All', 'Mechanics', 'Gas', 'Insurance', 'Restaurants', 'Other'];

const CATEGORY_ICONS: Record<string, string> = {
  Gas: '⛽',
  Insurance: '🛡',
  Mechanics: '🔧',
  Restaurants: '🍔',
  Other: '●',
};

export function DealsScreen() {
  const { state, refreshFromCloud } = useAppState();
  const [activeCategory, setActiveCategory] = useState<DealCategory | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFromCloud();
    setRefreshing(false);
  }, [refreshFromCloud]);

  const filtered =
    activeCategory === 'All'
      ? state.deals
      : state.deals.filter((d) => d.category === activeCategory);

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title={state.profile.name}
            subtitle={`${state.profile.zone} deals`}
          />
        }
        onRefresh={handleRefresh}
        refreshing={refreshing}
      >
        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRail}
          style={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No deals in this category yet.</Text>
          </View>
        ) : (
          filtered.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </ScreenFrame>

    </View>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.sponsorBadge}>
          <Text style={styles.sponsorIcon}>{CATEGORY_ICONS[deal.category] ?? '●'}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.sponsor}>{deal.sponsor}</Text>
          <Text style={styles.dealZone}>{deal.zone}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{deal.category}</Text>
        </View>
      </View>

      <Text style={styles.headline}>{deal.headline}</Text>
      <Text style={styles.detail}>{deal.detail}</Text>

      <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
        <Text style={styles.ctaText}>{deal.cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    marginTop: appTheme.spacing.xs,
  },
  filterRail: {
    gap: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
    borderRadius: appTheme.radii.button,
    backgroundColor: appTheme.surface.input,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  filterChipActive: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderColor: appTheme.colors.playstationBlue,
  },
  filterText: {
    color: appTheme.colors.secondaryText,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: appTheme.colors.inverseWhite,
  },
  card: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    marginTop: appTheme.spacing.base,
    gap: appTheme.spacing.sm,
    ...appTheme.elevation.low,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
  },
  sponsorBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: appTheme.colors.playstationBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorIcon: {
    fontSize: 20,
  },
  cardMeta: {
    flex: 1,
    gap: 2,
  },
  sponsor: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.caption,
    fontWeight: '600',
  },
  dealZone: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
  },
  categoryBadge: {
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.button,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  categoryText: {
    color: appTheme.colors.secondaryText,
    fontSize: 11,
    fontWeight: '500',
  },
  headline: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.headingS,
  },
  detail: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
    lineHeight: 22,
  },
  cta: {
    backgroundColor: appTheme.colors.playstationBlue,
    borderRadius: appTheme.radii.button,
    paddingVertical: 12,
    paddingHorizontal: appTheme.spacing.xl,
    alignItems: 'center',
    marginTop: appTheme.spacing.xs,
  },
  ctaPressed: {
    opacity: 0.6,
  },
  ctaText: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.button,
  },
  empty: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.body,
  },
});
