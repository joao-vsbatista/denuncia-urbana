import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_OPTIONS, STATUS_COLORS, getCategoryById } from './categories';
import { COLORS, RADIUS, FONT } from './theme';

export default function ReportDetailModal({ report, visible, onClose, onStatusChange }) {
  if (!report) return null;

  const cat = getCategoryById(report.category);
  const sc  = STATUS_COLORS[report.status] || STATUS_COLORS['Aberto'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>

            <View style={styles.header}>
              <View style={[styles.catIcon, { backgroundColor: cat.color }]}>
                <Ionicons name={cat.icon} size={20} color="#FFF" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{report.title}</Text>
                <Text style={styles.meta}>{cat.label} · {report.date}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.gray500} />
              </TouchableOpacity>
            </View>

            {report.photo && <Image source={{ uri: report.photo }} style={styles.photo} />}

            {report.description ? <Text style={styles.description}>{report.description}</Text> : null}

            <View style={styles.coordRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray500} />
              <Text style={styles.coordText}>
                {report.coordinate.latitude.toFixed(5)}, {report.coordinate.longitude.toFixed(5)}
              </Text>
            </View>

            <Text style={styles.statusLabel}>Status da Denúncia</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((s) => {
                const ssc = STATUS_COLORS[s];
                const active = report.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, active && { backgroundColor: ssc.bg, borderColor: ssc.dot }]}
                    onPress={() => onStatusChange(report.id, s)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: active ? ssc.dot : COLORS.gray400 }]} />
                    <Text style={[styles.statusChipText, active && { color: ssc.text, fontWeight: FONT.semibold }]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: 16, paddingBottom: 36, maxHeight: '85%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.gray200, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  catIcon: { width: 42, height: 42, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: FONT.bold, color: COLORS.gray900 },
  meta: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },
  closeBtn: { padding: 2 },
  photo: { width: '100%', height: 190, borderRadius: RADIUS.lg, marginBottom: 14 },
  description: { fontSize: 14, color: COLORS.gray600, lineHeight: 20, marginBottom: 14 },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  coordText: { fontSize: 12, color: COLORS.gray500, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  statusLabel: {
    fontSize: 12, fontWeight: FONT.semibold, color: COLORS.gray600,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: RADIUS.sm,
    borderWidth: 1.5, borderColor: COLORS.gray200, backgroundColor: COLORS.white,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusChipText: { fontSize: 12, color: COLORS.gray600 },
});
