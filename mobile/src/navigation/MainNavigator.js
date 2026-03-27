// Главный навигатор приложения с вкладками
import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../store/ThemeContext';

import ChatsListScreen from '../screens/ChatsListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateChatScreen from '../screens/CreateChatScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupManageScreen from '../screens/GroupManageScreen';
import SearchScreen from '../screens/SearchScreen';
import ChatInfoScreen from '../screens/ChatInfoScreen';
import ChatThemeScreen from '../screens/ChatThemeScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек для чатов
function ChatsStack() {
  const { theme } = useTheme();
  const isDark = theme.name === 'dark';
  const headerBg = isDark ? '#1a1a1a' : '#ffffff';
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: headerBg
        },
        headerTintColor: theme.colors.text
      }}
    >
      <Stack.Screen
        name="ChatsList"
        component={ChatsListScreen}
        options={{ title: 'Чаты' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params?.chatName || 'Чат' })}
      />
      <Stack.Screen
        name="CreateChat"
        component={CreateChatScreen}
        options={{ title: 'Новый чат' }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Новая группа' }}
      />
      <Stack.Screen
        name="GroupManage"
        component={GroupManageScreen}
        options={{ title: 'Управление группой' }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Поиск' }}
      />
      <Stack.Screen
        name="ChatInfo"
        component={ChatInfoScreen}
        options={({ route }) => ({ title: route.params?.chatName || 'Информация' })}
      />
      <Stack.Screen
        name="ChatTheme"
        component={ChatThemeScreen}
        options={{ title: 'Тема чата' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({ title: route.params?.userName || 'Профиль' })}
      />
    </Stack.Navigator>
  );
}

// Стек для профиля
function ProfileStack() {
  const { theme } = useTheme();
  const isDark = theme.name === 'dark';
  const headerBg = isDark ? '#1a1a1a' : '#ffffff';
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: headerBg
        },
        headerTintColor: theme.colors.text
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Stack.Navigator>
  );
}

// Главный таб навигатор
export default function MainNavigator() {
  const { theme } = useTheme();
  const isDark = theme.name === 'dark';
  const tabBarBg = isDark ? '#1a1a1a' : '#ffffff';
  
  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#e0e0e0'
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondaryText
      }}
    >
      <Tab.Screen
        name="Chats"
        component={ChatsStack}
        options={{ 
          tabBarLabel: 'Чаты',
          tabBarIcon: ({ color, size }) => (
            <Image 
              source={require('../../assets/icons/chats-tab.png')} 
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          )
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ 
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <Image 
              source={require('../../assets/icons/profile-tab.png')} 
              style={{ width: size, height: size, tintColor: color }}
              resizeMode="contain"
            />
          )
        }}
      />
    </Tab.Navigator>
  );
}
