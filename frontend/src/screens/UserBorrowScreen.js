import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { booksAPI, transactionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { createShadow } from '../utils/shadowStyles';

export default function UserBorrowScreen() {
  const { user, isAuthenticated } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await booksAPI.getAll();
      setBooks(data);
    } catch (error) {
      Alert.alert('Error', 'ไม่สามารถโหลดรายการหนังสือได้');
      console.error('Load books error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleBorrow = async (book) => {
    console.log('=== BORROW BOOK START ===');
    console.log('Book:', book);
    console.log('User:', user);
    console.log('Is authenticated:', isAuthenticated);

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('User not authenticated');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('กรุณาเข้าสู่ระบบใหม่');
      } else {
        Alert.alert('Error', 'กรุณาเข้าสู่ระบบใหม่');
      }
      return;
    }

    if (book.quantity < 1) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('หนังสือเล่มนี้หมดแล้ว');
      } else {
        Alert.alert('ไม่สามารถยืมได้', 'หนังสือเล่มนี้หมดแล้ว');
      }
      return;
    }

    // Confirm borrowing
    let confirmed = false;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      confirmed = window.confirm(`คุณต้องการยืม "${book.title}" หรือไม่?`);
    } else {
      await new Promise((resolve) => {
        Alert.alert(
          'ยืมหนังสือ',
          `คุณต้องการยืม "${book.title}" หรือไม่?`,
          [
            { 
              text: 'ยกเลิก', 
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'ยืม',
              onPress: () => resolve(true)
            },
          ]
        );
      }).then((result) => {
        confirmed = result;
      });
    }

    if (!confirmed) {
      console.log('Borrow cancelled by user');
      return;
    }

    setBorrowing(true);
    try {
      console.log('Calling transactionsAPI.borrow with:', {
        userId: user.id,
        bookId: book.id
      });
      const result = await transactionsAPI.borrow(user.id, book.id);
      console.log('Borrow result:', result);
      console.log('=== BORROW BOOK SUCCESS ===');
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('ยืมหนังสือสำเร็จ');
      } else {
        Alert.alert('สำเร็จ', 'ยืมหนังสือสำเร็จ');
      }
      loadBooks();
    } catch (error) {
      console.error('=== BORROW BOOK ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'ไม่สามารถยืมหนังสือได้';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่';
        } else if (error.response.status === 403) {
          errorMessage = 'คุณไม่มีสิทธิ์ยืมหนังสือนี้';
        } else if (error.response.status === 404) {
          errorMessage = error.response.data?.detail || 'ไม่พบหนังสือหรือผู้ใช้';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.detail || 'หนังสือหมดแล้ว';
        } else {
          errorMessage = error.response.data?.detail || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setBorrowing(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await transactionsAPI.getUserHistory(user.id);
      setHistory(data);
      setHistoryModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'ไม่สามารถโหลดประวัติได้');
      console.error('Load history error:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBook = ({ item }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookAuthor}>โดย {item.author}</Text>
        <Text style={styles.bookIsbn}>ISBN: {item.isbn}</Text>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>จำนวน:</Text>
          <Text
            style={[
              styles.quantity,
              item.quantity > 0 ? styles.quantityAvailable : styles.quantityUnavailable,
            ]}
          >
            {item.quantity} เล่ม
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.borrowButton,
          (item.quantity < 1 || borrowing) && styles.borrowButtonDisabled,
        ]}
        onPress={() => handleBorrow(item)}
        disabled={item.quantity < 1 || borrowing}
      >
        <Text style={styles.borrowButtonText}>
          {item.quantity > 0 ? 'ยืมหนังสือ' : 'หมดแล้ว'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 ยืมหนังสือ</Text>
        <Text style={styles.headerSubtitle}>เลือกหนังสือที่ต้องการยืม</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาหนังสือ (ชื่อ, ผู้แต่ง, ISBN)..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* History Button */}
      <TouchableOpacity style={styles.historyButton} onPress={loadHistory}>
        <Text style={styles.historyButtonText}>📖 ดูประวัติการยืม-คืน</Text>
      </TouchableOpacity>

      {/* Books List */}
      <FlatList
        data={filteredBooks}
        renderItem={renderBook}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadBooks} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ไม่พบหนังสือ</Text>
          </View>
        }
      />

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ประวัติการยืม-คืน</Text>
              <TouchableOpacity
                onPress={() => setHistoryModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {historyLoading ? (
              <ActivityIndicator size="large" color="#6366F1" />
            ) : (
              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <Text style={styles.historyStatus}>
                      {item.status === 'Borrowed' ? '📖 กำลังยืม' : '✅ คืนแล้ว'}
                    </Text>
                    <Text style={styles.historyDate}>
                      ยืม: {new Date(item.borrow_date).toLocaleDateString('th-TH')}
                    </Text>
                    {item.return_date && (
                      <Text style={styles.historyDate}>
                        คืน: {new Date(item.return_date).toLocaleDateString('th-TH')}
                      </Text>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyHistoryText}>ไม่มีประวัติการยืม-คืน</Text>
                }
              />
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#6366F1',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.1, radius: 4 }),
  },
  historyButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    ...createShadow({ color: '#10B981', offsetY: 2, opacity: 0.3, radius: 4 }),
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.1, radius: 8 }),
  },
  bookInfo: {
    marginBottom: 15,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 5,
  },
  bookIsbn: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 5,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantityAvailable: {
    color: '#10B981',
  },
  quantityUnavailable: {
    color: '#EF4444',
  },
  borrowButton: {
    backgroundColor: '#6366F1',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    ...createShadow({ color: '#6366F1', offsetY: 2, opacity: 0.3, radius: 4 }),
  },
  borrowButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  borrowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    ...createShadow({ color: '#000', offsetY: 4, opacity: 0.3, radius: 12 }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
  },
  historyItem: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  historyStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  historyDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 20,
  },
});
