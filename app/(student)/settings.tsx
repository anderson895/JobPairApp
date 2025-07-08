import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateEmail, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import RoleHeader from '@/components/roleHeader';
import { uploadToCloudinary } from '@/hooks/useUploadCloudinary';
import { User } from 'lucide-react-native';

export default function StudentProfileScreen() {
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setPhoneNumber(data.phoneNumber ?? '');
        setProfileImage(data.imageUrl ?? null);
      }
      setLoading(false);
    };

    fetchUserInfo();
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setLoading(true);
      if (!user) return Alert.alert('Error', 'User not found.');
      try {
        const cloudUrl = await uploadToCloudinary(selectedAsset.uri);
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { imageUrl: cloudUrl });
        setProfileImage(cloudUrl);
        Alert.alert('Success', 'Profile picture updated.');
      } catch (err) {
        Alert.alert('Error', 'Failed to upload profile picture.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!user) return;

    if (!firstName || !lastName || !email) {
      Alert.alert('Error', 'First name, last name, and email are required.');
      return;
    }

    if (newPassword && newPassword?.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setUpdating(true);
    try {

      if (email !== user.email) {
        await updateEmail(user.authUser, email);
      }

      // Update password if provided
      if (newPassword) {
        await updatePassword(user.authUser, newPassword);
      }

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.id), {
        firstName,
        lastName,
        email,
        phoneNumber,
      });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setUpdating(false);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.container}>
        <RoleHeader
          title="Student Profile"
          subtitle="Manage your information"
          onLogout={signOut}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.form}>
              <View style={styles.avatarWrapper}>
                <TouchableOpacity onPress={handlePickImage}>
                  {typeof profileImage === 'string' &&
                  profileImage?.startsWith('http') ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImage}
                      onError={() => setProfileImage(null)}
                    />
                  ) : (
                    <View style={styles.avatar}>
                      <User size={48} color="#2563EB" />
                    </View>
                  )}
                </TouchableOpacity>
                {loading && (
                  <ActivityIndicator style={{ marginTop: 8 }} color="#2563EB" />
                )}
              </View>

              <Text style={styles.label}>First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                placeholder="Enter first name"
              />

              <Text style={styles.label}>Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                placeholder="Enter last name"
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email"
              />

              <Text style={styles.label}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                secureTextEntry
                placeholder="Leave blank to keep current password"
              />

              <TouchableOpacity
                style={[styles.button, updating && { opacity: 0.7 }]}
                onPress={handleUpdate}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Update Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#EBF4FF',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    color: '#888',
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
