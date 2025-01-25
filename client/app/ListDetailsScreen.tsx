import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TodoItem from '../components/TodoItem';
import { Ionicons } from '@expo/vector-icons';
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

  const navigateToEditList = () => {
    router.push({
      pathname: '/EditListScreen',
      params: { listId: listId },
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
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
      <View style={styles.header}>
        <Text style={styles.title}>{listDetails.name}</Text>
        <TouchableOpacity onPress={navigateToEditList}>
          <Ionicons name="pencil" size={24} color="#4caf50" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={listDetails.items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <TodoItem
              id={item.id}
              name={item.name}
              checked={item.checked}
              onToggle={toggleItemChecked}
            />
          </View>
        )}
        ListEmptyComponent={
          listDetails.items.length === 0 ? (
            <Text style={styles.emptyText}>
              Lista nie zawiera żadnych elementów.
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 10,
  },
  listItem: {
    marginVertical: 5,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default ListDetailsScreen;
