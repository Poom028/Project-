import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { usersAPI } from '../services/api';
import { createShadow } from '../utils/shadowStyles';

export default function UsersScreen() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [createdUser, setCreatedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!formData.username || !formData.email) {
      Alert.alert('Error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      const user = await usersAPI.create({
        username: formData.username,
        email: formData.email,
      });
      Alert.alert('Success', 'สร้างผู้ใช้สำเร็จ');
      setCreatedUser(user);
      setFormData({ username: '', email: '' });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'ไม่สามารถสร้างผู้ใช้ได้');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>จัดการผู้ใช้</Text>
          <Text style={styles.headerSubtitle}>สร้างและจัดการบัญชีผู้ใช้</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formIcon}>👤</Text>
            <Text style={styles.sectionTitle}>สร้างผู้ใช้ใหม่</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ชื่อผู้ใช้</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกชื่อผู้ใช้"
              placeholderTextColor="#9CA3AF"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>อีเมล</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกอีเมล"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleCreateUser}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>สร้างผู้ใช้</Text>
                <Text style={styles.buttonIcon}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {createdUser && (
          <View style={styles.userCard}>
            <View style={styles.userCardHeader}>
              <Text style={styles.userCardIcon}>✅</Text>
              <Text style={styles.userCardTitle}>ผู้ใช้ที่สร้างล่าสุด</Text>
            </View>
            <View style={styles.userInfoContainer}>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>ID:</Text>
                <Text style={styles.userInfoValue}>{createdUser.id}</Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Username:</Text>
                <Text style={styles.userInfoValue}>{createdUser.username}</Text>
              </View>
              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Email:</Text>
                <Text style={styles.userInfoValue}>{createdUser.email}</Text>
              </View>
            </View>
          </View>
        )}
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
    backgroundColor: '#10B981',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.08, radius: 12 }),
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  formIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...createShadow({ color: '#10B981', offsetY: 4, opacity: 0.3, radius: 8 }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.08, radius: 12 }),
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userCardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  userCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userInfoContainer: {
    gap: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 80,
  },
  userInfoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
});
