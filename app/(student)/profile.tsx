import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  doc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProfiling } from '@/types';
import { User, Plus, X, Save } from 'lucide-react-native';
import { router } from 'expo-router';

const COMMON_SKILLS = [
  'JavaScript',
  'Python',
  'Java',
  'React',
  'Node.js',
  'HTML/CSS',
  'SQL',
  'Git',
  'AWS',
  'Docker',
  'TypeScript',
  'C++',
  'C#',
  'PHP',
  'Ruby',
  'Go',
  'Swift',
  'Kotlin',
  'Flutter',
  'MongoDB',
  'PostgreSQL',
  'Redis',
  'Kubernetes',
  'Firebase',
  'GraphQL',
  'Project Management',
  'Leadership',
  'Communication',
  'Teamwork',
  'Problem Solving',
  'Critical Thinking',
  'Presentation Skills',
  'Data Analysis',
  'Marketing',
  'Sales',
  'Customer Service',
  'Adobe Creative Suite',
  'Figma',
  'UI/UX Design',
  'Writing',
];

export default function StudentProfile() {
  const { user } = useAuth();
  const [availableSkills, setAvailableSkills] =
    useState<string[]>(COMMON_SKILLS);
  const [profile, setProfile] = useState<StudentProfiling>({
    skills: [],
    phone: '',
    major: '',
    graduationYear: new Date().getFullYear(),
    gpa: 0,
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [customSkill, setCustomSkill] = useState('');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const jobSnap = await getDocs(collection(db, 'jobPosts'));
        const dynamicSkillsSet = new Set(
          COMMON_SKILLS.map((s) => s.toLowerCase())
        );

        jobSnap.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.requiredSkills)) {
            data.requiredSkills.forEach((skill: string) => {
              const skillLower = skill.toLowerCase();
              if (!dynamicSkillsSet.has(skillLower)) {
                dynamicSkillsSet.add(skillLower);
              }
            });
          }
        });

        // Capitalize first letter for display (optional)
        const mergedSkills = Array.from(dynamicSkillsSet).map(
          (s) => s.charAt(0).toUpperCase() + s.slice(1)
        );

        setAvailableSkills(mergedSkills.sort());
      } catch (error) {
        console.error('Failed to fetch dynamic skills:', error);
      }
    };

    fetchSkills();
  }, []);

  useEffect(() => {
    if (user?.profile) {
      setProfile(user.profile);
    }
  }, [user]);

  const handleSave = async () => {
    if (profile.skills.length === 0) {
      Alert.alert('Error', 'Please add at least one skill');
      return;
    }

    setLoading(true);
    try {
      const updatedProfile = {
        ...profile,
        completedAt: new Date(),
      };

      await updateDoc(doc(db, 'users', user!.id), {
        profile: updatedProfile,
      });
      router.replace('/(student)/dashboard');
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (skill: string) => {
    if (!profile.skills.includes(skill)) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !profile.skills.includes(customSkill.trim())) {
      addSkill(customSkill.trim());
      setCustomSkill('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <User size={24} color="#2563EB" />
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={(text) =>
                setProfile((prev) => ({ ...prev, phone: text }))
              }
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Major</Text>
            <TextInput
              style={styles.input}
              value={profile.major}
              onChangeText={(text) =>
                setProfile((prev) => ({ ...prev, major: text }))
              }
              placeholder="Enter your major"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Graduation Year</Text>
              <TextInput
                style={styles.input}
                value={profile.graduationYear?.toString()}
                onChangeText={(text) =>
                  setProfile((prev) => ({
                    ...prev,
                    graduationYear: parseInt(text) || new Date().getFullYear(),
                  }))
                }
                placeholder="2024"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>GPA</Text>
              <TextInput
                style={styles.input}
                value={profile.gpa?.toString()}
                onChangeText={(text) =>
                  setProfile((prev) => ({
                    ...prev,
                    gpa: parseFloat(text) || 0,
                  }))
                }
                placeholder="3.5"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.bio}
              onChangeText={(text) =>
                setProfile((prev) => ({ ...prev, bio: text }))
              }
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills *</Text>

          {profile.skills.length > 0 && (
            <View style={styles.selectedSkills}>
              {profile.skills.map((skill) => (
                <View key={skill} style={styles.selectedSkill}>
                  <Text style={styles.selectedSkillText}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(skill)}>
                    <X size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.addSkillContainer}>
            <TextInput
              style={styles.skillInput}
              value={customSkill}
              onChangeText={setCustomSkill}
              placeholder="Add a custom skill"
              onSubmitEditing={addCustomSkill}
            />
            <TouchableOpacity style={styles.addButton} onPress={addCustomSkill}>
              <Plus size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>

          <Text style={styles.suggestedLabel}>Suggested Skills:</Text>
          <View style={styles.suggestedSkills}>
            {COMMON_SKILLS.filter(
              (skill) => !profile.skills.includes(skill)
            ).map((skill) => (
              <TouchableOpacity
                key={skill}
                style={styles.suggestedSkill}
                onPress={() => addSkill(skill)}
              >
                <Text style={styles.suggestedSkillText}>{skill}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectedSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectedSkill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  selectedSkillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  addSkillContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  suggestedSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedSkill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestedSkillText: {
    fontSize: 14,
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
