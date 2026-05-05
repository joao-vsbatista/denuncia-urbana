import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT } from './theme';

const TITLES = {
  map:    'Denúncia Urbana',
  report: 'Nova Denúncia',
  list:   'Denúncias',
};

export default function Header({ screen, onNavigate }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{TITLES[screen] || 'Denúncia Urbana'}</Text>
      <View style={styles.actions}>
        {screen === 'map' && (
          <TouchableOpacity style={styles.btn} onPress={() => onNavigate('list')}>
            <Ionicons name="list-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {screen === 'list' && (
          <TouchableOpacity style={styles.btn} onPress={() => onNavigate('map')}>
            <Ionicons name="map-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {screen === 'report' && (
          <TouchableOpacity style={styles.btn} onPress={() => onNavigate('map')}>
            <Ionicons name="close-outline" size={25} color={COLORS.gray500} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 10,
    paddingBottom: 13, paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5, borderBottomColor: '#D3D1C7',
  },
  title: { fontSize: 18, fontWeight: FONT.semibold, color: COLORS.gray900 },
  actions: { flexDirection: 'row', gap: 4 },
  btn: { padding: 6 },
});
