import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const IndexScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Witaj!</Text>
      <Button title="Zaloguj się" onPress={() => router.push('/login')} />
      <Button title="Zarejestruj się" onPress={() => router.push('/registration')}  />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  buttonSpacing: { marginTop: 10 },
});

export default IndexScreen;
