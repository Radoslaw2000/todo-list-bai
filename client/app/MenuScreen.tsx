import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import LocationWeather from '../components/LocationWeather';

const MenuScreen = () => {
  const router = useRouter();

  const handleAddList = () => {
    router.push('/AddListScreen');
  };

  const handleViewLists = () => {
    router.push('/ViewListsScreen');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>

      <TouchableOpacity style={styles.button} onPress={handleAddList}>
        <Text style={styles.buttonText}>Dodaj listę</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleViewLists}>
        <Text style={styles.buttonText}>Przeglądaj listy</Text>
      </TouchableOpacity>

      <LocationWeather />

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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#2196f3',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default MenuScreen;
