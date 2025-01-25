import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import config from './config';

const AddListScreen = () => {
  const [listName, setListName] = useState<string>('');
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
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
    const newItem = {
      id: Math.random().toString(),
      name: '',
    };
    setItems((prevItems) => [...prevItems, newItem]);
  };

  const handleEditItem = (id: string, name: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, name } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleAddList = async () => {
    if (!listName.trim()) {
      Alert.alert('Błąd', 'Proszę podać nazwę listy.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Błąd', 'Lista musi zawierać przynajmniej jeden element.');
      return;
    }

    if (!username) {
      Alert.alert('Błąd', 'Nie udało się pobrać nazwy użytkownika.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/add-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: listName,
          items: items.map((item) => item.name),
          username,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sukces', data.message);
        router.back();;
      } else {
        Alert.alert('Błąd', data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Błąd', 'Coś poszło nie tak.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: { id: string; name: string } }) => (
    <View style={styles.listItem}>
      <TextInput
        style={styles.listItemInput}
        placeholder="Nazwa elementu"
        value={item.name}
        onChangeText={(text) => handleEditItem(item.id, text)}
      />
      <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
        <Ionicons name="trash" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Dodaj nową listę</Text>
      <TextInput
        style={styles.input}
        placeholder="Nazwa listy"
        value={listName}
        onChangeText={setListName}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Brak elementów na liście</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <TouchableOpacity style={styles.addButtonInList} onPress={handleAddItem}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleAddList}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Dodawanie...' : 'Dodaj listę'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  listItemInput: { flex: 1, fontSize: 16, marginRight: 10 },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#888' },
  addButtonInList: {
    padding: 15,
    backgroundColor: '#4caf50',
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  disabledButton: { backgroundColor: '#aaa' },
  submitButtonText: { color: 'white', textAlign: 'center', fontSize: 16 },
});

export default AddListScreen;
