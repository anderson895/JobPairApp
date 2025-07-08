// import statements...
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { User } from '@/types';
import {
  Users,
  UserPlus,
  UserX,
  UserCheck,
  Shield,
  GraduationCap,
  Briefcase,
} from 'lucide-react-native';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student' as 'student' | 'counselor',
  });

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as User[];
      setUsers(usersData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleRestrictUser = async (userId: string, isRestricted: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isRestricted: !isRestricted,
      });

      Alert.alert(
        'Success',
        `User ${!isRestricted ? 'restricted' : 'unrestricted'} successfully`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleAddUser = async () => {
    if (
      !newUser.email ||
      !newUser.password ||
      !newUser.firstName ||
      !newUser.lastName
    ) {
      console.log(newUser);
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newUser.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      const userData = {
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        createdAt: new Date(),
        isRestricted: false,
        profile: '', // Default profile (can be updated later)
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      Alert.alert('Success', 'User created successfully!');
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'student',
      });
      setShowAddModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} color="#DC2626" />;
      case 'counselor':
        return <Briefcase size={16} color="#7C3AED" />;
      default:
        return <GraduationCap size={16} color="#059669" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#FEE2E2';
      case 'counselor':
        return '#EDE9FE';
      default:
        return '#DCFCE7';
    }
  };

  const getRoleTextColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#DC2626';
      case 'counselor':
        return '#7C3AED';
      default:
        return '#059669';
    }
  };
  console.log(users);
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>
            {users.length} total users •{' '}
            {users.filter((u) => u.isRestricted).length} restricted
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <UserPlus size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* User List */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : users.length > 0 ? (
          <View style={styles.usersContainer}>
            {users.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userAvatar}>
                    {user.imageUrl ? (
                      <Image
                        source={{ uri: user.imageUrl }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Users size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.userName}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getRoleColor(user.role) },
                    ]}
                  >
                    {getRoleIcon(user.role)}
                    <Text
                      style={[
                        styles.roleText,
                        { color: getRoleTextColor(user.role) },
                      ]}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.userMeta}>
                  <Text style={styles.joinDate}>
                    Joined {user.createdAt?.toLocaleDateString()}
                  </Text>
                  {user.isRestricted && (
                    <View style={styles.restrictedBadge}>
                      <UserX size={14} color="#DC2626" />
                      <Text style={styles.restrictedText}>Restricted</Text>
                    </View>
                  )}
                </View>

                {user.role !== 'admin' && (
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        user.isRestricted
                          ? styles.unrestrictButton
                          : styles.restrictButton,
                      ]}
                      onPress={() =>
                        handleRestrictUser(user.id, user.isRestricted || false)
                      }
                    >
                      {user.isRestricted ? (
                        <>
                          <UserCheck size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>
                            Unrestrict
                          </Text>
                        </>
                      ) : (
                        <>
                          <UserX size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Restrict</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Users size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptyText}>
              Users will appear here once they register
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ➕ Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>

            {/* Inputs */}
            {[
              { label: 'First Name', key: 'firstName' },
              { label: 'Last Name', key: 'lastName' },
              { label: 'Email', key: 'email' },
              { label: 'Password', key: 'password' },
            ].map(({ label, key }) => (
              <View key={label} style={styles.inputContainer}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  value={newUser[key as keyof typeof newUser]}
                  onChangeText={(text) =>
                    setNewUser((prev) => ({ ...prev, [key]: text }))
                  }
                  secureTextEntry={label === 'Password'}
                  keyboardType={label === 'Email' ? 'email-address' : 'default'}
                />
              </View>
            ))}

            {/* Role Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleSelector}>
                {['student', 'counselor'].map((roleOption) => (
                  <TouchableOpacity
                    key={roleOption}
                    style={[
                      styles.roleSelectorButton,
                      newUser.role === roleOption &&
                        styles.roleSelectorButtonActive,
                    ]}
                    onPress={() =>
                      setNewUser((prev) => ({
                        ...prev,
                        role: roleOption as any,
                      }))
                    }
                  >
                    {roleOption === 'student' ? (
                      <GraduationCap
                        size={16}
                        color={
                          newUser.role === 'student' ? '#059669' : '#6B7280'
                        }
                      />
                    ) : (
                      <Briefcase
                        size={16}
                        color={
                          newUser.role === 'counselor' ? '#7C3AED' : '#6B7280'
                        }
                      />
                    )}
                    <Text
                      style={[
                        styles.roleSelectorText,
                        newUser.role === roleOption &&
                          styles.roleSelectorTextActive,
                      ]}
                    >
                      {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setNewUser({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    role: 'student',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddUser}
              >
                <Text style={styles.confirmButtonText}>Add User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🧩 Add your existing styles here (unchanged)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#EBF4FF',
    padding: 12,
    borderRadius: 12,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  usersContainer: {
    padding: 16,
    gap: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  joinDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  restrictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  restrictedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  restrictButton: {
    backgroundColor: '#DC2626',
  },
  unrestrictButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleSelectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    gap: 8,
  },
  roleSelectorButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  roleSelectorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  roleSelectorTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
