import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { usersAPI } from '../services/api';

export default function UsersScreen() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [createdUser, setCreatedUser] = useState(null);

  const handleCreateUser = async () => {
    if (!formData.username || !formData.email) {
      Alert.alert('Error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

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
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>จัดการผู้ใช้</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>สร้างผู้ใช้ใหม่</Text>

        <TextInput
          style={styles.input}
          placeholder="ชื่อผู้ใช้"
          value={formData.username}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="อีเมล"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleCreateUser}>
          <Text style={styles.submitButtonText}>สร้างผู้ใช้</Text>
        </TouchableOpacity>

        {createdUser && (
          <View style={styles.userCard}>
            <Text style={styles.userCardTitle}>ผู้ใช้ที่สร้างล่าสุด</Text>
            <Text style={styles.userInfo}>ID: {createdUser.id}</Text>
            <Text style={styles.userInfo}>Username: {createdUser.username}</Text>
            <Text style={styles.userInfo}>Email: {createdUser.email}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});
