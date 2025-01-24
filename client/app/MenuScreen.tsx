import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const MenuScreen = () => {
  const router = useRouter();

  const handleManageAccount = () => {
    router.push('/ManageAccountScreen');
  };

  const handleAddList = () => {
    router.push('/AddListScreen');
  };

  const handleViewLists = () => {
    router.push('/ViewListsScreen');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
      <Button title="Zarządzaj kontem" onPress={handleManageAccount} />
      <Button title="Dodaj listę" onPress={handleAddList} />
      <Button title="Przeglądaj listy" onPress={handleViewLists} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
});

export default MenuScreen;
