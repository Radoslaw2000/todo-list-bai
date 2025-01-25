import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import config from './config';

const ViewListsScreen = () => {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
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
            <Text style={styles.listText}>{item.name}</Text>
            <Text style={styles.listText}>{item.id}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  listItem: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 5,
  },
  listText: { fontSize: 18 },
});

export default ViewListsScreen;
