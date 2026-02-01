import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const userInfo = await authAPI.getMe();
        setUser(userInfo);
        setIsAuthenticated(true);
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await authAPI.login(username, password);
    await AsyncStorage.setItem('token', response.access_token);
    const userInfo = await authAPI.getMe();
    await AsyncStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    setIsAuthenticated(true);
    return response;
  };

  const logout = async () => {
    console.log('=== AUTHCONTEXT LOGOUT START ===');
    try {
      console.log('AuthContext: Removing tokens from storage...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      console.log('AuthContext: Tokens removed successfully');
    } catch (error) {
      console.error('AuthContext: Error removing storage:', error);
    }
    console.log('AuthContext: Setting isAuthenticated to false');
    setIsAuthenticated(false);
    setUser(null);
    console.log('AuthContext: State updated - isAuthenticated = false');
    console.log('=== AUTHCONTEXT LOGOUT END ===');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
