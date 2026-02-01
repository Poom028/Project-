import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { createShadow } from '../utils/shadowStyles';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    console.log('=== LOGOUT BUTTON CLICKED ===');
    
    // Show confirmation first
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบหรือไม่?',
      [
        { 
          text: 'ยกเลิก', 
          style: 'cancel',
          onPress: () => console.log('Logout cancelled')
        },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
      { cancelable: true }
    );
  };

  const performLogout = async () => {
    console.log('=== LOGOUT CONFIRMED - STARTING LOGOUT ===');
    try {
      console.log('Step 1: Calling logout() function...');
      
      // Logout first - this will update isAuthenticated to false
      await logout();
      console.log('Step 2: Logout function completed');
      
      // For web, reload the page to ensure clean state
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        console.log('Step 3: Web platform detected, reloading page in 100ms...');
        setTimeout(() => {
          console.log('Step 4: Executing window.location.reload()');
          window.location.reload();
        }, 100);
        return;
      }
      
      // For mobile, use navigation reset immediately
      console.log('Step 3: Mobile platform, navigating to Login in 200ms...');
      setTimeout(() => {
        try {
          console.log('Step 4: Attempting navigation.replace("Login")...');
          navigation.replace('Login');
          console.log('Step 5: Navigation replace successful');
        } catch (replaceError) {
          console.log('Step 4: Replace failed, trying reset...', replaceError);
          try {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            );
            console.log('Step 5: Navigation reset successful');
          } catch (resetError) {
            console.error('Step 5: All navigation methods failed:', resetError);
          }
        }
      }, 200);
    } catch (error) {
      console.error('=== LOGOUT ERROR ===', error);
      // Force reload/navigation even on error
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        console.log('Error: Force reloading page...');
        window.location.reload();
      } else {
        setTimeout(() => {
          try {
            navigation.replace('Login');
          } catch (navError) {
            console.error('Navigation error:', navError);
            try {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            } catch (resetError) {
              console.error('All navigation methods failed:', resetError);
            }
          }
        }, 200);
      }
    }
  };

  const menuItems = [
    {
      id: 'books',
      title: 'จัดการหนังสือ',
      icon: '📚',
      color: '#6366F1',
      gradient: ['#6366F1', '#8B5CF6'],
      onPress: () => navigation.navigate('Books'),
    },
    {
      id: 'users',
      title: 'จัดการผู้ใช้',
      icon: '👥',
      color: '#10B981',
      gradient: ['#10B981', '#059669'],
      onPress: () => navigation.navigate('Users'),
    },
    {
      id: 'transactions',
      title: 'การยืม-คืน',
      icon: '📖',
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706'],
      onPress: () => navigation.navigate('Transactions'),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>ยินดีต้อนรับ</Text>
          <Text style={styles.userName}>{user?.username || 'ผู้ใช้'}</Text>
          <Text style={styles.subtitle}>Library Management System</Text>
        </View>
        <View style={styles.headerDecoration} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statNumber}>-</Text>
          <Text style={styles.statLabel}>หนังสือทั้งหมด</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📖</Text>
          <Text style={styles.statNumber}>-</Text>
          <Text style={styles.statLabel}>การยืม-คืน</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>เมนูหลัก</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, { borderLeftColor: item.color }]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>{item.title}</Text>
              <Text style={styles.menuSubtext}>จัดการข้อมูล{item.title}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="ออกจากระบบ"
          testID="logout-button"
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#6366F1',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  headerContent: {
    zIndex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 5,
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 4, opacity: 0.1, radius: 8 }),
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  menuContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.08, radius: 8 }),
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 28,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuArrow: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  logoutContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#EF4444', offsetY: 4, opacity: 0.3, radius: 8 }),
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
