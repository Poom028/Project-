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
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { booksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { createShadow } from '../utils/shadowStyles';

export default function BooksScreen() {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  // Debug: Log user info when component mounts or user changes
  useEffect(() => {
    console.log('BooksScreen: User info updated', {
      isAuthenticated,
      user: user ? { id: user.id, username: user.username, role: user.role } : null
    });
  }, [user, isAuthenticated]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity: '',
    image_url: '',
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      console.log('Loading books...');
      const data = await booksAPI.getAll();
      console.log('Books loaded:', data.length, 'books');
      setBooks(data);
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'ไม่สามารถโหลดข้อมูลหนังสือได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };

  const handleImageInput = (text) => {
    setFormData({ ...formData, image_url: text });
    if (text && (text.startsWith('http') || text.startsWith('data:') || text.startsWith('/'))) {
      setImagePreview(text);
    } else {
      setImagePreview(null);
    }
  };

  const handleFileUpload = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result;
            setFormData({ ...formData, image_url: base64String });
            setImagePreview(base64String);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Info', 'การอัปโหลดไฟล์รองรับเฉพาะบนเว็บ กรุณาใส่ URL ของรูปภาพแทน');
    }
  };

  const handleEditBook = (book) => {
    console.log('[DEBUG] Editing book:', book);
    setEditingBookId(book.id);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      quantity: book.quantity?.toString() || '',
      image_url: book.image_url || '',
    });
    if (book.image_url) {
      setImagePreview(book.image_url);
    } else {
      setImagePreview(null);
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingBookId(null);
    setFormData({ title: '', author: '', isbn: '', quantity: '', image_url: '' });
    setImagePreview(null);
  };

  const handleCreateBook = async () => {
    if (!formData.title || !formData.author || !formData.isbn || !formData.quantity) {
      Alert.alert('Error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        quantity: parseInt(formData.quantity),
        image_url: formData.image_url || null,
      };
      
      if (editingBookId) {
        // Update existing book
        console.log('[DEBUG] Updating book with ID:', editingBookId, 'data:', bookData);
        const result = await booksAPI.update(editingBookId, bookData);
        console.log('[DEBUG] Book updated successfully:', result);
        Alert.alert('Success', 'แก้ไขหนังสือสำเร็จ');
      } else {
        // Create new book
        console.log('[DEBUG] Creating book with data:', bookData);
        const result = await booksAPI.create(bookData);
        console.log('[DEBUG] Book created successfully:', result);
        Alert.alert('Success', 'เพิ่มหนังสือสำเร็จ');
      }
      
      handleCloseModal();
      loadBooks();
    } catch (error) {
      console.error('[ERROR] Failed to save book:', error);
      console.error('[ERROR] Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDeleteBook = async (id) => {
    console.log('handleDeleteBook called with ID:', id);
    
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, redirecting to login');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (window.confirm('กรุณาเข้าสู่ระบบใหม่')) {
          navigation.navigate('Login');
        }
      } else {
        Alert.alert('Error', 'กรุณาเข้าสู่ระบบใหม่', [
          { text: 'ตกลง', onPress: () => navigation.navigate('Login') }
        ]);
      }
      return;
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('User is not admin, role:', user.role);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('คุณไม่มีสิทธิ์ลบหนังสือ (ต้องเป็น Admin)');
      } else {
        Alert.alert('Error', 'คุณไม่มีสิทธิ์ลบหนังสือ (ต้องเป็น Admin)');
      }
      return;
    }

    // Confirm deletion
    let confirmed = false;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      confirmed = window.confirm('คุณต้องการลบหนังสือนี้หรือไม่?');
    } else {
      // For mobile, we'll use a promise-based approach
      await new Promise((resolve) => {
        Alert.alert(
          'ยืนยันการลบ',
          'คุณต้องการลบหนังสือนี้หรือไม่?',
          [
            { 
              text: 'ยกเลิก', 
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'ลบ',
              style: 'destructive',
              onPress: () => resolve(true)
            },
          ]
        );
      }).then((result) => {
        confirmed = result;
      });
    }

    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }

    // Proceed with deletion
    try {
      console.log('=== DELETE BOOK START ===');
      console.log('Book ID:', id);
      console.log('Current user:', user);
      console.log('Is authenticated:', isAuthenticated);
      
      const result = await booksAPI.delete(id);
      console.log('Delete result:', result);
      console.log('=== DELETE BOOK SUCCESS ===');
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('ลบหนังสือสำเร็จ');
      } else {
        Alert.alert('Success', 'ลบหนังสือสำเร็จ');
      }
      loadBooks();
    } catch (error) {
      console.error('=== DELETE BOOK ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'ไม่สามารถลบหนังสือได้';
      let shouldRedirectToLogin = false;
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่';
          shouldRedirectToLogin = true;
        } else if (error.response.status === 403) {
          errorMessage = 'คุณไม่มีสิทธิ์ลบหนังสือ (ต้องเป็น Admin)';
        } else if (error.response.status === 404) {
          errorMessage = 'ไม่พบหนังสือที่ต้องการลบ';
        } else {
          errorMessage = error.response.data?.detail || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (shouldRedirectToLogin) {
          if (window.confirm(errorMessage + '\n\nกด OK เพื่อไปหน้า Login')) {
            navigation.navigate('Login');
          }
        } else {
          window.alert(errorMessage);
        }
      } else {
        if (shouldRedirectToLogin) {
          Alert.alert('Error', errorMessage, [
            { text: 'ตกลง', onPress: () => navigation.navigate('Login') }
          ]);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    }
  };

  const renderBookItem = ({ item }) => {
    console.log('Rendering book item:', item.id, item.title);
    return (
      <View style={styles.bookCard}>
        <View style={styles.bookIconContainer}>
          {item.image_url ? (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.bookIcon}>📖</Text>
          )}
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
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              console.log('Edit button clicked for book:', item.id, item.title);
              handleEditBook(item);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              console.log('Delete button clicked for book:', item.id, item.title);
              handleDeleteBook(item.id);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          onPress={() => {
            setEditingBookId(null);
            setFormData({ title: '', author: '', isbn: '', quantity: '', image_url: '' });
            setImagePreview(null);
            setModalVisible(true);
          }}
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
              <Text style={styles.modalTitle}>
                {editingBookId ? 'แก้ไขหนังสือ' : 'เพิ่มหนังสือใหม่'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseModal}
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
                editable={!editingBookId}
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>รูปภาพหนังสือ (URL หรืออัปโหลดไฟล์)</Text>
              <View style={styles.imageInputContainer}>
                <TextInput
                  style={[styles.input, styles.imageInput]}
                  placeholder="วาง URL รูปภาพ หรือคลิกปุ่มอัปโหลด"
                  placeholderTextColor="#9CA3AF"
                  value={formData.image_url}
                  onChangeText={handleImageInput}
                />
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={handleFileUpload}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.uploadButtonText}>📷 อัปโหลด</Text>
                  </TouchableOpacity>
                )}
              </View>
              {imagePreview && (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: imagePreview }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setFormData({ ...formData, image_url: '' });
                      setImagePreview(null);
                    }}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
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
                <Text style={styles.submitButtonText}>
                  {editingBookId ? 'อัปเดต' : 'บันทึก'}
                </Text>
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
    overflow: 'hidden',
  },
  bookIcon: {
    fontSize: 28,
  },
  bookImage: {
    width: '100%',
    height: '100%',
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  editIcon: {
    fontSize: 20,
  },
  deleteButton: {
    padding: 8,
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
  imageInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  imageInput: {
    flex: 1,
  },
  uploadButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginTop: 12,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.2, radius: 4 }),
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
