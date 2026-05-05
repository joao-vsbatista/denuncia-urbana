import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

const DEFAULT_REGION = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocation();
  }, []);

  async function fetchLocation() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Ative a localização para usar o app.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);
      setRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível obter a localização.');
    }
    setLoading(false);
  }

  return { location, region, setRegion, loading };
}
