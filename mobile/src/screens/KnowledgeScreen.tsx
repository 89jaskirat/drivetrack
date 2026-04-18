import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenFrame } from '../components/ScreenFrame';
import { useAppState } from '../state/AppStateContext';
import { KnowledgeArticle, KnowledgeCategory } from '../types';
import { appTheme } from '../theme';

const CATEGORIES: Array<KnowledgeCategory | 'All'> = ['All', 'Tax', 'Tips', 'Maintenance'];

export function KnowledgeScreen() {
  const { state } = useAppState();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory | 'All'>('All');
  const [openArticle, setOpenArticle] = useState<KnowledgeArticle | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return state.articles.filter((a) => {
      const matchCat = activeCategory === 'All' || a.category === activeCategory;
      const matchSearch = !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, search, state.articles]);

  if (openArticle) {
    return (
      <View style={{ flex: 1, backgroundColor: appTheme.surface.screen }}>
        <View style={styles.articleHeader}>
          <Pressable onPress={() => setOpenArticle(null)} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <View style={styles.articleMeta}>
            <Text style={styles.articleCategory}>{openArticle.category}</Text>
            <Text style={styles.articleReadTime}>{openArticle.readMinutes} min read</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.articleContent}>
          <Text style={styles.articleTitle}>{openArticle.title}</Text>
          <Text style={styles.articleSummary}>{openArticle.summary}</Text>
          <View style={styles.articleDivider} />
          <Text style={styles.articleBody}>{openArticle.body}</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenFrame
        header={
          <AppHeader
            title={state.profile.name}
            subtitle="Knowledge base"
          />
        }
      >
        {/* Search */}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search articles..."
          placeholderTextColor={appTheme.colors.bodyGray}
          style={styles.searchInput}
        />

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
            <Text style={styles.emptyText}>No articles found.</Text>
          </View>
        ) : (
          filtered.map((article) => (
            <Pressable
              key={article.id}
              style={({ pressed }) => [styles.articleCard, pressed && styles.articleCardPressed]}
              onPress={() => setOpenArticle(article)}
            >
              <View style={styles.articleCardHeader}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{article.category}</Text>
                </View>
                <Text style={styles.readTime}>{article.readMinutes} min</Text>
              </View>
              <Text style={styles.cardTitle}>{article.title}</Text>
              <Text style={styles.cardSummary} numberOfLines={2}>
                {article.summary}
              </Text>
              <Text style={styles.readMore}>Read article →</Text>
            </Pressable>
          ))
        )}
      </ScreenFrame>

    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    borderRadius: appTheme.radii.input,
    backgroundColor: appTheme.surface.input,
    color: appTheme.colors.inverseWhite,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
    ...appTheme.typography.body,
    marginTop: appTheme.spacing.sm,
  },
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
  articleCard: {
    backgroundColor: appTheme.surface.card,
    borderRadius: appTheme.radii.card,
    padding: appTheme.spacing.lg,
    marginTop: appTheme.spacing.base,
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
    ...appTheme.elevation.low,
  },
  articleCardPressed: {
    borderColor: appTheme.colors.playstationBlue,
  },
  articleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: appTheme.surface.input,
    borderRadius: appTheme.radii.button,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: appTheme.surface.border,
  },
  categoryPillText: {
    color: appTheme.colors.secondaryText,
    fontSize: 11,
    fontWeight: '500',
  },
  readTime: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
  },
  cardTitle: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.headingS,
  },
  cardSummary: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
    lineHeight: 22,
  },
  readMore: {
    color: appTheme.colors.playstationBlue,
    fontWeight: '600',
    fontSize: 13,
    marginTop: appTheme.spacing.xs,
  },
  // Article detail view
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.base,
    paddingTop: 52,
    paddingBottom: appTheme.spacing.md,
  },
  backButton: {
    paddingVertical: 6,
  },
  backText: {
    color: appTheme.colors.playstationBlue,
    ...appTheme.typography.body,
    fontWeight: '600',
  },
  articleMeta: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    alignItems: 'center',
  },
  articleCategory: {
    color: appTheme.colors.playstationBlue,
    ...appTheme.typography.caption,
    fontWeight: '600',
  },
  articleReadTime: {
    color: appTheme.colors.bodyGray,
    ...appTheme.typography.micro,
  },
  articleContent: {
    paddingHorizontal: appTheme.spacing.base,
    paddingBottom: 60,
  },
  articleTitle: {
    color: appTheme.colors.inverseWhite,
    ...appTheme.typography.displayM,
    marginBottom: appTheme.spacing.md,
  },
  articleSummary: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  articleDivider: {
    height: 1,
    backgroundColor: appTheme.surface.border,
    marginVertical: appTheme.spacing.xl,
  },
  articleBody: {
    color: appTheme.colors.secondaryText,
    ...appTheme.typography.body,
    lineHeight: 28,
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
