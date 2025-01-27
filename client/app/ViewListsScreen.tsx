import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import config from './config';
import { useFocusEffect } from '@react-navigation/native';

const ViewListsScreen = () => {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      const fetchLists = async () => {
        setLoading(true);
        try {
          const username = await SecureStore.getItemAsync('username');
          if (!username) {
            Alert.alert('Błąd', 'Nie jesteś zalogowany.');
            router.push('/login');
            return;
          }

          const response = await fetch(`${config.apiUrl}/user-lists/${username}`);
          if (response.ok) {
            const data = await response.json();
            setLists(data.lists || []);
          } else {
            Alert.alert('Błąd', 'Nie udało się pobrać list.');
          }
        } catch (error) {
          console.error('Błąd podczas pobierania list:', error);
          Alert.alert('Błąd', 'Coś poszło nie tak.');
        } finally {
          setLoading(false);
        }
      };

      fetchLists();
    }, []) // Zmienna zależna - pusta tablica powoduje wywołanie przy każdym wejściu na ekran
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Twoje listy</Text>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() =>
              router.push({
                pathname: '/ListDetailsScreen',
                params: { listId: item.id },
              })
            }
          >
            <View style={styles.itemContent}>
              <Ionicons name="list" size={24} color="#ffffff" />
              <Text style={styles.listText}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Brak list. Dodaj nową, aby zacząć!
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20, 
    color: '#4caf50' 
  },
  listItem: {
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#4caf50',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listText: { 
    fontSize: 18, 
    color: '#ffffff', 
    marginLeft: 10, 
    fontWeight: '600' 
  },
  emptyText: { 
    textAlign: 'center', 
    fontSize: 16, 
    color: '#888', 
    marginTop: 50 
  },
});

export default ViewListsScreen;
