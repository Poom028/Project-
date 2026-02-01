import React, { useState, useEffect, useRef } from 'react';
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
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { transactionsAPI, booksAPI, usersAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { createShadow } from '../utils/shadowStyles';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [borrowModalVisible, setBorrowModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    bookId: '',
  });
  const [historyUserId, setHistoryUserId] = useState('');
  const [userHistory, setUserHistory] = useState([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headerScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadData();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for pending badge
    if (isAdmin) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  // Reload data when screen comes into focus (for admin to see new requests)
  useFocusEffect(
    React.useCallback(() => {
      if (isAdmin) {
        console.log('TransactionsScreen: Screen focused, reloading data...');
        loadData();
      }
    }, [isAdmin])
  );

  const loadData = async () => {
    try {
      if (isAdmin) {
        // For admin, load all transactions, books, and users
        const [transactionsData, booksData, usersData] = await Promise.all([
          adminAPI.getAllTransactions(),
          booksAPI.getAll(),
          adminAPI.getAllUsers(),
        ]);
        
        // Sort transactions: Pending requests first, then by date (newest first)
        const sortedTransactions = transactionsData.sort((a, b) => {
          // Priority order: Pending > PendingReturn > Borrowed > Returned
          const statusPriority = {
            'Pending': 1,
            'PendingReturn': 2,
            'Borrowed': 3,
            'Returned': 4
          };
          
          const priorityA = statusPriority[a.status] || 99;
          const priorityB = statusPriority[b.status] || 99;
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // If same priority, sort by date (newest first)
          return new Date(b.borrow_date) - new Date(a.borrow_date);
        });
        
        console.log('Loaded transactions:', sortedTransactions.length);
        console.log('Pending borrows:', sortedTransactions.filter(t => t.status === 'Pending').length);
        console.log('Pending returns:', sortedTransactions.filter(t => t.status === 'PendingReturn').length);
        
        setTransactions(sortedTransactions);
        setBooks(booksData);
        setUsers(usersData);
      } else {
        // For regular users, just load books
        const [booksData] = await Promise.all([booksAPI.getAll()]);
        setBooks(booksData);
      }
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('Error', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBorrow = async () => {
    if (!formData.userId || !formData.bookId) {
      Alert.alert('Error', 'กรุณากรอก User ID และ Book ID');
      return;
    }

    try {
      await transactionsAPI.borrow(formData.userId, formData.bookId);
      Alert.alert('Success', 'ยืมหนังสือสำเร็จ');
      setBorrowModalVisible(false);
      setFormData({ userId: '', bookId: '' });
      loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'ไม่สามารถยืมหนังสือได้');
      console.error(error);
    }
  };

  const handleReturn = async () => {
    if (!formData.userId || !formData.bookId) {
      Alert.alert('Error', 'กรุณากรอก User ID และ Book ID');
      return;
    }

    try {
      await transactionsAPI.return(formData.userId, formData.bookId);
      Alert.alert('Success', 'คืนหนังสือสำเร็จ');
      setReturnModalVisible(false);
      setFormData({ userId: '', bookId: '' });
      loadData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'ไม่สามารถคืนหนังสือได้');
      console.error(error);
    }
  };

  // Handle approve borrow for Admin
  const handleApproveBorrow = async (transaction) => {
    if (transaction.status !== 'Pending') {
      Alert.alert('Error', 'รายการนี้ไม่ใช่คำขอที่รออนุมัติ');
      return;
    }

    const confirmApprove = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.confirm(`คุณต้องการอนุมัติการยืมหนังสือ "${getBookTitle(transaction.book_id)}" ให้ผู้ใช้ "${getUserName(transaction.user_id)}" หรือไม่?`)
      : await new Promise(resolve => {
          Alert.alert(
            'ยืนยันการอนุมัติ',
            `คุณต้องการอนุมัติการยืมหนังสือ "${getBookTitle(transaction.book_id)}" ให้ผู้ใช้ "${getUserName(transaction.user_id)}" หรือไม่?`,
            [
              { text: 'ยกเลิก', style: 'cancel', onPress: () => resolve(false) },
              { text: 'อนุมัติ', onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        });

    if (!confirmApprove) {
      return;
    }

    try {
      await adminAPI.approveBorrow(transaction.id);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('อนุมัติการยืมหนังสือสำเร็จ');
      } else {
        Alert.alert('Success', 'อนุมัติการยืมหนังสือสำเร็จ');
      }
      loadData();
    } catch (error) {
      console.error('Approve borrow error:', error);
      const errorMessage = error.response?.data?.detail || 'ไม่สามารถอนุมัติได้';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  // Handle approve return for Admin
  const handleApproveReturn = async (transaction) => {
    if (transaction.status !== 'PendingReturn') {
      Alert.alert('Error', 'รายการนี้ไม่ใช่คำขอคืนที่รออนุมัติ');
      return;
    }

    const confirmApprove = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.confirm(`คุณต้องการอนุมัติการคืนหนังสือ "${getBookTitle(transaction.book_id)}" จากผู้ใช้ "${getUserName(transaction.user_id)}" หรือไม่?`)
      : await new Promise(resolve => {
          Alert.alert(
            'ยืนยันการอนุมัติ',
            `คุณต้องการอนุมัติการคืนหนังสือ "${getBookTitle(transaction.book_id)}" จากผู้ใช้ "${getUserName(transaction.user_id)}" หรือไม่?`,
            [
              { text: 'ยกเลิก', style: 'cancel', onPress: () => resolve(false) },
              { text: 'อนุมัติ', onPress: () => resolve(true) },
            ],
            { cancelable: true }
          );
        });

    if (!confirmApprove) {
      return;
    }

    try {
      await adminAPI.approveReturn(transaction.id);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('อนุมัติการคืนหนังสือสำเร็จ');
      } else {
        Alert.alert('Success', 'อนุมัติการคืนหนังสือสำเร็จ');
      }
      loadData();
    } catch (error) {
      console.error('Approve return error:', error);
      const errorMessage = error.response?.data?.detail || 'ไม่สามารถอนุมัติได้';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleViewHistory = async () => {
    if (!historyUserId) {
      Alert.alert('Error', 'กรุณากรอก User ID');
      return;
    }

    try {
      const history = await transactionsAPI.getUserHistory(historyUserId);
      setUserHistory(history);
      setHistoryModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'ไม่สามารถโหลดประวัติได้');
      console.error(error);
    }
  };

  // Helper function to get user name by ID
  const getUserName = (userId) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.username : userId;
  };

  // Helper function to get book title by ID
  const getBookTitle = (bookId) => {
    const foundBook = books.find(b => b.id === bookId);
    return foundBook ? foundBook.title : bookId;
  };

  // Component for transaction item with animation
  const TransactionItem = ({ item, index }) => {
    const userName = getUserName(item.user_id);
    const bookTitle = getBookTitle(item.book_id);
    const isPending = item.status === 'Pending';
    const isBorrowed = item.status === 'Borrowed';
    const isPendingReturn = item.status === 'PendingReturn';
    const isReturned = item.status === 'Returned';
    
    const getStatusBadge = () => {
      if (isPending) return { text: '⏳ รอการอนุมัติการยืม', style: styles.statusBadgePending };
      if (isBorrowed) return { text: '📖 กำลังยืม', style: styles.statusBadgeBorrowed };
      if (isPendingReturn) return { text: '⏳ รอการอนุมัติการคืน', style: styles.statusBadgePendingReturn };
      if (isReturned) return { text: '✅ คืนแล้ว', style: styles.statusBadgeReturned };
      return { text: item.status, style: styles.statusBadgeDefault };
    };

    const statusBadge = getStatusBadge();
    const cardAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: (index || 0) * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [index]);
    
    return (
      <Animated.View 
        style={[
          styles.transactionCard,
          isPending && styles.transactionCardPending,
          isBorrowed && styles.transactionCardBorrowed,
          isPendingReturn && styles.transactionCardPendingReturn,
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
          Platform.OS === 'web' && styles.transactionCardWeb,
        ]}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionStatusContainer}>
            <View style={[styles.statusBadge, statusBadge.style]}>
              <Text style={styles.statusBadgeText}>{statusBadge.text}</Text>
            </View>
          </View>
          <Text style={styles.transactionId}>ID: {item.id.substring(0, 8)}...</Text>
        </View>
        
        <View style={styles.transactionContent}>
          <View style={styles.transactionRow}>
            <View style={styles.transactionIconContainer}>
              <Text style={styles.transactionIcon}>👤</Text>
            </View>
            <View style={styles.transactionInfoContainer}>
              <Text style={styles.transactionLabel}>ผู้ใช้</Text>
              <Text style={styles.transactionValue}>{userName}</Text>
            </View>
          </View>
          
          <View style={styles.transactionRow}>
            <View style={styles.transactionIconContainer}>
              <Text style={styles.transactionIcon}>📚</Text>
            </View>
            <View style={styles.transactionInfoContainer}>
              <Text style={styles.transactionLabel}>หนังสือ</Text>
              <Text style={styles.transactionValue}>{bookTitle}</Text>
            </View>
          </View>
          
          <View style={styles.transactionRow}>
            <View style={styles.transactionIconContainer}>
              <Text style={styles.transactionIcon}>📅</Text>
            </View>
            <View style={styles.transactionInfoContainer}>
              <Text style={styles.transactionLabel}>วันที่ยืม</Text>
              <Text style={styles.transactionValue}>{new Date(item.borrow_date).toLocaleString('th-TH')}</Text>
            </View>
          </View>
          
          {item.return_date && (
            <View style={styles.transactionRow}>
              <View style={styles.transactionIconContainer}>
                <Text style={styles.transactionIcon}>✅</Text>
              </View>
              <View style={styles.transactionInfoContainer}>
                <Text style={styles.transactionLabel}>วันที่คืน</Text>
                <Text style={styles.transactionValue}>{new Date(item.return_date).toLocaleString('th-TH')}</Text>
              </View>
            </View>
          )}
        </View>

        {isAdmin && isPending && (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApproveBorrow(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.approveButtonIcon}>✅</Text>
            <Text style={styles.approveButtonText}>อนุมัติการยืม</Text>
          </TouchableOpacity>
        )}

        {isAdmin && isPendingReturn && (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApproveReturn(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.approveButtonIcon}>✅</Text>
            <Text style={styles.approveButtonText}>อนุมัติการคืน</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const renderTransactionItem = ({ item, index }) => {
    return <TransactionItem item={item} index={index || 0} />;
  };

  const renderBookItem = ({ item }) => (
    <View style={styles.bookCard}>
      <Text style={styles.bookTitle}>{item.title}</Text>
      <Text style={styles.bookInfo}>โดย: {item.author}</Text>
      <Text style={styles.bookInfo}>ISBN: {item.isbn}</Text>
      <Text style={styles.bookQuantity}>
        จำนวน: {item.quantity} เล่ม
      </Text>
    </View>
  );

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <Text style={styles.historyTitle}>Transaction ID: {item.id}</Text>
      <Text style={styles.historyInfo}>Book ID: {item.book_id}</Text>
      <Text style={styles.historyInfo}>Status: {item.status}</Text>
      <Text style={styles.historyInfo}>
        วันที่ยืม: {new Date(item.borrow_date).toLocaleString('th-TH')}
      </Text>
      {item.return_date && (
        <Text style={styles.historyInfo}>
          วันที่คืน: {new Date(item.return_date).toLocaleString('th-TH')}
        </Text>
      )}
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

  const pendingCount = transactions.filter(t => t.status === 'Pending' || t.status === 'PendingReturn').length;
  const pendingBadgeScale = pendingCount > 0 ? pulseAnim : new Animated.Value(1);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          {
            transform: [{ scale: headerScale }],
            opacity: fadeAnim,
          }
        ]}
      >
        <View style={styles.headerDecoration} />
        <View style={styles.headerDecoration2} />
        <Animated.View 
          style={[
            styles.headerContent,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          <Text style={styles.headerTitle}>
            {isAdmin ? '📊 การยืม-คืนหนังสือ' : 'การยืม-คืนหนังสือ'}
          </Text>
          {isAdmin && (
            <Text style={styles.headerSubtitle}>
              ดูข้อมูลการยืม-คืนทั้งหมด {transactions.length} รายการ
            </Text>
          )}
          {isAdmin && (
            <Animated.View 
              style={[
                styles.adminBadge,
                {
                  transform: [{ scale: pulseAnim }],
                }
              ]}
            >
              <Text style={styles.adminBadgeText}>👑 Admin</Text>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>

      {isAdmin ? (
        // Admin view: Show all transactions
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F59E0B" />
          }
        >
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardPending]}>
              <Text style={styles.statIcon}>⏳</Text>
              <Text style={styles.statNumber}>
                {transactions.filter(t => t.status === 'Pending' || t.status === 'PendingReturn').length}
              </Text>
              <Text style={styles.statLabel}>รออนุมัติ</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBorrowed]}>
              <Text style={styles.statIcon}>📖</Text>
              <Text style={styles.statNumber}>{transactions.filter(t => t.status === 'Borrowed').length}</Text>
              <Text style={styles.statLabel}>กำลังยืม</Text>
            </View>
            <View style={[styles.statCard, styles.statCardReturned]}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statNumber}>{transactions.filter(t => t.status === 'Returned').length}</Text>
              <Text style={styles.statLabel}>คืนแล้ว</Text>
            </View>
          </View>

          {/* Pending Requests Section */}
          {pendingCount > 0 && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>⏳ คำขอที่รออนุมัติ</Text>
                  <Animated.View 
                    style={[
                      styles.pendingBadge,
                      {
                        transform: [{ scale: pendingBadgeScale }],
                      }
                    ]}
                  >
                    <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
                  </Animated.View>
                </View>
              </View>
              {transactions.filter(t => t.status === 'Pending' || t.status === 'PendingReturn').map((item, index) => (
                <TransactionItem key={item.id} item={item} index={index} />
              ))}
            </Animated.View>
          )}

          {/* All Transactions Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>รายการการยืม-คืนทั้งหมด</Text>
            <Text style={styles.sectionSubtitle}>{transactions.length} รายการ</Text>
          </View>
          <Animated.View
            style={{
              opacity: fadeAnim,
            }}
          >
            {transactions.length > 0 ? (
              transactions.map((item, index) => (
                <TransactionItem key={item.id} item={item} index={index} />
              ))
            ) : (
              <Animated.View 
                style={[
                  styles.emptyContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }
                ]}
              >
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyText}>ยังไม่มีรายการการยืม-คืน</Text>
                <Text style={styles.emptySubtext}>เมื่อมีการยืม-คืนหนังสือ รายการจะแสดงที่นี่</Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      ) : (
        // Regular user view: Show books and action buttons
        <>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setBorrowModalVisible(true)}
            >
              <Text style={styles.actionButtonText}>📖 ยืมหนังสือ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setReturnModalVisible(true)}
            >
              <Text style={styles.actionButtonText}>↩️ คืนหนังสือ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setHistoryUserId('');
                setHistoryModalVisible(true);
              }}
            >
              <Text style={styles.actionButtonText}>📋 ดูประวัติ</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>รายการหนังสือ</Text>
          <FlatList
            data={books}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}

      {/* Borrow Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={borrowModalVisible}
        onRequestClose={() => setBorrowModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ยืมหนังสือ</Text>
            <TextInput
              style={styles.input}
              placeholder="User ID"
              value={formData.userId}
              onChangeText={(text) => setFormData({ ...formData, userId: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Book ID"
              value={formData.bookId}
              onChangeText={(text) => setFormData({ ...formData, bookId: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setBorrowModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleBorrow}
              >
                <Text style={[styles.modalButtonText, styles.submitButtonText]}>ยืม</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Return Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={returnModalVisible}
        onRequestClose={() => setReturnModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>คืนหนังสือ</Text>
            <TextInput
              style={styles.input}
              placeholder="User ID"
              value={formData.userId}
              onChangeText={(text) => setFormData({ ...formData, userId: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Book ID"
              value={formData.bookId}
              onChangeText={(text) => setFormData({ ...formData, bookId: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setReturnModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleReturn}
              >
                <Text style={[styles.modalButtonText, styles.submitButtonText]}>คืน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={historyModalVisible}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.historyModalContent]}>
            <Text style={styles.modalTitle}>ประวัติการยืม-คืน</Text>
            <TextInput
              style={styles.input}
              placeholder="User ID"
              value={historyUserId}
              onChangeText={setHistoryUserId}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleViewHistory}
            >
              <Text style={styles.submitButtonText}>ดูประวัติ</Text>
            </TouchableOpacity>
            
            <FlatList
              data={userHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              style={styles.historyList}
            />

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setHistoryModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>ปิด</Text>
            </TouchableOpacity>
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
  header: {
    backgroundColor: '#F59E0B',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #DC2626 100%)',
    }),
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  adminBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 4, opacity: 0.1, radius: 12 }),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s ease',
      cursor: 'default',
      ':hover': {
        transform: 'translateY(-6px) scale(1.02)',
        boxShadow: '0 16px 32px rgba(0, 0, 0, 0.15)',
        borderColor: '#E5E7EB',
      },
    }),
  },
  statCardPending: {
    borderTopWidth: 4,
    borderTopColor: '#F59E0B',
  },
  statCardBorrowed: {
    borderTopWidth: 4,
    borderTopColor: '#6366F1',
  },
  statCardReturned: {
    borderTopWidth: 4,
    borderTopColor: '#10B981',
  },
  statIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#F59E0B', offsetY: 2, opacity: 0.3, radius: 4 }),
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  listContainer: {
    paddingBottom: 20,
  },
  bookCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.1, radius: 4 }),
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bookInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  bookQuantity: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  historyModalContent: {
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButtonText: {
    color: '#fff',
  },
  historyList: {
    maxHeight: 300,
    marginVertical: 15,
  },
  historyCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  historyInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    marginHorizontal: 20,
    ...createShadow({ color: '#000', offsetY: 4, opacity: 0.1, radius: 16 }),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
    }),
  },
  transactionCardWeb: {
    ...(Platform.OS === 'web' && {
      ':hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        borderColor: '#F59E0B',
      },
    }),
  },
  transactionCardPending: {
    borderLeftWidth: 6,
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  transactionCardBorrowed: {
    borderLeftWidth: 6,
    borderLeftColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  transactionCardPendingReturn: {
    borderLeftWidth: 6,
    borderLeftColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionStatusContainer: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    alignSelf: 'flex-start',
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.1, radius: 4 }),
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statusBadgeBorrowed: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  statusBadgePendingReturn: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  statusBadgeReturned: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  statusBadgeDefault: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  transactionId: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  transactionContent: {
    marginBottom: 15,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionIcon: {
    fontSize: 22,
  },
  transactionInfoContainer: {
    flex: 1,
  },
  transactionLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  approveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 16,
    ...createShadow({ color: '#10B981', offsetY: 4, opacity: 0.3, radius: 8 }),
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    }),
  },
  approveButtonWeb: {
    ...(Platform.OS === 'web' && {
      ':hover': {
        backgroundColor: '#059669',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
      },
      ':active': {
        transform: 'translateY(0px)',
      },
    }),
  },
  approveButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  returnButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
    ...createShadow({ color: '#10B981', offsetY: 2, opacity: 0.3, radius: 4 }),
  },
  returnButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.05, radius: 4 }),
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

// Add CSS animations for web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'transactions-screen-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes float {
        0%, 100% {
          transform: translateY(0px) rotate(0deg);
        }
        50% {
          transform: translateY(-20px) rotate(5deg);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes shimmer {
        0% {
          background-position: -1000px 0;
        }
        100% {
          background-position: 1000px 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
