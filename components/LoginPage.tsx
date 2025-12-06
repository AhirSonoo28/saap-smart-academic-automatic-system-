import {
    FontAwesome5,
    Ionicons,
    MaterialCommunityIcons
} from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import api from '../services/api';

interface LoginPageProps {
  onLogin: (role: string, userData: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setShowLoginForm(false);
  };

  const handleContinue = () => {
    if (selectedRole) {
      setShowLoginForm(true);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login(loginEmail, loginPassword, selectedRole!);
      onLogin(selectedRole!, response.user);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'Access notes, assignments and AI study help',
      icon: "user-graduate",
      type: "FontAwesome5",
      color: '#3B82F6'
    },
    {
      id: 'faculty',
      title: 'Faculty',
      description: 'Automate classes, attendance, tasks',
      icon: "account-tie",
      type: "MaterialCommunityIcons",
      color: '#10B981'
    },
    {
      id: 'admin',
      title: 'Admin',
      description: 'Manage system, permissions & analytics',
      icon: "shield-check-outline",
      type: "MaterialCommunityIcons",
      color: '#F59E0B'
    }
  ];

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="school" size={50} color="white" />
          </View>

          <Text style={styles.title}>SAAP</Text>
          <Text style={styles.subtitle}>Smart Academic Automation Platform</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleBox}>
          <Text style={styles.roleHeader}>Select Your Role</Text>

          <View style={styles.roleGrid}>
            {roles.map((role) => (
              <Pressable
                key={role.id}
                onPress={() => setSelectedRole(role.id)}
                style={[
                  styles.roleCard,
                  selectedRole === role.id && styles.roleCardSelected
                ]}
              >
                <View style={[styles.roleIcon, { backgroundColor: role.color }]}>
                  {role.type === "FontAwesome5" && (
                    <FontAwesome5 name={role.icon} size={28} color="white" />
                  )}
                  {role.type === "MaterialCommunityIcons" && (
                    <MaterialCommunityIcons name={role.icon as any} size={30} color="white" />
                  )}
                </View>

                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </Pressable>
            ))}
          </View>

          {!showLoginForm && (
            <Pressable
              onPress={handleContinue}
              disabled={!selectedRole}
              style={[
                styles.button,
                selectedRole ? styles.buttonActive : styles.buttonDisabled
              ]}
            >
              <Text style={styles.buttonText}>
                Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.title : 'User'}
              </Text>
            </Pressable>
          )}

          {/* Login Form */}
          {showLoginForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Login</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={[styles.button, styles.buttonActive, isLoading && styles.buttonDisabled]}
              >
                <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowLoginForm(false);
                  setSelectedRole(null);
                }}
                style={styles.backButton}
              >
                <Text style={styles.backText}>← Back to Role Selection</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          Automating academic workflows • Zero missed deadlines • Instant AI support
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
    backgroundColor: '#EEF2FF',
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconBox: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 18,
    color: '#4B5563',
    marginTop: -4
  },
  // Roles Box
  roleBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleHeader: {
    textAlign: 'center',
    fontSize: 22,
    marginBottom: 20,
    color: '#111827',
    fontWeight: '600',
  },

  roleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },

  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  roleDescription: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
  },

  // Continue Button
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 5,
  },
  buttonActive: {
    backgroundColor: '#2563EB',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },

  footer: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6B7280',
    fontSize: 13,
  },
  formContainer: {
    marginTop: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  linkButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  linkText: {
    color: '#2563EB',
    textAlign: 'center',
    fontSize: 14,
  },
  backButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  backText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 14,
  }
});
