import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authAPI } from '../services/api';
import { createShadow } from '../utils/shadowStyles';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      Alert.alert('Error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      
      Alert.alert('Success', 'สมัครสมาชิกสำเร็จ', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'ไม่สามารถสมัครสมาชิกได้'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>📝</Text>
          </View>
          <Text style={styles.title}>สมัครสมาชิก</Text>
          <Text style={styles.subtitle}>สร้างบัญชีใหม่เพื่อเริ่มใช้งาน</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกชื่อผู้ใช้"
              placeholderTextColor="#9CA3AF"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกอีเมล"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              placeholderTextColor="#9CA3AF"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="ยืนยันรหัสผ่าน"
              placeholderTextColor="#9CA3AF"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>สมัครสมาชิก</Text>
                <Text style={styles.buttonIcon}>→</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>หรือ</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              มีบัญชีอยู่แล้ว? <Text style={styles.linkTextBold}>เข้าสู่ระบบ</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    padding: 30,
    paddingTop: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...createShadow({ color: '#000', offsetY: 1, opacity: 0.05, radius: 2 }),
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    ...createShadow({ color: '#6366F1', offsetY: 4, opacity: 0.3, radius: 8 }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#9CA3AF',
    fontSize: 14,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 30,
  },
  linkText: {
    color: '#6B7280',
    fontSize: 15,
  },
  linkTextBold: {
    color: '#6366F1',
    fontWeight: '600',
  },
});
