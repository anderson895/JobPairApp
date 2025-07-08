import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CounselorDashboard() {
  const { user } = useAuth();
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, 'jobPosts'),
      where('counselorId', '==', user.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setJobPosts(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading job posts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Clean up the listener when the component unmounts
  }, []);

  const statusCount = (status: string) =>
    jobPosts.filter((p) => p.status === status).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Counselor Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              System overview and statistics
            </Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <LogOut size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{jobPosts.length}</Text>
                <Text style={styles.statLabel}>Total Posts</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{statusCount('pending')}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{statusCount('approved')}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{statusCount('rejected')}</Text>
                <Text style={styles.statLabel}>Rejected</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/(counselor)/posts')}
            >
              <Text style={styles.buttonText}>Create New Job Post</Text>
            </TouchableOpacity>

            <Text style={styles.listTitle}>Your Job Posts</Text>
            <FlatList
              data={jobPosts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.postCard}>
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postStatus}>Status: {item.status}</Text>
                </View>
              )}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F9FAFB', flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  statLabel: {
    fontSize: 12,
    color: '#1E3A8A',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1F2937',
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  postTitle: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  postStatus: {
    color: '#6B7280',
    fontSize: 13,
  },
});
