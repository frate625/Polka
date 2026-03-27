import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageDateSeparator({ date }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Сбрасываем время для корректного сравнения дат
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Сегодня';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.dateText}>{formatDate(date)}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0'
  },
  dateText: {
    marginHorizontal: 15,
    fontSize: 13,
    color: '#666',
    fontWeight: '500'
  }
});
