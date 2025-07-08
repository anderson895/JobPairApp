import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  addDoc,
  Timestamp,
  query,
  getDocs,
  where,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToCloudinary } from '@/hooks/useUploadCloudinary';

const COMMON_SKILLS = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML/CSS', 'SQL', 'Git',
  'AWS', 'Docker', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift',
  'Kotlin', 'Flutter', 'MongoDB', 'PostgreSQL', 'Redis', 'Kubernetes',
  'Firebase', 'GraphQL', 'Project Management', 'Leadership', 'Communication',
  'Teamwork', 'Problem Solving', 'Critical Thinking', 'Presentation Skills',
  'Data Analysis', 'Marketing', 'Sales', 'Customer Service',
  'Adobe Creative Suite', 'Figma', 'UI/UX Design', 'Writing',
];

type CounselorJobPostFormProps = {
  setViewForm: (show: boolean) => void;
  existingPost?: any;
};

export default function CounselorJobPostForm({ setViewForm, existingPost }: CounselorJobPostFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: existingPost?.title || '',
    company: existingPost?.company || '',
    location: existingPost?.location || '',
    description: existingPost?.description || '',
    requiredSkills: existingPost?.requiredSkills || [],
  });
  const [customSkill, setCustomSkill] = useState('');
  const [image, setImage] = useState<string | null>(existingPost?.imageUrl || null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addSkill = (skill: string) => {
    const formatted = skill.trim().toLowerCase();
    if (formatted && !formData.requiredSkills.includes(formatted)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, formatted],
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s:any) => s !== skill),
    }));
  };

  const handleSubmit = async () => {
    const { title, company, location, description, requiredSkills } = formData;

    if (!title || !company || !location || !description || requiredSkills.length === 0 || !image) {
      return Alert.alert(
        'Missing fields',
        'Please complete all fields, add at least one skill, and upload an image.'
      );
    }

    if (!user) {
      return Alert.alert('Unauthorized', 'You must be logged in.');
    }

    setUploading(true);

    try {
      let imageUrl = image;
      if (!existingPost || (image && image !== existingPost.imageUrl)) {
        imageUrl = await uploadToCloudinary(image);
        if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
          Alert.alert('Image Upload Failed', 'No image URL returned from Cloudinary.');
          return;
        }
      }

      for (const skill of requiredSkills) {
        const q = query(collection(db, 'skills'), where('name', '==', skill));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(collection(db, 'skills'), {
            name: skill,
            createdBy: user.id,
          });
        }
      }

      const jobPostData = {
        ...formData,
        imageUrl,
        counselorId: user.id,
        createdBy: existingPost?.createdBy || {
          uid: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        status: 'pending',
        createdAt: existingPost?.createdAt || Timestamp.now(),
      };

      if (existingPost?.id) {
        await updateDoc(doc(db, 'jobPosts', existingPost.id), jobPostData);
        Alert.alert('Success', 'Job post updated successfully.');
      } else {
        await addDoc(collection(db, 'jobPosts'), jobPostData);
        Alert.alert('Success', 'Job post submitted for admin review.');
      }

      setFormData({
        title: '',
        company: '',
        location: '',
        description: '',
        requiredSkills: [],
      });
      setCustomSkill('');
      setImage(null);
      setViewForm(false);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to submit job post.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.pageTitle}>Post a Job Opportunity</Text>
      <Text style={styles.pageDescription}>
        Fill in the details below to create a job post for students. Your post will be reviewed by the admin before it becomes public.
      </Text>

      <Text style={styles.sectionTitle}>Step 1: Job Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Job Title (e.g., React Developer)"
        value={formData.title}
        onChangeText={(text) => setFormData((p) => ({ ...p, title: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Company Name (e.g., Google)"
        value={formData.company}
        onChangeText={(text) => setFormData((p) => ({ ...p, company: text }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Location (e.g., Remote or Manila)"
        value={formData.location}
        onChangeText={(text) => setFormData((p) => ({ ...p, location: text }))}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Job Description (what the student will be doing)"
        value={formData.description}
        onChangeText={(text) => setFormData((p) => ({ ...p, description: text }))}
        multiline
      />

      <Text style={styles.sectionTitle}>Step 2: Required Skills</Text>
      <TextInput
        style={styles.input}
        placeholder="Add a custom skill and press Enter"
        value={customSkill}
        onChangeText={setCustomSkill}
        onSubmitEditing={() => {
          addSkill(customSkill);
          setCustomSkill('');
        }}
      />
      <View style={styles.skillContainer}>
        {formData.requiredSkills.length === 0 ? (
          <Text style={styles.skillEmpty}>No skills added yet.</Text>
        ) : (
          formData.requiredSkills.map((skill:any) => (
            <TouchableOpacity
              key={skill}
              style={styles.skillTag}
              onPress={() => removeSkill(skill)}
            >
              <Text style={styles.skillText}>{skill} ✕</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <Text style={styles.suggestedTitle}>Suggested Skills</Text>
      <View style={styles.suggestedContainer}>
        {COMMON_SKILLS.map((skill) => (
          <TouchableOpacity
            key={skill}
            style={styles.suggestedTag}
            onPress={() => addSkill(skill)}
          >
            <Text style={styles.suggestedText}>{skill}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Step 3: Upload Company Logo or Banner</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
        <Text style={styles.uploadText}>{image ? 'Change Image' : 'Upload Image'}</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.preview} />}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={uploading}>
        <Text style={styles.buttonText}>
          {uploading ? 'Submitting...' : existingPost ? 'Update Job Post' : 'Submit Job Post for Review'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: '#F9FAFB' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
  pageDescription: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 8, color: '#1F2937' },
  input: {
    backgroundColor: '#fff',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  skillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  skillTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: { color: '#1D4ED8', fontWeight: '500', fontSize: 13 },
  skillEmpty: { fontStyle: 'italic', color: '#9CA3AF' },
  suggestedTitle: { fontWeight: '600', fontSize: 14, marginBottom: 6, color: '#1F2937' },
  suggestedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  suggestedTag: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  suggestedText: { fontSize: 13, color: '#374151' },
  uploadButton: {
    backgroundColor: '#E0F2FE',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadText: { color: '#0369A1', fontWeight: '500' },
  preview: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
  button: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
