import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import config from './config';

const ViewListsScreen = () => {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUsername = await SecureStore.getItemAsync('username');
        if (storedUsername) {
          setUsername(storedUsername);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Błąd podczas ładowania danych użytkownika:', error);
        Alert.alert('Błąd', 'Nie udało się załadować danych użytkownika');
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const fetchLists = async () => {
      if (!username) return;

      try {
        const response = await fetch(`${config.apiUrl}/user-lists/${username}`);
        if (response.ok) {
          const data = await response.json();
          setLists(data.lists || []);
        } else {
          console.error('Błąd odpowiedzi API:', response.statusText);
          Alert.alert('Błąd', 'Nie udało się pobrać list użytkownika');
        }
      } catch (error) {
        console.error('Błąd podczas pobierania list:', error);
        Alert.alert('Błąd', 'Wystąpił problem podczas pobierania list');
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, [username]);

  const handleListPress = (listId: number) => {
    router.setParams({ listId }); // Ustawia parametry w adresie
    router.push(`/ListDetailsScreen`); // Przekierowuje na ekran ListDetails
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Twoje listy</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : lists.length > 0 ? (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItemContainer}
              onPress={() => handleListPress(item.id)} // Przekazanie ID listy
            >
              <Text style={styles.listItem}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.noListsText}>Nie znaleziono żadnych list</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  listItemContainer: {
    marginBottom: 10,
  },
  listItem: {
    fontSize: 18,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    textAlign: 'center',
  },
  noListsText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'gray',
    marginTop: 20,
  },
});

export default ViewListsScreen;
