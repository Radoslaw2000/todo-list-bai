import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import config from './config';

const AddListScreen = () => {
  const [listName, setListName] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsername = async () => {
      const storedUsername = await SecureStore.getItemAsync('username');
      setUsername(storedUsername);
    };

    fetchUsername();
  }, []);

  const handleAddItem = () => {
    if (itemName.trim() === '') {
      Alert.alert('Błąd', 'Proszę podać nazwę elementu');
      return;
    }
    setItems([...items, itemName]);
    setItemName('');
  };

  const handleAddList = async () => {
    if (!listName || items.length === 0) {
      Alert.alert('Błąd', 'Proszę podać nazwę listy oraz dodać elementy');
      return;
    }

    if (!username) {
      Alert.alert('Błąd', 'Nie udało się pobrać nazwy użytkownika');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/add-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: listName, items, username }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sukces', data.message);
        router.push('/MenuScreen'); // Po dodaniu listy wracamy do menu
      } else {
        Alert.alert('Błąd', data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Błąd', 'Coś poszło nie tak');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dodaj nową listę</Text>
      <TextInput
        style={styles.input}
        placeholder="Nazwa listy"
        value={listName}
        onChangeText={setListName}
      />
      <TextInput
        style={styles.input}
        placeholder="Nazwa elementu"
        value={itemName}
        onChangeText={setItemName}
      />
      <Button title="Dodaj element" onPress={handleAddItem} />
      <FlatList
        data={items}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
      <Button title={loading ? 'Dodawanie listy...' : 'Dodaj listę'} onPress={handleAddList} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});

export default AddListScreen;
