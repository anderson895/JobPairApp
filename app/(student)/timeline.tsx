import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { JobPost } from '@/types';
import { Briefcase, MapPin, Clock, Users, LogOut } from 'lucide-react-native';

export default function StudentTimeline() {
  const { user, signOut } = useAuth();
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.profile?.skills?.length) return;

    const q = query(
      collection(db, 'jobPosts'),
      where('status', '==', 'approved'),
      orderBy('approvedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate(),
      })) as JobPost[];

      const studentSkills = user.profile?.skills.map((skill) =>
        skill.toLowerCase()
      );
      const matchingPosts = posts.filter((post) =>
        post.requiredSkills.some((skill) => studentSkills?.includes(skill))
      );

      setJobPosts(matchingPosts);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.profile?.skills]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getMatchingSkills = (requiredSkills: string[]) => {
      const studentSkills = user?.profile?.skills.map((skill) =>
        skill.toLowerCase()
      );
    return requiredSkills.filter((skill) =>
      studentSkills?.includes(skill.toLowerCase())
    );
  };

  const getMatchPercentage = (requiredSkills: string[]) => {
    const matching = getMatchingSkills(requiredSkills).length;
    return Math.round((matching / requiredSkills.length) * 100);
  };

  if (!user?.profile?.skills?.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome, {user?.firstName}!</Text>
            <Text style={styles.subtitle}>
              Complete your profile to see job opportunities
            </Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <LogOut size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <Users size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Complete Your Profile</Text>
          <Text style={styles.emptyText}>
            Add your skills and information to see relevant job opportunities
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {user?.firstName}!</Text>
          <Text style={styles.subtitle}>
            {jobPosts.length} job{jobPosts.length !== 1 ? 's' : ''} match your
            skills
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <LogOut size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading opportunities...</Text>
          </View>
        ) : jobPosts.length > 0 ? (
          <View style={styles.postsContainer}>
            {jobPosts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postTitleContainer}>
                    <Briefcase size={20} color="#2563EB" />
                    <Text style={styles.postTitle}>{post.title}</Text>
                  </View>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>
                      {getMatchPercentage(post.requiredSkills)}% match
                    </Text>
                  </View>
                </View>

                <Text style={styles.companyName}>{post.company}</Text>

                <View style={styles.postMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.metaText}>{post.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.metaText}>
                      {post.approvedAt?.toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.description} numberOfLines={3}>
                  {post.description}
                </Text>

                <View style={styles.skillsContainer}>
                  <Text style={styles.skillsLabel}>Your matching skills:</Text>
                  <View style={styles.skillsRow}>
                    {getMatchingSkills(post.requiredSkills).map((skill) => (
                      <View key={skill} style={styles.matchingSkill}>
                        <Text style={styles.matchingSkillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Text style={styles.postedBy}>
                  Posted by {post.counselorName}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Briefcase size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Matching Jobs</Text>
            <Text style={styles.emptyText}>
              No approved job posts match your current skills. Check back later
              for new opportunities!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
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
  postsContainer: {
    padding: 16,
    gap: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  matchBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  skillsContainer: {
    marginBottom: 12,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchingSkill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchingSkillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  postedBy: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
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
});
