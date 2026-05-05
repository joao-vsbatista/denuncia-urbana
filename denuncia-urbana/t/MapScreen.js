import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  View, TouchableOpacity, ScrollView,
  Text, StyleSheet, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, getCategoryById } from './categories';
import { COLORS, RADIUS } from './theme';

// HTML base do mapa — carregado UMA VEZ, sem markers embutidos
// Os markers são enviados depois via injectJavaScript
const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map;
    var markerObjects = [];
    var highlightMarker = null;

    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -23.55, lng: -46.63 },
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
      });

      map.addListener('click', function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'mapPress',
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        }));
      });

      map.addListener('idle', function() {
        var c = map.getCenter();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'regionChange',
          lat: c.lat(),
          lng: c.lng(),
        }));
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    }

    // Chamado pelo RN para atualizar todos os markers
    window.setMarkers = function(reports) {
      // Remove markers antigos
      markerObjects.forEach(function(m) { m.setMap(null); });
      markerObjects = [];

      reports.forEach(function(r) {
        var marker = new google.maps.Marker({
          position: { lat: r.lat, lng: r.lng },
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: r.color,
            fillOpacity: 1,
            strokeColor: '#FFF',
            strokeWeight: 2,
          },
          title: r.title,
        });
        marker.addListener('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: r.id }));
        });
        markerObjects.push(marker);
      });
    };

    // Centraliza no local do usuário
    window.goToLocation = function(lat, lng) {
      map.panTo({ lat: lat, lng: lng });
      map.setZoom(16);
    };

    // Centraliza e destaca uma denúncia específica
    window.focusReport = function(lat, lng) {
      map.panTo({ lat: lat, lng: lng });
      map.setZoom(17);

      if (highlightMarker) { highlightMarker.setMap(null); highlightMarker = null; }

      highlightMarker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 22,
          fillColor: '#FFFFFF',
          fillOpacity: 0.3,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        zIndex: 999,
      });

      setTimeout(function() {
        if (highlightMarker) { highlightMarker.setMap(null); highlightMarker = null; }
      }, 3000);
    };

    // Muda o cursor (modo pin)
    window.setCursor = function(crosshair) {
      document.body.style.cursor = crosshair ? 'crosshair' : 'grab';
    };

    // Move o centro do mapa
    window.setCenter = function(lat, lng, zoom) {
      map.panTo({ lat: lat, lng: lng });
      if (zoom) map.setZoom(zoom);
    };
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?callback=initMap" async defer></script>
</body>
</html>
`;

const MapScreen = forwardRef(function MapScreen({
  region, setRegion, location, reports,
  pinPlacementMode, setPinPlacementMode,
  onMapPress, onMarkerPress, onAddPress,
}, ref) {
  const webRef   = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Envia markers ao WebView sempre que reports mudar e o mapa estiver pronto
  const sendMarkers = useCallback((reps) => {
    if (!webRef.current || !mapReady) return;
    const payload = reps.map((r) => ({
      id:    r.id,
      lat:   r.coordinate.latitude,
      lng:   r.coordinate.longitude,
      color: getCategoryById(r.category).color,
      title: r.title || '',
    }));
    webRef.current.injectJavaScript(
      `window.setMarkers(${JSON.stringify(payload)}); true;`
    );
  }, [mapReady]);

  // Reenvia markers toda vez que mudam
  useEffect(() => {
    if (mapReady) sendMarkers(reports);
  }, [reports, mapReady, sendMarkers]);

  // Atualiza cursor ao mudar modo pin
  useEffect(() => {
    if (mapReady && webRef.current) {
      webRef.current.injectJavaScript(`window.setCursor(${pinPlacementMode}); true;`);
    }
  }, [pinPlacementMode, mapReady]);

  // Centraliza o mapa ao receber nova region (só na primeira vez)
  useEffect(() => {
    if (mapReady && webRef.current && region) {
      webRef.current.injectJavaScript(
        `window.setCenter(${region.latitude}, ${region.longitude}); true;`
      );
    }
  }, [mapReady]); // só na montagem

  useImperativeHandle(ref, () => ({
    focusReport(lat, lng) {
      if (webRef.current && mapReady) {
        webRef.current.injectJavaScript(`window.focusReport(${lat}, ${lng}); true;`);
      }
    },
  }));

  function goToMyLocation() {
    if (location && webRef.current && mapReady) {
      webRef.current.injectJavaScript(
        `window.goToLocation(${location.latitude}, ${location.longitude}); true;`
      );
    }
  }

  function handleMessage(e) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);

      if (msg.type === 'mapReady') {
        setMapReady(true);
      }

      if (msg.type === 'mapPress') {
        onMapPress({ nativeEvent: { coordinate: { latitude: msg.lat, longitude: msg.lng } } });
      }

      if (msg.type === 'markerPress') {
        const report = reports.find((r) => r.id === msg.id);
        if (report) onMarkerPress(report);
      }

      if (msg.type === 'regionChange') {
        setRegion((prev) => ({ ...prev, latitude: msg.lat, longitude: msg.lng }));
      }
    } catch (_) {}
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        style={styles.map}
        source={{ html: MAP_HTML }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
      />

      {!mapReady && (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {pinPlacementMode && (
        <View style={styles.pinBanner}>
          <Ionicons name="location-outline" size={18} color="#FFF" />
          <Text style={styles.pinBannerText}>Toque no mapa para marcar o local</Text>
          <TouchableOpacity onPress={() => setPinPlacementMode(false)}>
            <Text style={styles.pinBannerCancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {reports.length > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {reports.length} denúncia{reports.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.myLocBtn} onPress={goToMyLocation}>
        <Ionicons name="locate" size={22} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.legend}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
              <Text style={styles.legendLabel}>{cat.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.fab} onPress={onAddPress} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
});

export default MapScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E4',
  },
  pinBanner: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2C2C2A', borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pinBannerText: { color: '#FFF', fontSize: 13, flex: 1 },
  pinBannerCancel: { color: COLORS.warning, fontWeight: '600', fontSize: 13 },
  countBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  countText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  myLocBtn: {
    position: 'absolute', top: 56, right: 12,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  legend: {
    position: 'absolute', bottom: 86, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingVertical: 8, paddingHorizontal: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14 },
  legendDot: { width: 9, height: 9, borderRadius: 5, marginRight: 5 },
  legendLabel: { fontSize: 12, color: '#444441' },
  fab: {
    position: 'absolute', bottom: 22, right: 18,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
});
