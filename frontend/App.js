import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import BooksScreen from './src/screens/BooksScreen';
import UsersScreen from './src/screens/UsersScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'ระบบยืม-คืนหนังสือ' }}
        />
        <Stack.Screen
          name="Books"
          component={BooksScreen}
          options={{ title: 'จัดการหนังสือ' }}
        />
        <Stack.Screen
          name="Users"
          component={UsersScreen}
          options={{ title: 'จัดการผู้ใช้' }}
        />
        <Stack.Screen
          name="Transactions"
          component={TransactionsScreen}
          options={{ title: 'การยืม-คืน' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
