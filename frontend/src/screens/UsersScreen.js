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
} from 'react-native';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { createShadow } from '../utils/shadowStyles';

export default function UsersScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminAPI.getAllUsers();
      setUsers(data);
    } catch (error) {
      Alert.alert('Error', 'ไม่สามารถโหลดรายการผู้ใช้ได้');
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await adminAPI.updateUserRole(userId, newRole);
      Alert.alert('สำเร็จ', `เปลี่ยน role เป็น ${newRole === 'admin' ? 'Admin' : 'User'} แล้ว`);
      setActionModalVisible(false);
      loadUsers();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'ไม่สามารถเปลี่ยน role ได้');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    Alert.alert(
      'ยืนยันการลบ',
      `คุณต้องการลบผู้ใช้ "${username}" หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminAPI.deleteUser(userId);
              Alert.alert('สำเร็จ', 'ลบผู้ใช้สำเร็จ');
              setActionModalVisible(false);
              loadUsers();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'ไม่สามารถลบผู้ใช้ได้');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openActionModal = (user) => {
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => openActionModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.username}</Text>
          <View
            style={[
              styles.roleBadge,
              item.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser,
            ]}
          >
            <Text style={styles.roleBadgeText}>
              {item.role === 'admin' ? '👑 Admin' : '👤 User'}
            </Text>
          </View>
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userDate}>
          สมัครเมื่อ: {new Date(item.created_at).toLocaleDateString('th-TH')}
        </Text>
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>จัดการผู้ใช้</Text>
        <Text style={styles.headerSubtitle}>ดูและจัดการบัญชีผู้ใช้ทั้งหมด</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล, role)..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>ผู้ใช้ทั้งหมด</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {users.filter((u) => u.role === 'admin').length}
          </Text>
          <Text style={styles.statLabel}>Admin</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {users.filter((u) => u.role === 'user').length}
          </Text>
          <Text style={styles.statLabel}>User</Text>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadUsers} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ไม่พบผู้ใช้</Text>
          </View>
        }
      />

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>จัดการผู้ใช้</Text>
              <TouchableOpacity
                onPress={() => setActionModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.userDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Username:</Text>
                  <Text style={styles.detailValue}>{selectedUser.username}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedUser.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Role:</Text>
                  <Text style={styles.detailValue}>
                    {selectedUser.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>สมัครเมื่อ:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedUser.created_at).toLocaleDateString('th-TH')}
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  {selectedUser.role === 'admin' ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonUser]}
                      onPress={() => handleUpdateRole(selectedUser.id, 'user')}
                      disabled={actionLoading || selectedUser.id === currentUser?.id}
                    >
                      <Text style={styles.actionButtonText}>
                        เปลี่ยนเป็น User
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonAdmin]}
                      onPress={() => handleUpdateRole(selectedUser.id, 'admin')}
                      disabled={actionLoading}
                    >
                      <Text style={styles.actionButtonText}>
                        เปลี่ยนเป็น Admin
                      </Text>
                    </TouchableOpacity>
                  )}

                  {selectedUser.id !== currentUser?.id && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDelete]}
                      onPress={() => handleDeleteUser(selectedUser.id, selectedUser.username)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.actionButtonText}>ลบผู้ใช้</Text>
                    </TouchableOpacity>
                  )}

                  {selectedUser.id === currentUser?.id && (
                    <Text style={styles.cannotDeleteText}>
                      ไม่สามารถลบบัญชีของตัวเองได้
                    </Text>
                  )}
                </View>
              </View>
            )}

            {actionLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#10B981" />
              </View>
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
    backgroundColor: '#10B981',
    padding: 24,
    paddingTop: 60,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.1, radius: 4 }),
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  listContainer: {
    padding: 15,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 2, opacity: 0.1, radius: 8 }),
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeAdmin: {
    backgroundColor: '#FEF3C7',
  },
  roleBadgeUser: {
    backgroundColor: '#DBEAFE',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  arrowIcon: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
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
    padding: 24,
    width: '90%',
    maxWidth: 400,
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
  userDetails: {
    gap: 15,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  actionButtons: {
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonAdmin: {
    backgroundColor: '#F59E0B',
  },
  actionButtonUser: {
    backgroundColor: '#6366F1',
  },
  actionButtonDelete: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cannotDeleteText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
    padding: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});
