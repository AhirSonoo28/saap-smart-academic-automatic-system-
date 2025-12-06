import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppData } from "../contexts/AppDataContext";
import { AdminEvents } from "./dashboard/AdminEvents";
import { AdminStats } from "./dashboard/AdminStats";
import { StudentsByYear } from "./dashboard/StudentsByYear";
import { EmptyState } from "./shared/EmptyState";
import { NotificationModal } from "./shared/NotificationModal";

interface AdminDashboardProps {
  onLogout: () => void;
  onOpenAI: () => void;
}

export function AdminDashboard({ onLogout, onOpenAI }: AdminDashboardProps) {
  const {
    courses,
    teachers,
    students,
    createCourse,
    updateCourse,
    createTeacher,
    updateTeacher,
    createStudent,
    assignCourseToTeacher,
    assignStudentToCourse,
    createTimetable,
    notifications,
    createNotification,
    deleteNotification,
    clearAllNotifications,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "events" | "messages" | "management"
  >("dashboard");
  const [showCreateModal, setShowCreateModal] = useState<
    "course" | "teacher" | "student" | "timetable" | null
  >(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Form states
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    teacherId: "",
    year: "Year 1",
  });
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    department: "",
  });
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    year: "Year 1",
  });
  const [timetableForm, setTimetableForm] = useState({
    courseId: "",
    day: "Monday",
    time: "",
    type: "Lecture",
    room: "",
  });
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({
    recipient: "all",
    title: "",
    message: "",
  });
  const [showAssignCoursesModal, setShowAssignCoursesModal] = useState(false);
  const [selectedYearForAssignment, setSelectedYearForAssignment] = useState<string>("");
  const [selectedCoursesForAssignment, setSelectedCoursesForAssignment] = useState<string[]>([]);

  const handleCreateCourse = async () => {
    if (!courseForm.code || !courseForm.name || !courseForm.teacherId) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    const teacher = teachers.find((t) => t.id === courseForm.teacherId);
    try {
      if (editingCourse) {
        // Update existing course
        await updateCourse(editingCourse, {
          code: courseForm.code,
          name: courseForm.name,
          teacherId: courseForm.teacherId,
          teacherName: teacher?.name || "",
          year: courseForm.year,
        });
        setEditingCourse(null);
        Alert.alert("Success", "Course updated successfully!");
      } else {
        // Create new course
        await createCourse({
          code: courseForm.code,
          name: courseForm.name,
          teacherId: courseForm.teacherId,
          teacherName: teacher?.name || "",
          year: courseForm.year,
          studentCount: 0,
        });
        Alert.alert("Success", "Course created successfully!");
      }
      setCourseForm({ code: "", name: "", teacherId: "", year: "Year 1" });
      setShowCreateModal(null);
    } catch (error) {
      // Error is already handled in the context
    }
  };

  const handleCreateTeacher = async () => {
    if (!teacherForm.name || !teacherForm.email || !teacherForm.department) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    try {
      if (editingTeacher) {
        // Update existing teacher
        await updateTeacher(editingTeacher, teacherForm);
        setEditingTeacher(null);
        Alert.alert("Success", "Teacher updated successfully!");
      } else {
        // Create new teacher
        await createTeacher(teacherForm);
        Alert.alert("Success", "Teacher account created successfully! Password has been sent to their email.");
      }
      setTeacherForm({ name: "", email: "", department: "" });
      setShowCreateModal(null);
    } catch (error) {
      // Error is already handled in the context
    }
  };

  const handleCreateStudent = async () => {
    if (!studentForm.name || !studentForm.email) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    try {
      await createStudent(studentForm);
      setStudentForm({ name: "", email: "", year: "Year 1" });
      setShowCreateModal(null);
      Alert.alert("Success", "Student account created successfully! Password has been sent to their email.");
    } catch (error) {
      // Error is already handled in the context
    }
  };

  const handleCreateTimetable = async () => {
    if (!timetableForm.courseId || !timetableForm.time || !timetableForm.room) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    try {
      await createTimetable(timetableForm);
      setTimetableForm({ courseId: "", day: "Monday", time: "", type: "Lecture", room: "" });
      setShowCreateModal(null);
      Alert.alert("Success", "Timetable created successfully!");
    } catch (error) {
      // Error is already handled in the context
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.iconBtn}>
            <View style={styles.notificationBadge}>
              <Feather name="bell" size={22} color="#2563eb" />
              {notifications.length > 0 && (
                <View style={styles.notificationBadgeDot}>
                  <Text style={styles.notificationCount}>{notifications.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color="#fff" />
        </TouchableOpacity>
        </View>
      </View>

      {/* Top Tabs - Main sections */}
      <View style={styles.topTabRow}>
        {["dashboard", "management"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as any)}
            style={[styles.topTabButton, activeTab === tab && styles.topActiveTab]}
          >
            <Text style={[styles.topTabText, activeTab === tab && styles.topActiveTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ----- DASHBOARD TAB ----- */}
      {activeTab === "dashboard" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview Statistics</Text>
          <AdminStats
            studentsCount={students.length}
            teachersCount={teachers.length}
            coursesCount={courses.length}
          />
        </View>
      )}

      {/* ----- EVENTS TAB ----- */}
      {activeTab === "events" && (
        <View style={styles.section}>
          <AdminEvents onCreateEvent={() => {}} />
        </View>
      )}

      {/* ----- MANAGEMENT TAB ----- */}
      {activeTab === "management" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Management</Text>

          {/* Quick Actions */}
          <View style={styles.managementGrid}>
            <TouchableOpacity
              style={styles.managementCard}
              onPress={() => setShowCreateModal("course")}
            >
              <Feather name="book" size={28} color="#3b82f6" />
              <Text style={styles.managementTitle}>Create Course</Text>
              <Text style={styles.managementSubtitle}>Add new courses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.managementCard}
              onPress={() => {
                setEditingTeacher(null);
                setTeacherForm({ name: "", email: "", department: "" });
                setShowCreateModal("teacher");
              }}
            >
              <Feather name="user-plus" size={28} color="#10b981" />
              <Text style={styles.managementTitle}>Create Teacher</Text>
              <Text style={styles.managementSubtitle}>Add teacher accounts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.managementCard}
              onPress={() => setShowCreateModal("student")}
            >
              <Feather name="user" size={28} color="#f59e0b" />
              <Text style={styles.managementTitle}>Create Student</Text>
              <Text style={styles.managementSubtitle}>Add student accounts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.managementCard}
              onPress={() => setShowCreateModal("timetable")}
            >
              <Feather name="calendar" size={28} color="#8b5cf6" />
              <Text style={styles.managementTitle}>Create Timetable</Text>
              <Text style={styles.managementSubtitle}>Schedule classes</Text>
            </TouchableOpacity>
          </View>

          {/* Courses Management */}
          <Text style={styles.sectionTitle}>Courses ({courses.length})</Text>
          {courses.length === 0 ? (
            <EmptyState
              icon="book"
              title="No Courses"
              message="Create your first course to get started."
            />
          ) : (
            courses.map((course) => (
            <View key={course.id} style={styles.managementItem}>
              <View style={styles.managementItemHeader}>
                <View>
                  <Text style={styles.managementItemTitle}>{course.name}</Text>
                  <Text style={styles.managementItemCode}>{course.code} • {course.year}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.editBtn}
                  onPress={() => {
                    setEditingCourse(course.id);
                    setCourseForm({
                      code: course.code,
                      name: course.name,
                      teacherId: course.teacherId,
                      year: course.year,
                    });
                    setShowCreateModal("course");
                  }}
                >
                  <Feather name="edit-2" size={16} color="#2563eb" />
                </TouchableOpacity>
              </View>
              <View style={styles.managementItemDetails}>
                <Text style={styles.managementItemDetail}>
                  <Feather name="user-check" size={14} color="#6b7280" /> {course.teacherName}
                </Text>
                <Text style={styles.managementItemDetail}>
                  <Feather name="users" size={14} color="#6b7280" /> {course.studentCount} students
                </Text>
              </View>
            </View>
            ))
          )}

          {/* Teachers Management */}
          <Text style={styles.sectionTitle}>Teachers ({teachers.length})</Text>
          {teachers.length === 0 ? (
            <EmptyState
              icon="user-check"
              title="No Teachers"
              message="Create your first teacher account to get started."
            />
          ) : (
            teachers.map((teacher) => (
            <View key={teacher.id} style={styles.managementItem}>
              <View style={styles.managementItemHeader}>
                <View>
                  <Text style={styles.managementItemTitle}>{teacher.name}</Text>
                  <Text style={styles.managementItemCode}>{teacher.email}</Text>
              </View>
                <TouchableOpacity 
                  style={styles.editBtn}
                  onPress={() => {
                    setEditingTeacher(teacher.id);
                    setTeacherForm({
                      name: teacher.name,
                      email: teacher.email,
                      department: teacher.department,
                    });
                    setShowCreateModal("teacher");
                  }}
                >
                  <Feather name="edit-2" size={16} color="#2563eb" />
                </TouchableOpacity>
            </View>
              <View style={styles.managementItemDetails}>
                <Text style={styles.managementItemDetail}>
                  <Feather name="book" size={14} color="#6b7280" /> {teacher.courseIds.length} courses
                </Text>
                <Text style={styles.managementItemDetail}>
                  <Feather name="layers" size={14} color="#6b7280" /> {teacher.department}
                </Text>
        </View>
            </View>
            ))
          )}

          {/* Students by Year */}
          <StudentsByYear
            students={students}
            courses={courses}
            onAssignCourses={(year) => {
              setSelectedYearForAssignment(year);
              setSelectedCoursesForAssignment([]);
              setShowAssignCoursesModal(true);
            }}
          />
        </View>
      )}

      {/* Create Modals */}
      <Modal
        visible={showCreateModal === "course"}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>
              {editingCourse ? "Edit Course" : "Create Course"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Course Code (e.g., CS301)"
              value={courseForm.code}
              onChangeText={(text) => setCourseForm({ ...courseForm, code: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Course Name"
              value={courseForm.name}
              onChangeText={(text) => setCourseForm({ ...courseForm, name: text })}
            />
            <Text style={styles.inputLabel}>Year</Text>
            <View style={styles.yearButtons}>
              {["Year 1", "Year 2", "Year 3", "Year 4"].map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearButton,
                    courseForm.year === year && styles.yearButtonActive,
                  ]}
                  onPress={() => setCourseForm({ ...courseForm, year })}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      courseForm.year === year && styles.yearButtonTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Select Teacher</Text>
            <ScrollView style={styles.selectList}>
              {teachers.map((teacher) => (
                <TouchableOpacity
                  key={teacher.id}
                  style={[
                    styles.selectItem,
                    courseForm.teacherId === teacher.id && styles.selectItemActive,
                  ]}
                  onPress={() => setCourseForm({ ...courseForm, teacherId: teacher.id })}
                >
                  <Text>{teacher.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCreateModal(null)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleCreateCourse}
              >
                <Text style={styles.modalButtonTextSave}>
                  {editingCourse ? "Update" : "Create"}
                </Text>
              </TouchableOpacity>
        </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showCreateModal === "teacher"}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>
              {editingTeacher ? "Edit Teacher" : "Create Teacher"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Teacher Name"
              value={teacherForm.name}
              onChangeText={(text) => setTeacherForm({ ...teacherForm, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={teacherForm.email}
              onChangeText={(text) => setTeacherForm({ ...teacherForm, email: text })}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Department"
              value={teacherForm.department}
              onChangeText={(text) => setTeacherForm({ ...teacherForm, department: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCreateModal(null)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleCreateTeacher}
              >
                <Text style={styles.modalButtonTextSave}>
                  {editingTeacher ? "Update" : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showCreateModal === "student"}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Create Student</Text>
            <TextInput
              style={styles.input}
              placeholder="Student Name"
              value={studentForm.name}
              onChangeText={(text) => setStudentForm({ ...studentForm, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={studentForm.email}
              onChangeText={(text) => setStudentForm({ ...studentForm, email: text })}
              keyboardType="email-address"
            />
            <Text style={styles.inputLabel}>Year</Text>
            <View style={styles.yearButtons}>
              {["Year 1", "Year 2", "Year 3", "Year 4"].map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearButton,
                    studentForm.year === year && styles.yearButtonActive,
                  ]}
                  onPress={() => setStudentForm({ ...studentForm, year })}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      studentForm.year === year && styles.yearButtonTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCreateModal(null)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleCreateStudent}
              >
                <Text style={styles.modalButtonTextSave}>Create</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showCreateModal === "timetable"}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Create Timetable</Text>
            <Text style={styles.inputLabel}>Select Course</Text>
            <ScrollView style={styles.selectList}>
              {courses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.selectItem,
                    timetableForm.courseId === course.id && styles.selectItemActive,
                  ]}
                  onPress={() => setTimetableForm({ ...timetableForm, courseId: course.id })}
                >
                  <Text>{course.code} - {course.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Time (e.g., 09:00 AM)"
              value={timetableForm.time}
              onChangeText={(text) => setTimetableForm({ ...timetableForm, time: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Room"
              value={timetableForm.room}
              onChangeText={(text) => setTimetableForm({ ...timetableForm, room: text })}
            />
            <Text style={styles.inputLabel}>Day</Text>
            <View style={styles.yearButtons}>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.yearButton,
                    timetableForm.day === day && styles.yearButtonActive,
                  ]}
                  onPress={() => setTimetableForm({ ...timetableForm, day })}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      timetableForm.day === day && styles.yearButtonTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.yearButtons}>
              {["Lecture", "Lab", "Tutorial", "Seminar"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.yearButton,
                    timetableForm.type === type && styles.yearButtonActive,
                  ]}
                  onPress={() => setTimetableForm({ ...timetableForm, type })}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      timetableForm.type === type && styles.yearButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCreateModal(null)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleCreateTimetable}
              >
                <Text style={styles.modalButtonTextSave}>Create</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Notifications Modal */}
      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onDelete={async (id) => {
          try {
            await deleteNotification(String(id));
          } catch (error) {
            // Error is already handled in the context
          }
        }}
        onClearAll={async () => {
          try {
            await clearAllNotifications();
            Alert.alert("Success", "All notifications cleared");
          } catch (error) {
            // Error is already handled in the context
          }
        }}
      />

      {/* ----- MESSAGES TAB ----- */}
      {activeTab === "messages" && (
        <View style={styles.broadcastSection}>
          <Text style={styles.broadcastTitle}>Send App Notification</Text>
          <Text style={styles.broadcastSubtitle}>
            Send real-time notifications to all users in the app.
          </Text>

          <TouchableOpacity 
            style={styles.broadcastBtn}
            onPress={() => {
              setMessageForm({ recipient: "all", title: "", message: "" });
              setShowMessageModal(true);
            }}
          >
            <Feather name="send" size={18} color="#6b21a8" />
            <Text style={styles.broadcastBtnText}>Compose Message</Text>
          </TouchableOpacity>

        </View>
      )}


      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMessageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Send App Notification</Text>
            <Text style={styles.inputLabel}>Recipient</Text>
            <View style={styles.yearButtons}>
              {["all", "students", "teachers", "parents"].map((recipient) => (
                <TouchableOpacity
                  key={recipient}
                  style={[
                    styles.yearButton,
                    messageForm.recipient === recipient && styles.yearButtonActive,
                  ]}
                  onPress={() => setMessageForm({ ...messageForm, recipient })}
                >
                  <Text
                    style={[
                      styles.yearButtonText,
                      messageForm.recipient === recipient && styles.yearButtonTextActive,
                    ]}
                  >
                    {recipient.charAt(0).toUpperCase() + recipient.slice(1)}
                  </Text>
            </TouchableOpacity>
          ))}
        </View>
            <TextInput
              style={styles.input}
              placeholder="Notification Title"
              value={messageForm.title}
              onChangeText={(text) => setMessageForm({ ...messageForm, title: text })}
            />
            <TextInput
              style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]}
              placeholder="Message"
              value={messageForm.message}
              onChangeText={(text) => setMessageForm({ ...messageForm, message: text })}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowMessageModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={async () => {
                  if (!messageForm.title || !messageForm.message) {
                    Alert.alert("Error", "Please fill title and message");
                    return;
                  }
                  try {
                    // Create notification for all users
                    await createNotification({
                      title: messageForm.title,
                      message: messageForm.message,
                      time: "Just now",
                      type: "info",
                      recipient: messageForm.recipient as "all" | "students" | "teachers" | "parents",
                    });
                    
                    // Request notification permission and send push notification
                    if (typeof window !== "undefined" && "Notification" in window) {
                      if (window.Notification.permission === "default") {
                        window.Notification.requestPermission().then((permission) => {
                          if (permission === "granted") {
                            new window.Notification(messageForm.title, {
                              body: messageForm.message,
                              icon: "/icon.png",
                            });
                          }
                        });
                      } else if (window.Notification.permission === "granted") {
                        new window.Notification(messageForm.title, {
                          body: messageForm.message,
                          icon: "/icon.png",
                        });
                      }
                    }
                    
                    Alert.alert(
                      "Success",
                      `Notification sent to ${messageForm.recipient}!`
                    );
                    setMessageForm({ recipient: "all", title: "", message: "" });
                    setShowMessageModal(false);
                  } catch (error) {
                    // Error is already handled in the context
                  }
                }}
              >
                <Text style={styles.modalButtonTextSave}>Send Notification</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Assign Courses Modal */}
      <Modal
        visible={showAssignCoursesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignCoursesModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAssignCoursesModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>
              Assign Courses to {selectedYearForAssignment} Students
            </Text>
            <Text style={styles.inputLabel}>Select Courses</Text>
            <ScrollView style={styles.selectList}>
              {courses
                .filter((course) => course.year === selectedYearForAssignment)
                .map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.selectItem,
                      selectedCoursesForAssignment.includes(course.id) && styles.selectItemActive,
                    ]}
                    onPress={() => {
                      if (selectedCoursesForAssignment.includes(course.id)) {
                        setSelectedCoursesForAssignment(
                          selectedCoursesForAssignment.filter((id) => id !== course.id)
                        );
                      } else {
                        setSelectedCoursesForAssignment([...selectedCoursesForAssignment, course.id]);
                      }
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Feather
                        name={selectedCoursesForAssignment.includes(course.id) ? "check-square" : "square"}
                        size={18}
                        color={selectedCoursesForAssignment.includes(course.id) ? "#2563eb" : "#6b7280"}
                      />
                      <Text>{course.code} - {course.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            {courses.filter((course) => course.year === selectedYearForAssignment).length === 0 && (
              <Text style={[styles.inputLabel, { color: "#ef4444", marginTop: 10 }]}>
                No courses available for {selectedYearForAssignment}. Please create courses first.
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAssignCoursesModal(false);
                  setSelectedCoursesForAssignment([]);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={async () => {
                  if (selectedCoursesForAssignment.length === 0) {
                    Alert.alert("Error", "Please select at least one course");
                    return;
                  }
                  try {
                    // Assign selected courses to all students in the selected year
                    const yearStudents = students.filter((s) => s.year === selectedYearForAssignment);
                    const promises: Promise<void>[] = [];
                    yearStudents.forEach((student) => {
                      selectedCoursesForAssignment.forEach((courseId) => {
                        promises.push(assignStudentToCourse(student.id, courseId));
                      });
                    });
                    await Promise.all(promises);
                    Alert.alert(
                      "Success",
                      `Assigned ${selectedCoursesForAssignment.length} course(s) to ${yearStudents.length} student(s) in ${selectedYearForAssignment}!`
                    );
                    setShowAssignCoursesModal(false);
                    setSelectedCoursesForAssignment([]);
                  } catch (error) {
                    // Error is already handled in the context
                  }
                }}
              >
                <Text style={styles.modalButtonTextSave}>Assign Courses</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: "events", icon: "calendar", label: "Events" },
          { id: "messages", icon: "message-circle", label: "Messages" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[
              styles.bottomNavItem,
              activeTab === tab.id && styles.bottomNavItemActive,
            ]}
          >
            <Feather
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? "#2563eb" : "#6b7280"}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                activeTab === tab.id && styles.bottomNavLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },

  headerActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  iconBtn: {
    padding: 8,
    position: "relative",
  },

  notificationBadge: {
    position: "relative",
  },

  notificationBadgeDot: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  notificationCount: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },


  logoutBtn: {
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
  },

  topTabRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },

  topTabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },

  topActiveTab: {
    backgroundColor: "#2563eb",
  },

  topTabText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 13,
  },

  topActiveTabText: {
    color: "white",
    fontSize: 13,
  },

  bottomNav: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'android' ? 33 : 12,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },

  bottomNavItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 4,
  },

  bottomNavItemActive: {
    // Active state handled by icon/text color
  },

  bottomNavLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "500",
  },

  bottomNavLabelActive: {
    color: "#2563eb",
    fontWeight: "600",
  },

  section: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16, color: "#111827" },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  statCard: {
    width: "47%",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  statCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
  },

  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },

  analyticsCard: {
    width: "47%",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },

  analyticsLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },

  analyticsValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },

  analyticsChange: {
    fontSize: 11,
    color: "#10b981",
    marginTop: 4,
  },

  deptCard: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  deptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  deptName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  deptGrade: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
  },

  deptStudents: {
    fontSize: 13,
    color: "#6b7280",
  },

  eventBox: {
    backgroundColor: "#f3f4f6",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  eventTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  eventDate: { fontSize: 13, color: "#6b7280", marginTop: 3 },
  eventAttendees: { fontSize: 13, color: "#4b5563", marginTop: 3 },

  addEventBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },

  addEventText: {
    color: "#2563eb",
    fontWeight: "500",
    fontSize: 14,
  },

  broadcastSection: {
    backgroundColor: "#6d28d9",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },

  broadcastTitle: { fontSize: 18, color: "white", marginBottom: 10 },
  broadcastSubtitle: { fontSize: 14, color: "#e9d5ff", marginBottom: 20 },

  broadcastBtn: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  broadcastBtnText: { fontSize: 14, color: "#6d28d9", fontWeight: "500" },

  quickActionsTitle: { fontSize: 16, color: "white", marginBottom: 10 },

  actionBtn: {
    backgroundColor: "#ede9fe",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionText: { fontSize: 14, color: "#4c1d95" },

  managementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

  managementCard: {
    width: "47%",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  managementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 8,
    textAlign: "center",
  },

  managementSubtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },

  managementItem: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  managementItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  managementItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },

  managementItemCode: {
    fontSize: 12,
    color: "#6b7280",
  },

  editBtn: {
    padding: 6,
  },

  managementItemDetails: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },

  managementItemDetail: {
    fontSize: 12,
    color: "#6b7280",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },

  selectList: {
    maxHeight: 150,
    marginBottom: 12,
  },

  selectItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  selectItemActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },

  yearButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  yearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  yearButtonActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },

  yearButtonText: {
    fontSize: 14,
    color: "#374151",
  },

  yearButtonTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },

  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
  },

  modalButtonSave: {
    backgroundColor: "#2563eb",
  },

  modalButtonTextCancel: {
    color: "#374151",
    fontWeight: "600",
  },

  modalButtonTextSave: {
    color: "white",
    fontWeight: "600",
  },

  emptyStateCard: {
    backgroundColor: "white",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 20,
    marginBottom: 20,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
