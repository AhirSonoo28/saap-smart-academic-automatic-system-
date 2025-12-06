
import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { AdminDashboard } from "../components/AdminDashboard";
import AIAssistant from "../components/AIAssistant";
import { FacultyDashboard } from "../components/FacultyDashboard";
import LoginPage from "../components/LoginPage";
import { StudentDashboard } from "../components/StudentDashboard";
import { AppDataProvider } from "../contexts/AppDataContext";
import api from "../services/api";

type UserRole = "student" | "faculty" | "admin" | null;

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  year?: string;
}

export default function Index() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleLogin = (role: string, user: UserData) => {
    setUserRole(role as UserRole);
    setUserData(user);
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserData(null);
    setShowAIAssistant(false);
    // Clear token from API service
    api.clearToken();
  };

  if (!userRole) {
    return (
      <SafeAreaView style={styles.container}>
        <LoginPage onLogin={handleLogin}/>
      </SafeAreaView>
    );
  }

  return (
    <AppDataProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.full}>
          {userRole === "student" && userData && (
            <StudentDashboard
              onLogout={handleLogout}
              onOpenAI={() => setShowAIAssistant(true)}
              studentId={userData.id}
            />
          )}

          {userRole === "faculty" && userData && (
            <FacultyDashboard
              onLogout={handleLogout}
              onOpenAI={() => setShowAIAssistant(true)}
              facultyId={userData.id}
            />
          )}

          {userRole === "admin" && userData && (
            <AdminDashboard
              onLogout={handleLogout}
              onOpenAI={() => setShowAIAssistant(true)}
            />
          )}

          {showAIAssistant && (
            <AIAssistant
              onClose={() => setShowAIAssistant(false)}
              userRole={userRole}
            />
          )}
        </View>
      </SafeAreaView>
    </AppDataProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Tailwind gray-50
    paddingTop: 10,
  },
  full: {
    flex: 1,
  },
});
