import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { navigationRef, reset } from './src/utils/navigationRef';
import HomeScreen from './src/screens/HomeScreen';
import BooksScreen from './src/screens/BooksScreen';
import UsersScreen from './src/screens/UsersScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Navigate to Login when user logs out
    if (!isLoading && !isAuthenticated && navigationRef.isReady()) {
      console.log('App: User logged out, resetting navigation...');
      try {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        console.log('App: Navigation reset successful');
      } catch (error) {
        console.error('App: Navigation reset error:', error);
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return null; // หรือแสดง loading screen
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={() => {
      // Navigation is ready, can now use navigationRef
    }}>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Home' : 'Login'}
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
          name="Login"
          component={LoginScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ 
            title: 'ระบบยืม-คืนหนังสือ',
            headerShown: false,
            gestureEnabled: false,
          }}
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

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
