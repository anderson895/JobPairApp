import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { JobPost } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const [matchedJobs, setMatchedJobs] = useState<JobPost[]>([]);
  const [suggestedJobs, setSuggestedJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'jobPosts'), (snap) => {
      const allJobs = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JobPost[];

      const approvedJobs = allJobs.filter((job) => job.status === 'approved');

      if (!user?.profile?.skills?.length) {
        setSuggestedJobs(approvedJobs);
        setMatchedJobs([]);
        setLoading(false);
        return;
      }

      const studentSkills = user.profile?.skills.map((s) => s.toLowerCase());

      const matched = approvedJobs.filter((job) =>
        job.requiredSkills?.some((skill: string) =>
          studentSkills.includes(skill.toLowerCase())
        )
      );

      const unmatched = approvedJobs.filter(
        (job) => !matched.find((m) => m.id === job.id)
      );

      setMatchedJobs(matched);
      setSuggestedJobs(unmatched);
      setLoading(false);
    });

    return () => unsubscribe(); // clean up listener
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user?.profile || user.profile.skills.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.centered}>
          <Text style={styles.heading}>Student Dashboard</Text>
          <Text style={styles.title}>
            Please complete your student profile to see matched jobs.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(student)/profile')}
          >
            <Text style={styles.buttonText}>Go to Profile Setup</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderJobCard = (item: JobPost) => (
    <View style={styles.jobCard}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      )}
      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text numberOfLines={2} style={styles.jobDescription}>
        {item.description}
      </Text>
      <Text style={styles.jobStatus}>{item.company}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Welcome, {user.firstName}!</Text>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <LogOut size={18} color="#6B7280" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Matched Jobs</Text>
        {matchedJobs.length === 0 ? (
          <Text style={styles.noJobs}>No matched jobs yet.</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={matchedJobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderJobCard(item)}
            contentContainerStyle={styles.horizontalList}
          />
        )}

        <Text style={styles.sectionTitle}>Suggested Jobs</Text>
        {suggestedJobs.length === 0 ? (
          <Text style={styles.noJobs}>No suggested jobs available.</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={suggestedJobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderJobCard(item)}
            contentContainerStyle={styles.horizontalList}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  logoutText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginVertical: 12,
  },
  noJobs: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 12,
  },
  horizontalList: {
    gap: 12,
    paddingBottom: 16,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    width: 260,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  jobDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  jobStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
