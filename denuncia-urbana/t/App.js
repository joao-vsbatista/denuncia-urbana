import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MapScreen         from './MapScreen';
import ReportScreen      from './ReportScreen';
import ListScreen        from './ListScreen';
import Header            from './Header';
import ReportDetailModal from './ReportDetailModal';

import { useLocation } from './useLocation';
import { useReports }  from './useReports';
import { COLORS }      from './theme';

export default function App() {
  const [screen, setScreen]           = useState('map');
  const [selectedReport, setSelected] = useState(null);
  const [modalVisible, setModal]      = useState(false);
  const [pinMode, setPinMode]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  // Guarda o pinLocation aqui no App para não perder ao trocar de tela
  const [pinLocation, setPinLocation] = useState(null);

  const pinCallbackRef = useRef(null);
  const mapRef         = useRef(null);

  const { location, region, setRegion, loading: locationLoading } = useLocation();
  const { reports, loading: reportsLoading, error, addReport, updateStatus, refetch } = useReports();

  function navigate(target) { setScreen(target); }
  function openReport(report) { setSelected(report); setModal(true); }

  // Clique numa denúncia da lista → vai ao mapa, foca o local, abre modal
  function handleSelectReportFromList(report) {
    setScreen('map');
    setTimeout(() => {
      if (report.coordinate && mapRef.current) {
        mapRef.current.focusReport(
          report.coordinate.latitude,
          report.coordinate.longitude
        );
      }
      openReport(report);
    }, 350);
  }

  // Usuário quer marcar local no mapa → vai para o mapa em modo pin
  function handlePickLocation(callback) {
    pinCallbackRef.current = callback;
    setPinMode(true);
    setScreen('map');
  }

  // Usuário tocou no mapa em modo pin → salva coordenada e volta ao formulário
  function handleMapPress(e) {
    if (pinMode && pinCallbackRef.current) {
      const coord = e.nativeEvent.coordinate;
      pinCallbackRef.current(coord);
      setPinLocation(coord);      // salva no App para não perder
      pinCallbackRef.current = null;
      setPinMode(false);
      setScreen('report');        // volta ao formulário
    }
  }

  async function handleSubmit(data) {
    setSubmitting(true);
    const result = await addReport(data);
    setSubmitting(false);
    if (result) {
      setPinLocation(null);       // limpa para próxima denúncia
      setScreen('map');
      Alert.alert('✓ Denúncia enviada!', 'Seu registro foi salvo com sucesso.');
    }
  }

  if (locationLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Obtendo localização...</Text>
      </View>
    );
  }

  if (error && reports.length === 0) {
    return (
      <View style={styles.loading}>
        <Ionicons name="cloud-offline-outline" size={52} color={COLORS.gray400} />
        <Text style={styles.errorTitle}>Sem conexão</Text>
        <Text style={styles.errorSub}>Não foi possível carregar os dados.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header screen={screen} onNavigate={navigate} />

      {submitting && (
        <View style={styles.submitOverlay}>
          <View style={styles.submitBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.submitText}>Salvando denúncia...</Text>
          </View>
        </View>
      )}

      {screen === 'map' && (
        <MapScreen
          ref={mapRef}
          region={region}
          setRegion={setRegion}
          location={location}
          reports={reports}
          pinPlacementMode={pinMode}
          setPinPlacementMode={setPinMode}
          onMapPress={handleMapPress}
          onMarkerPress={openReport}
          onAddPress={() => navigate('report')}
        />
      )}

      {screen === 'report' && (
        <ReportScreen
          location={location}
          initialPinLocation={pinLocation}   // passa o local já escolhido no mapa
          reports={reports}
          onSubmit={handleSubmit}
          onPickLocation={handlePickLocation}
          onOpenReport={(r) => { openReport(r); }}
        />
      )}

      {screen === 'list' && (
        <ListScreen
          reports={reports}
          loading={reportsLoading}
          onSelectReport={handleSelectReportFromList}
          onRefresh={refetch}
        />
      )}

      <ReportDetailModal
        report={selectedReport}
        visible={modalVisible}
        onClose={() => setModal(false)}
        onStatusChange={(id, status) => {
          updateStatus(id, status);
          setSelected((prev) => prev ? { ...prev, status } : prev);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.white },
  loading:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, padding: 32 },
  loadingText: { marginTop: 14, fontSize: 15, color: COLORS.gray600 },
  errorTitle:  { fontSize: 18, fontWeight: '600', color: COLORS.gray900, marginTop: 16 },
  errorSub:    { fontSize: 14, color: COLORS.gray500, marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 24, backgroundColor: COLORS.primary,
    borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12,
  },
  retryText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  submitOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', zIndex: 999,
  },
  submitBox: {
    backgroundColor: '#FFF', borderRadius: 14,
    padding: 28, alignItems: 'center', gap: 14,
  },
  submitText: { fontSize: 15, color: COLORS.gray700, fontWeight: '500' },
});
