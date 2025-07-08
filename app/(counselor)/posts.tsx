// CounselorJobPostsScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, ArrowLeft, Pencil } from 'lucide-react-native';
import CounselorJobPostForm from '../screens/job_post_screen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CounselorJobPostsScreen() {
  const { user } = useAuth();
  const [viewForm, setViewForm] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobPosts = async () => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'jobPosts'), where('counselorId', '==', user.id));
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setJobPosts(posts);
    setLoading(false);
  };

  useEffect(() => {
    if (!viewForm) fetchJobPosts();
  }, [viewForm]);

  const getStatusChipStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return [styles.statusChip, { backgroundColor: '#DCFCE7', color: '#166534' }];
      case 'pending':
        return [styles.statusChip, { backgroundColor: '#FEF9C3', color: '#92400E' }];
      case 'rejected':
        return [styles.statusChip, { backgroundColor: '#FECACA', color: '#991B1B' }];
      default:
        return [styles.statusChip, { backgroundColor: '#E5E7EB', color: '#374151' }];
    }
  };

  if (viewForm) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => {
                setViewForm(false);
                setEditingPost(null);
              }}
            >
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {editingPost ? 'Edit Job Post' : 'Create Job Post'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <CounselorJobPostForm
            setViewForm={setViewForm}
            existingPost={editingPost}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>My Job Posts</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingPost(null);
              setViewForm(true);
            }}
            style={styles.addButton}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : jobPosts.length === 0 ? (
          <Text style={styles.emptyText}>No job posts yet. Tap + to create one.</Text>
        ) : (
          <FlatList
            data={jobPosts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (item.status !== 'approved' && item.status !== 'rejected') {
                    setEditingPost(item);
                    setViewForm(true);
                  }
                }}
                disabled={item.status === 'approved' || item.status === 'rejected'}
              >
                <View
                  style={[
                    styles.postCard,
                    (item.status === 'approved' || item.status === 'rejected') &&
                      styles.disabledCard,
                  ]}
                >
                  {item.imageUrl && (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.imageThumbnail}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.cardHeader}>
                    <Text style={styles.postTitle}>{item.title}</Text>
                    {item.status !== 'approved' && item.status !== 'rejected' && (
                      <Pencil size={16} color="#2563EB" />
                    )}
                  </View>
                  <View style={styles.statusWrapper}>
                    <Text style={getStatusChipStyle(item.status)}>{item.status}</Text>
                  </View>

                  {item.status === 'rejected' && item.rejectionReason && (
                    <Text style={styles.rejectionText}>
                      Reason: {item.rejectionReason}
                    </Text>
                  )}

                  <Text style={styles.postSkills}>
                    Skills: {item.requiredSkills?.join(', ') || 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 8,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledCard: {
    opacity: 0.7,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  postSkills: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusWrapper: {
    marginTop: 6,
    marginBottom: 4,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 13,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  imageThumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  rejectionText: {
    fontSize: 13,
    color: '#B91C1C', // red-700
    fontStyle: 'italic',
    marginBottom: 4,
  },
});
