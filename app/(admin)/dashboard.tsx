import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  Users,
  Briefcase,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import RoleHeader from '@/components/roleHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCounselors: 0,
    totalPosts: 0,
    pendingPosts: 0,
    approvedPosts: 0,
    rejectedPosts: 0,
  });

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map((doc) => doc.data());
      const totalUsers = users.length;
      const totalStudents = users.filter((u) => u.role === 'student').length;
      const totalCounselors = users.filter(
        (u) => u.role === 'counselor'
      ).length;

      setStats((prev) => ({
        ...prev,
        totalUsers,
        totalStudents,
        totalCounselors,
      }));
    });

    const unsubscribePosts = onSnapshot(
      collection(db, 'jobPosts'),
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => doc.data());
        const totalPosts = posts.length;
        const pendingPosts = posts.filter((p) => p.status === 'pending').length;
        const approvedPosts = posts.filter(
          (p) => p.status === 'approved'
        ).length;
        const rejectedPosts = posts.filter(
          (p) => p.status === 'rejected'
        ).length;

        setStats((prev) => ({
          ...prev,
          totalPosts,
          pendingPosts,
          approvedPosts,
          rejectedPosts,
        }));
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribePosts();
    };
  }, []);

  const StatCard = ({
    icon,
    title,
    value,
    color,
  }: {
    icon: React.ReactNode;
    title: string;
    value: number;
    color: string;
  }) => (
    <View style={[styles.statCard, { width: isTablet ? '30%' : '48%' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.container}>
        <RoleHeader
          title="Admin Dashboard"
          subtitle="System overview and statistics"
          onLogout={signOut}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Statistics</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon={<Users size={24} color="#2563EB" />}
                title="Total Users"
                value={stats.totalUsers}
                color="#2563EB"
              />
              <StatCard
                icon={<Users size={24} color="#059669" />}
                title="Students"
                value={stats.totalStudents}
                color="#059669"
              />
              <StatCard
                icon={<Users size={24} color="#7C3AED" />}
                title="Counselors"
                value={stats.totalCounselors}
                color="#7C3AED"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Post Statistics</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon={<Briefcase size={24} color="#374151" />}
                title="Total Posts"
                value={stats.totalPosts}
                color="#374151"
              />
              <StatCard
                icon={<AlertCircle size={24} color="#D97706" />}
                title="Pending Review"
                value={stats.pendingPosts}
                color="#D97706"
              />
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                icon={<CheckCircle size={24} color="#059669" />}
                title="Approved"
                value={stats.approvedPosts}
                color="#059669"
              />
              <StatCard
                icon={<XCircle size={24} color="#DC2626" />}
                title="Rejected"
                value={stats.rejectedPosts}
                color="#DC2626"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                onPress={() => router.replace('/(admin)/posts')}
                style={styles.actionButton}
              >
                <AlertCircle size={20} color="#D97706" />
                <Text style={styles.actionButtonText}>
                  Review Pending Posts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.replace('/(admin)/users')}
                style={styles.actionButton}
              >
                <Users size={20} color="#2563EB" />
                <Text style={styles.actionButtonText}>Manage Users</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.adminBadge}>
            <Shield size={20} color="#DC2626" />
            <Text style={styles.adminBadgeText}>Admin Access</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

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
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    minWidth: 160,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickActions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  adminBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 20,
  },
  adminBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
});
