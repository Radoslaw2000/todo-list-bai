import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import config from './config';

const ListDetailsScreen = () => {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const [listDetails, setListDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchListDetails = async () => {
      if (!listId) return;

      try {
        const response = await fetch(`${config.apiUrl}/list-details/${listId}`);
        if (response.ok) {
          const data = await response.json();
          setListDetails(data);
        } else {
          console.error('Błąd odpowiedzi API:', response.statusText);
          Alert.alert('Błąd', 'Nie udało się pobrać szczegółów listy');
        }
      } catch (error) {
        console.error('Błąd podczas pobierania szczegółów listy:', error);
        Alert.alert('Błąd', 'Wystąpił problem podczas pobierania szczegółów listy');
      } finally {
        setLoading(false);
      }
    };

    fetchListDetails();
  }, [listId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Do zrobienia jeszcze</Text>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!listDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Nie znaleziono szczegółów listy</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{listDetails.name}</Text>
      <Text style={styles.description}>{listDetails.description}</Text>
      {/* Renderuj inne dane w zależności od API */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
});

export default ListDetailsScreen;
