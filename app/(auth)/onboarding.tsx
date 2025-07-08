import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleSelect = async (role: 'student' | 'admin') => {
    await AsyncStorage.setItem('seenOnboarding', 'true');
    router.replace({ pathname: '/(auth)/login', params: { role } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who are you?</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelect('student')}
      >
        <Text style={styles.buttonText}>I'm a Student</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handleSelect('admin')}
      >
        <Text style={styles.buttonText}>I'm an Admin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginVertical: 10,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
