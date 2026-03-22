// Экран просмотра профиля другого пользователя
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { userAPI } from '../services/api';
import { getBaseUrl } from '../services/api';
import { useTheme } from '../store/ThemeContext';

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { userId } = route.params;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUserById(userId);
      setUser(response.data.user);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    if (!user?.avatar_url) return null;
    return user.avatar_url.startsWith('http') 
      ? user.avatar_url 
      : `${getBaseUrl()}${user.avatar_url}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          Не удалось загрузить профиль
        </Text>
      </View>
    );
  }

  const avatarUrl = getAvatarUrl();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {user.username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        
        <Text style={[styles.username, { color: theme.colors.text }]}>
          {user.username}
        </Text>
        
        {user.status && (
          <Text style={[styles.status, { color: theme.colors.secondaryText }]}>
            {user.status}
          </Text>
        )}
      </View>

      <View style={[styles.infoSection, { backgroundColor: theme.colors.card }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.secondaryText }]}>Email</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user.email}</Text>
        </View>
        
        {user.phone && (
          <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.infoLabel, { color: theme.colors.secondaryText }]}>Телефон</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>{user.phone}</Text>
          </View>
        )}
        
        <View style={[styles.infoRow, styles.infoRowBorder, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.infoLabel, { color: theme.colors.secondaryText }]}>Зарегистрирован</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>
            {new Date(user.created_at).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 40
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF'
  },
  avatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '600'
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8
  },
  status: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 16
  },
  infoRow: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  infoLabel: {
    fontSize: 16,
    color: '#666'
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000'
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50
  }
});
