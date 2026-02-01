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
  ScrollView,
} from 'react-native';
import { transactionsAPI, booksAPI, usersAPI } from '../services/api';
import { createShadow } from '../utils/shadowStyles';

export default function TransactionsScreen() {
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [booksData] = await Promise.all([booksAPI.getAll()]);
      setBooks(booksData);
    } catch (error) {
      Alert.alert('Error', 'ไม่สามารถโหลดข้อมูลได้');
      console.error(error);
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
        <Text>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>การยืม-คืนหนังสือ</Text>
      </View>

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
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 15,
    marginBottom: 10,
    color: '#333',
  },
  listContainer: {
    padding: 15,
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
});
