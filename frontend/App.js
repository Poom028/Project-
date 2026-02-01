import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import BooksScreen from './src/screens/BooksScreen';
import UsersScreen from './src/screens/UsersScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigationRef = useRef(null);
  const prevAuthRef = useRef(isAuthenticated);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    // Only navigate if auth state changed from true to false (logout)
    if (
      !isLoading && 
      navigationRef.current && 
      prevAuthRef.current === true && 
      isAuthenticated === false &&
      !isNavigatingRef.current
    ) {
      // User just logged out
      isNavigatingRef.current = true;
      setTimeout(() => {
        try {
          if (navigationRef.current) {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        } catch (error) {
          console.error('Navigation error:', error);
          try {
            if (navigationRef.current) {
              navigationRef.current.replace('Login');
            }
          } catch (e2) {
            console.error('Replace also failed:', e2);
          }
        } finally {
          isNavigatingRef.current = false;
        }
      }, 50);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return null; // หรือแสดง loading screen
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
