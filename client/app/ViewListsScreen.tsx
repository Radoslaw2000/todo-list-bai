import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import config from './config';

const ViewListsScreen: React.FC = () => {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${config.apiUrl}/lists`);
        const data = await response.json();
        if (response.ok) {
          setLists(data.lists);  // Zakładając, że backend zwraca listy w tym formacie
        } else {
          Alert.alert('Błąd', 'Nie udało się pobrać list');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Błąd', 'Coś poszło nie tak');
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Przeglądaj listy</Text>
      {loading ? (
        <Text>Ładowanie...</Text>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <Text>{item.name}</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
});

export default ViewListsScreen;
