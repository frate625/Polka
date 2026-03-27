// Главный навигатор приложения с вкладками
import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import ChatsListScreen from '../screens/ChatsListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateChatScreen from '../screens/CreateChatScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupManageScreen from '../screens/GroupManageScreen';
import SearchScreen from '../screens/SearchScreen';
import ChatInfoScreen from '../screens/ChatInfoScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек для чатов
function ChatsStack() {
  return (
    <Stack.Navigator>
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
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({ title: route.params?.userName || 'Профиль' })}
      />
    </Stack.Navigator>
  );
}

// Стек для профиля
function ProfileStack() {
  return (
    <Stack.Navigator>
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
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
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
