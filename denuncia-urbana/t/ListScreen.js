import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, STATUS_COLORS, getCategoryById } from './categories';
import { COLORS, RADIUS, FONT } from './theme';

export default function ListScreen({ reports, loading, onSelectReport, onRefresh }) {
  const [filterCat, setFilterCat] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = filterCat ? reports.filter((r) => r.category === filterCat) : reports;

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.chip, !filterCat && styles.chipActive]}
          onPress={() => setFilterCat(null)}
        >
          <Text style={[styles.chipText, !filterCat && styles.chipTextActive]}>
            Todas ({reports.length})
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => {
          const count = reports.filter((r) => r.category === cat.id).length;
          if (count === 0) return null;
          const active = filterCat === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, active && { borderColor: cat.color, backgroundColor: cat.color + '18' }]}
              onPress={() => setFilterCat(active ? null : cat.id)}
            >
              <Ionicons name={cat.icon} size={13} color={active ? cat.color : COLORS.gray500} />
              <Text style={[styles.chipText, active && { color: cat.color }]}>{cat.label} ({count})</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Dica de uso */}
      <View style={styles.hintBar}>
        <Ionicons name="location-outline" size={13} color={COLORS.primary} />
        <Text style={styles.hintText}>Toque em uma denúncia para localizá-la no mapa</Text>
      </View>

      {loading && reports.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando denúncias...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={52} color={COLORS.gray400} />
              <Text style={styles.emptyTitle}>Nenhuma denúncia</Text>
              <Text style={styles.emptySub}>
                {filterCat ? 'Tente outro filtro.' : 'Use o botão + no mapa para registrar.'}
              </Text>
            </View>
          ) : (
            filtered.map((report) => {
              const cat = getCategoryById(report.category);
              const sc = STATUS_COLORS[report.status] || STATUS_COLORS['Aberto'];
              return (
                <TouchableOpacity
                  key={report.id}
                  style={styles.card}
                  onPress={() => onSelectReport(report)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.catIcon, { backgroundColor: cat.color }]}>
                    <Ionicons name={cat.icon} size={18} color="#FFF" />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{report.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                        <Text style={[styles.statusText, { color: sc.text }]}>{report.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardMeta}>{cat.label} · {report.date}</Text>
                    {report.description ? <Text style={styles.cardDesc} numberOfLines={2}>{report.description}</Text> : null}
                    {/* Coordenadas do local */}
                    {report.coordinate && (
                      <View style={styles.coordRow}>
                        <Ionicons name="location-outline" size={11} color={COLORS.primary} />
                        <Text style={styles.coordText}>
                          {report.coordinate.latitude.toFixed(4)}, {report.coordinate.longitude.toFixed(4)}
                        </Text>
                      </View>
                    )}
                  </View>
                  {report.photo
                    ? <Image source={{ uri: report.photo }} style={styles.thumb} />
                    : (
                      <View style={styles.locateIcon}>
                        <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />
                      </View>
                    )
                  }
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  filterBar: { borderBottomWidth: 0.5, borderBottomColor: COLORS.gray200, maxHeight: 52 },
  filterContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 12, color: COLORS.gray600, fontWeight: FONT.medium },
  chipTextActive: { color: COLORS.primary },
  hintBar: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.gray200,
  },
  hintText: { fontSize: 12, color: COLORS.primary },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.gray500 },
  listContent: { padding: 12, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.gray200,
    marginBottom: 10, padding: 12, gap: 11,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  catIcon: { width: 40, height: 40, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  cardTitle: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.gray900, flex: 1, marginRight: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: FONT.semibold },
  cardMeta: { fontSize: 12, color: COLORS.gray500, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: COLORS.gray600, lineHeight: 18, marginBottom: 4 },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  coordText: { fontSize: 11, color: COLORS.primary },
  thumb: { width: 54, height: 54, borderRadius: RADIUS.sm },
  locateIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 17, fontWeight: FONT.semibold, color: COLORS.gray700, marginTop: 14 },
  emptySub: { fontSize: 14, color: COLORS.gray500, textAlign: 'center', marginTop: 6, paddingHorizontal: 32 },
});
