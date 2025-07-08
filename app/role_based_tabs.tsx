// app/RoleBasedTabs.tsx
import { useAuth } from '@/contexts/AuthContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Briefcase,
  LayoutDashboard,
  User
} from 'lucide-react-native';
import React from 'react';
import AdminDashboard from './(admin)/dashboard';
import AdminPosts from './(admin)/posts';
import AdminUsers from './(admin)/users';
import CounselorPosts from './(counselor)/posts';
import CounselorProfile from './(counselor)/profile';
import StudentProfile from './(student)/profile';
import StudentTimeline from './(student)/timeline';

const Tab = createBottomTabNavigator();

export default function RoleBasedTabs() {
  const { user } = useAuth();
  const role = user?.role;

  if (!role) return null;

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      {role === 'admin' && (
        <>
          <Tab.Screen
            name="AdminDashboard"
            component={AdminDashboard}
            options={{
              tabBarIcon: ({ color, size }) => (
                <LayoutDashboard color={color} size={size} />
              ),
              title: 'Dashboard',
            }}
          />
          <Tab.Screen
            name="AdminPosts"
            component={AdminPosts}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Briefcase color={color} size={size} />
              ),
              title: 'Posts',
            }}
          />
          <Tab.Screen
            name="AdminUsers"
            component={AdminUsers}
            options={{
              tabBarIcon: ({ color, size }) => (
                <User color={color} size={size} />
              ),
              title: 'Users',
            }}
          />
        </>
      )}

      {role === 'counselor' && (
        <>
          <Tab.Screen
            name="CounselorPosts"
            component={CounselorPosts}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Briefcase color={color} size={size} />
              ),
              title: 'My Posts',
            }}
          />
          <Tab.Screen
            name="CounselorProfile"
            component={CounselorProfile}
            options={{
              tabBarIcon: ({ color, size }) => (
                <User color={color} size={size} />
              ),
              title: 'Profile',
            }}
          />
        </>
      )}

      {role === 'student' && (
        <>
          <Tab.Screen
            name="StudentTimeline"
            component={StudentTimeline}
            options={{
              tabBarIcon: ({ color, size }) => (
                <LayoutDashboard color={color} size={size} />
              ),
              title: 'Timeline',
            }}
          />
          <Tab.Screen
            name="StudentProfile"
            component={StudentProfile}
            options={{
              tabBarIcon: ({ color, size }) => (
                <User color={color} size={size} />
              ),
              title: 'Profile',
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}
