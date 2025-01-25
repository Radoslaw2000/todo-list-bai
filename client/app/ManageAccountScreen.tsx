import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import config from './config';

const ManageAccountScreen: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleChangePassword = async () => {
    if (!newPassword) {
      Alert.alert('Błąd', 'Proszę wprowadzić nowe hasło');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Sukces', data.message);
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
      <Text style={styles.title}>Zarządzaj kontem</Text>
      <TextInput
        style={styles.input}
        placeholder="Nowe hasło"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <Button title={loading ? 'Zmiana hasła...' : 'Zmień hasło'} onPress={handleChangePassword} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});

export default ManageAccountScreen;
