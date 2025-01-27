import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

const LocationWeather = () => {
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const apiKey = '7ea1630a7b6be9ca3350d5dacd30ed40';

  const getWeather = async (lat: number, lon: number) => {
    try {
      setIsLoading(true);
  
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      
      const data = await response.json();
  
      if (data && data.main && data.main.temp) {
        setWeather(data);
      } else {
        Alert.alert('Błąd', 'Nie udało się uzyskać danych o pogodzie.');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się pobrać pogody.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getLocationAndWeather = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setHasPermission(true);
      const { coords } = await Location.getCurrentPositionAsync({});
      setCoords(coords);

      if (coords) {
        getWeather(coords.latitude, coords.longitude);
      }
    } else {
      setHasPermission(false);
      Alert.alert('Błąd', 'Brak dostępu do lokalizacji.');
    }
  };

  useEffect(() => {
    getLocationAndWeather();
  }, []);

  if (!hasPermission || isLoading) {
    return (
      <View style={styles.container}>
        <Text>Ładowanie pogody...</Text>
      </View>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.cityName}>{weather.name}</Text>
      
      <Text style={styles.temperature}>
        {Math.round(weather.main.temp)}°C
      </Text>
      <Text style={styles.description}>
        {weather.weather[0].description}
      </Text>
      <Text style={styles.humidity}>
        Wilgotność: {weather.main.humidity}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  cityName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff5722',
  },
  description: {
    fontSize: 18,
    color: '#555',
  },
  humidity: {
    fontSize: 16,
    color: '#777',
  },
});

export default LocationWeather;
