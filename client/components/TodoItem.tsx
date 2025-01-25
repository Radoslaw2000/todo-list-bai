import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CheckBox from 'expo-checkbox';

interface TodoItemProps {
  id: number;
  name: string;
  checked: boolean;
  onToggle: (id: number, checked: boolean) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ id, name, checked, onToggle }) => {
  const handleToggle = () => {
    onToggle(id, !checked);
  };

  const isChecked = Boolean(checked);

  return (
    <View style={styles.container}>
      <CheckBox
        value={isChecked}
        onValueChange={handleToggle}
        color={isChecked ? '#4caf50' : undefined}
      />
      <Text style={styles.text}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  text: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    flexShrink: 1,
  },
});

export default TodoItem;
