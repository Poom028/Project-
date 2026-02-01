import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { booksAPI } from '../services/api';
import { createShadow } from '../utils/shadowStyles';

export default function BooksScreen() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity: '',
  });

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await booksAPI.getAll();
      setBooks(data);
    } catch (error) {
      Alert.alert('Error', 'ไม่สามารถโหลดข้อมูลหนังสือได้');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };

  const handleCreateBook = async () => {
    if (!formData.title || !formData.author || !formData.isbn || !formData.quantity) {
      Alert.alert('Error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      await booksAPI.create({
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        quantity: parseInt(formData.quantity),
      });
      Alert.alert('Success', 'เพิ่มหนังสือสำเร็จ');
      setModalVisible(false);
      setFormData({ title: '', author: '', isbn: '', quantity: '' });
      loadBooks();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'ไม่สามารถเพิ่มหนังสือได้');
      console.error(error);
    }
  };

  const handleDeleteBook = async (id) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบหนังสือนี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting book with ID:', id);
              await booksAPI.delete(id);
              console.log('Book deleted successfully');
              Alert.alert('Success', 'ลบหนังสือสำเร็จ');
              loadBooks();
            } catch (error) {
              console.error('Delete book error:', error);
              console.error('Error response:', error.response);
              let errorMessage = 'ไม่สามารถลบหนังสือได้';
              
              if (error.response) {
                if (error.response.status === 401) {
                  errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
                } else if (error.response.status === 403) {
                  errorMessage = 'คุณไม่มีสิทธิ์ลบหนังสือ (ต้องเป็น Admin)';
                } else if (error.response.status === 404) {
                  errorMessage = 'ไม่พบหนังสือที่ต้องการลบ';
                } else {
                  errorMessage = error.response.data?.detail || errorMessage;
                }
              } else if (error.request) {
                errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
              }
              
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const renderBookItem = ({ item }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookIconContainer}>
        <Text style={styles.bookIcon}>📖</Text>
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookAuthor}>โดย {item.author}</Text>
        <View style={styles.bookMeta}>
          <Text style={styles.bookIsbn}>ISBN: {item.isbn}</Text>
          <View style={[styles.quantityBadge, item.quantity > 0 ? styles.quantityAvailable : styles.quantityUnavailable]}>
            <Text style={styles.quantityText}>{item.quantity} เล่ม</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteBook(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>รายการหนังสือ</Text>
          <Text style={styles.headerSubtitle}>{books.length} เล่ม</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>เพิ่ม</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366F1" />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>ยังไม่มีหนังสือ</Text>
            <Text style={styles.emptySubtext}>กดปุ่ม "เพิ่ม" เพื่อเพิ่มหนังสือเล่มแรก</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เพิ่มหนังสือใหม่</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ชื่อหนังสือ</Text>
              <TextInput
                style={styles.input}
                placeholder="กรอกชื่อหนังสือ"
                placeholderTextColor="#9CA3AF"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ชื่อผู้แต่ง</Text>
              <TextInput
                style={styles.input}
                placeholder="กรอกชื่อผู้แต่ง"
                placeholderTextColor="#9CA3AF"
                value={formData.author}
                onChangeText={(text) => setFormData({ ...formData, author: text })}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ISBN</Text>
              <TextInput
                style={styles.input}
                placeholder="กรอก ISBN"
                placeholderTextColor="#9CA3AF"
                value={formData.isbn}
                onChangeText={(text) => setFormData({ ...formData, isbn: text })}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>จำนวน</Text>
              <TextInput
                style={styles.input}
                placeholder="กรอกจำนวนหนังสือ"
                placeholderTextColor="#9CA3AF"
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleCreateBook}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#6366F1',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.2, radius: 4 }),
  },
  addButtonIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
    marginRight: 6,
  },
  addButtonText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.08, radius: 8 }),
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  bookIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#6366F120',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookIcon: {
    fontSize: 28,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookIsbn: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  quantityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityAvailable: {
    backgroundColor: '#10B98120',
  },
  quantityUnavailable: {
    backgroundColor: '#EF444420',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...createShadow({ color: '#000', offsetY: 4, opacity: 0.3, radius: 12 }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6366F1',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
