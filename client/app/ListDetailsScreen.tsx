import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TodoItem from '../components/TodoItem';
import config from './config';

const ListDetailsScreen = () => {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const [listDetails, setListDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchListDetails = async () => {
      if (!listId) {
        Alert.alert('Błąd', 'Nie przekazano listId');
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`${config.apiUrl}/list-details/${listId}`);
        if (response.ok) {
          const data = await response.json();
          setListDetails(data);
        } else {
          Alert.alert('Błąd', 'Nie udało się pobrać szczegółów listy.');
        }
      } catch (error) {
        console.error('Błąd:', error);
        Alert.alert('Błąd', 'Wystąpił problem podczas pobierania danych.');
      } finally {
        setLoading(false);
      }
    };

    fetchListDetails();
  }, [listId]);

  const toggleItemChecked = async (itemId: number, checked: boolean) => {
    try {
      const response = await fetch(`${config.apiUrl}/update-item-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, checked }),
      });

      if (response.ok) {
        setListDetails((prev: any) => ({
          ...prev,
          items: prev.items.map((item: any) =>
            item.id === itemId ? { ...item, checked } : item
          ),
        }));
      } else {
        Alert.alert('Błąd', 'Nie udało się zaktualizować statusu elementu.');
      }
    } catch (error) {
      console.error('Błąd podczas aktualizacji elementu:', error);
      Alert.alert('Błąd', 'Wystąpił problem podczas aktualizacji elementu.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
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
      <FlatList
        data={listDetails.items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TodoItem
            id={item.id}
            name={item.name}
            checked={item.checked}
            onToggle={toggleItemChecked}
          />
        )}
        ListEmptyComponent={listDetails.items.length === 0 ? <Text style={styles.emptyText}>Lista nie zawiera żadnych elementów.</Text> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  errorText: { fontSize: 18, color: 'red', textAlign: 'center' },
  emptyText: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 10 },
});

export default ListDetailsScreen;
