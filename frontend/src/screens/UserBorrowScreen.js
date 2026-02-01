import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Animated,
  Easing,
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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadBooks();
    
    // Start initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
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
      confirmed = window.confirm(`คุณต้องการยืม "${book.title}" หรือไม่?\n\nคำขอจะถูกส่งไปให้ Admin อนุมัติ`);
    } else {
      confirmed = await new Promise((resolve) => {
        Alert.alert(
          'ยืมหนังสือ',
          `คุณต้องการยืม "${book.title}" หรือไม่?\n\nคำขอจะถูกส่งไปให้ Admin อนุมัติ`,
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
        window.alert('ส่งคำขอยืมหนังสือแล้ว\nรอ Admin อนุมัติ');
      } else {
        Alert.alert('สำเร็จ', 'ส่งคำขอยืมหนังสือแล้ว\nรอ Admin อนุมัติ');
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
          errorMessage = error.response.data?.detail || 'หนังสือหมดแล้ว หรือคุณมีคำขอที่รออนุมัติอยู่แล้ว';
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

  const handleReturn = async (transaction) => {
    if (transaction.status !== 'Borrowed') {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('ไม่สามารถคืนหนังสือได้ เนื่องจากยังไม่ได้รับการอนุมัติการยืม');
      } else {
        Alert.alert('Error', 'ไม่สามารถคืนหนังสือได้ เนื่องจากยังไม่ได้รับการอนุมัติการยืม');
      }
      return;
    }

    const confirmReturn = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.confirm('คุณต้องการคืนหนังสือนี้หรือไม่?\n\nคำขอจะถูกส่งไปให้ Admin อนุมัติ')
      : await new Promise(resolve => {
          Alert.alert(
            'คืนหนังสือ',
            'คุณต้องการคืนหนังสือนี้หรือไม่?\n\nคำขอจะถูกส่งไปให้ Admin อนุมัติ',
            [
              { text: 'ยกเลิก', style: 'cancel', onPress: () => resolve(false) },
              { text: 'คืน', onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        });

    if (!confirmReturn) {
      return;
    }

    try {
      await transactionsAPI.return(transaction.user_id, transaction.book_id);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('ส่งคำขอคืนหนังสือแล้ว\nรอ Admin อนุมัติ');
      } else {
        Alert.alert('สำเร็จ', 'ส่งคำขอคืนหนังสือแล้ว\nรอ Admin อนุมัติ');
      }
      loadHistory(); // Reload history to show updated status
    } catch (error) {
      console.error('Return book error:', error);
      const errorMessage = error.response?.data?.detail || 'ไม่สามารถคืนหนังสือได้';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
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

  // Book Item Component with animation
  const BookItem = ({ item, index, onBorrow, borrowing }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: (index || 0) * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <Animated.View
        style={[
          styles.bookCard,
          Platform.OS === 'web' && styles.bookCardWeb,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.bookImageContainer}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bookIconContainer}>
              <Text style={styles.bookIcon}>📖</Text>
            </View>
          )}
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <Text style={styles.bookAuthor}>โดย {item.author}</Text>
          <View style={styles.bookMeta}>
            <Text style={styles.bookIsbn}>ISBN: {item.isbn}</Text>
            <View
              style={[
                styles.quantityBadge,
                item.quantity > 0
                  ? styles.quantityAvailable
                  : styles.quantityUnavailable,
              ]}
            >
              <Text style={styles.quantityText}>{item.quantity} เล่ม</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.borrowButton,
            (item.quantity < 1 || borrowing) && styles.borrowButtonDisabled,
            Platform.OS === 'web' && styles.borrowButtonWeb,
          ]}
          onPress={() => onBorrow(item)}
          disabled={item.quantity < 1 || borrowing}
          activeOpacity={0.8}
        >
          <Text style={styles.borrowButtonText}>
            {item.quantity > 0 ? 'ยืมหนังสือ' : 'หมดแล้ว'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderBook = ({ item, index }) => {
    return (
      <BookItem
        item={item}
        index={index || 0}
        onBorrow={handleBorrow}
        borrowing={borrowing}
      />
    );
  };

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
      <Animated.View
        style={[
          styles.header,
          { transform: [{ scale: headerScale }] },
          Platform.OS === 'web' && styles.headerWeb,
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>📚</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>ยืมหนังสือ</Text>
            <Text style={styles.headerSubtitle}>เลือกหนังสือที่ต้องการยืม</Text>
          </View>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาหนังสือ (ชื่อ, ผู้แต่ง, ISBN)..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </Animated.View>

      {/* History Button */}
      <Animated.View
        style={[
          styles.historyButtonContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.historyButton, Platform.OS === 'web' && styles.historyButtonWeb]}
          onPress={loadHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.historyButtonIcon}>📖</Text>
          <Text style={styles.historyButtonText}>ดูประวัติการยืม-คืน</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Books List */}
      <Animated.View
        style={[
          styles.listWrapper,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <FlatList
          data={filteredBooks}
          renderItem={renderBook}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadBooks}
              tintColor="#6366F1"
            />
          }
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <Animated.View
              style={[
                styles.emptyContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>ไม่พบหนังสือ</Text>
              <Text style={styles.emptySubtext}>
                ลองค้นหาด้วยคำอื่น หรือรอให้ Admin เพิ่มหนังสือใหม่
              </Text>
            </Animated.View>
          }
        />
      </Animated.View>

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
                renderItem={({ item }) => {
                  const getStatusText = () => {
                    switch (item.status) {
                      case 'Pending':
                        return '⏳ รอการอนุมัติการยืม';
                      case 'Borrowed':
                        return '📖 กำลังยืม';
                      case 'PendingReturn':
                        return '⏳ รอการอนุมัติการคืน';
                      case 'Returned':
                        return '✅ คืนแล้ว';
                      default:
                        return item.status;
                    }
                  };

                  return (
                    <View style={styles.historyItem}>
                      <Text style={styles.historyStatus}>{getStatusText()}</Text>
                      <Text style={styles.historyDate}>
                        ยืม: {new Date(item.borrow_date).toLocaleDateString('th-TH')}
                      </Text>
                      {item.return_date && (
                        <Text style={styles.historyDate}>
                          คืน: {new Date(item.return_date).toLocaleDateString('th-TH')}
                        </Text>
                      )}
                      {item.status === 'Borrowed' && (
                        <TouchableOpacity
                          style={styles.returnButton}
                          onPress={() => handleReturn(item)}
                        >
                          <Text style={styles.returnButtonText}>↩️ คืนหนังสือ</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
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
    fontSize: 16,
  },
  header: {
    backgroundColor: '#6366F1',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...createShadow({ color: '#6366F1', offsetY: 4, opacity: 0.3, radius: 8 }),
  },
  headerWeb: {
    ...(Platform.OS === 'web' && {
      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.08, radius: 8 }),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  historyButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  historyButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#10B981', offsetY: 4, opacity: 0.3, radius: 8 }),
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  historyButtonWeb: {
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(16, 185, 129, 0.4)',
      },
    }),
  },
  historyButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.08, radius: 12 }),
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  bookCardWeb: {
    ...(Platform.OS === 'web' && {
      cursor: 'default',
      transition: 'all 0.3s ease',
      ':hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  bookImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  bookIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F120',
  },
  bookIcon: {
    fontSize: 36,
  },
  bookInfo: {
    flex: 1,
    marginRight: 12,
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
    paddingVertical: 6,
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
  borrowButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    ...createShadow({ color: '#6366F1', offsetY: 2, opacity: 0.3, radius: 4 }),
  },
  borrowButtonWeb: {
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ':hover': {
        backgroundColor: '#4F46E5',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
      },
    }),
  },
  borrowButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  borrowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    ...createShadow({ color: '#000', offsetY: 8, opacity: 0.3, radius: 16 }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  historyItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    ...createShadow({ color: '#000', offsetY: 1, opacity: 0.05, radius: 4 }),
  },
  historyStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 40,
    fontSize: 16,
  },
  returnButton: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    ...createShadow({ color: '#10B981', offsetY: 2, opacity: 0.3, radius: 4 }),
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Add CSS animations for web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
  `;
  document.head.appendChild(style);
}
