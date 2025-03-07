import React, { useEffect, useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import config from './config';
import api from '../services/api';

const EditListScreen = () => {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const [listName, setListName] = useState<string>('');
  const [items, setItems] = useState<{ id: string; name: string; checked: number; isNew: boolean }[]>([]);
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
        const response = await api.get(`/list-details/${listId}`);
        if (response.status === 200) {
          setListName(response.data.name);
          setItems(response.data.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            checked: item.checked || 0,
            isNew: false,
          })));
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

  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString(),
      name: '',
      checked: 0,
      isNew: true,
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

  const handleSaveList = async () => {
    if (!listName.trim()) {
      Alert.alert('Błąd', 'Proszę podać nazwę listy.');
      return;
    }

    if (items.some((item) => item.name.trim() === '')) {
      Alert.alert('Błąd', 'Wszystkie elementy muszą mieć nazwę.');
      return;
    }

    setLoading(true);

    const existingItems = items.filter((item) => !item.isNew);
    const newItems = items.filter((item) => item.isNew);

    try {
      const response = await api.put(`/edit-list/${listId}`, {
        name: listName,
        existing_items: existingItems.map((item) => ({
          id: item.id,
          name: item.name,
          checked: item.checked,
        })),
        new_items: newItems.map((item) => ({
          name: item.name,
          checked: item.checked,
        })),
      });

      if (response.status === 200) {
        Alert.alert('Sukces', 'Lista została zaktualizowana.');
        router.back();
      } else {
        Alert.alert('Błąd', 'Nie udało się zaktualizować listy.');
      }
    } catch (error) {
      console.error('Błąd:', error);
      Alert.alert('Błąd', 'Wystąpił problem podczas aktualizacji listy.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadList = async () => {
    try {
      const jsonData = {
        name: listName,
        items: items.map(({ id, ...rest }) => rest),
      };

      const fileUri = `${FileSystem.documentDirectory}${listName || 'lista'}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(jsonData, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Gotowe', `Plik został zapisany w: ${fileUri}`);
      }
    } catch (error) {
      console.error('Błąd podczas pobierania listy:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać listy.');
    }
  };

  const handleDeleteList = async () => {
    Alert.alert('Potwierdzenie', 'Czy na pewno chcesz usunąć tę listę?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.delete(`/edit-list/${listId}`);

            if (response.status === 200) {
              Alert.alert('Sukces', 'Lista została usunięta.');
              router.dismissTo('/ViewListsScreen');
            } else {
              Alert.alert('Błąd', 'Nie udało się usunąć listy.');
            }
          } catch (error) {
            console.error('Błąd:', error);
            Alert.alert('Błąd', 'Wystąpił problem podczas usuwania listy.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: { id: string; name: string; checked: number } }) => (
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Wczytywanie...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        ListFooterComponent={
          <>
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSaveList}>
              <Text style={styles.submitButtonText}>Zapisz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadList}>
              <Text style={styles.downloadButtonText}>Pobierz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteList}>
              <Text style={styles.deleteButtonText}>Usuń listę</Text>
            </TouchableOpacity>
          </>
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
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
  listItemInput: { flex: 1, marginRight: 10, fontSize: 16 },
  addButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: { color: 'white', fontSize: 16 },
  downloadButton: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  downloadButtonText: { color: 'white', fontSize: 16 },
  deleteButton: { backgroundColor: 'red', padding: 15, borderRadius: 5, alignItems: 'center' },
  deleteButtonText: { color: 'white', fontSize: 16 },
});

export default EditListScreen;
