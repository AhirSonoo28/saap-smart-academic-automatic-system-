import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAppData } from "../contexts/AppDataContext";
import { EmptyState } from "./shared/EmptyState";
import { NotificationModal } from "./shared/NotificationModal";

interface StudentDashboardProps {
  onLogout: () => void;
  onOpenAI: () => void;
  studentId: string;
}

export function StudentDashboard({
  onLogout,
  onOpenAI,
  studentId,
}: StudentDashboardProps) {
  const {
    courses,
    assignments,
    attendance,
    timetables,
    notifications,
    getCoursesByStudent,
    getTimetableByCourse,
    getAssignmentsByCourse,
    getAttendanceByCourse,
    submitAssignment,
    createNotification,
    deleteNotification,
    clearAllNotifications,
  } = useAppData();

  const studentCourses = getCoursesByStudent(studentId);

  const [activeTab, setActiveTab] = useState<
    "overview" | "assignments" | "attendance" | "timeline"
  >("overview");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [assignmentId: string]: { name: string; uri?: string; size?: number } }>({});

  const upcomingDeadlines = studentCourses.flatMap((course) => {
    const courseAssignments = getAssignmentsByCourse(course.id);
    return courseAssignments.map((assignment) => {
      const submission = assignment.submissions.find((s) => s.studentId === studentId);
      // Check if due date is within 24 hours (urgent)
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const urgent = hoursUntilDue > 0 && hoursUntilDue <= 24;
      
      return {
        title: assignment.title,
        course: course.name,
        due: assignment.dueDate,
        status: submission?.status || "pending",
        urgent,
      };
    });
  });


  // -------------------------------------------
  // COMPONENT UI
  // -------------------------------------------

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Student Dashboard</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.iconBtn}>
            <View style={styles.notificationBadge}>
              <Feather name="bell" size={22} color="#2563eb" />
              {notifications.filter((n) => !n.recipient || n.recipient === "all" || n.recipient === "students").length > 0 && (
                <View style={styles.notificationBadgeDot}>
                  <Text style={styles.notificationCount}>
                    {notifications.filter((n) => !n.recipient || n.recipient === "all" || n.recipient === "students").length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenAI} style={styles.iconBtn}>
            <Feather name="message-circle" size={22} color="#2563eb" />
          </TouchableOpacity>

          <TouchableOpacity onPress={onLogout} style={styles.iconBtn}>
            <Feather name="log-out" size={22} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Tabs - Main sections */}
      <View style={styles.topTabRow}>
        {[{ id: "overview", label: "Overview" }].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[
              styles.topTabButton,
              activeTab === tab.id && styles.topActiveTab,
            ]}
          >
            <Text
              style={[
                styles.topTabText,
                activeTab === tab.id && styles.topActiveTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ------------------ TAB CONTENT ---------------------- */}

      {activeTab === "overview" && (
        <>
          {/* Timetable - Complete Weekly Schedule */}
          <Text style={styles.sectionTitle}>My Timetable</Text>
          <Text style={styles.sectionSubtitle}>
            Complete weekly schedule for all enrolled courses
          </Text>

          {(() => {
            // Group timetables by day
            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const timetableByDay: { [key: string]: Array<{ course: string; time: string; type: string; room: string }> } = {};

            studentCourses.forEach((course) => {
              const courseTimetables = getTimetableByCourse(course.id);
              courseTimetables.forEach((tt) => {
                if (!timetableByDay[tt.day]) {
                  timetableByDay[tt.day] = [];
                }
                timetableByDay[tt.day].push({
                  course: course.name,
                  time: tt.time,
                  type: tt.type,
                  room: tt.room,
                });
              });
            });

            // Sort by time within each day
            Object.keys(timetableByDay).forEach((day) => {
              timetableByDay[day].sort((a, b) => {
                const timeA = a.time.toLowerCase();
                const timeB = b.time.toLowerCase();
                return timeA.localeCompare(timeB);
              });
            });

            const hasAnySchedule = Object.keys(timetableByDay).length > 0;

            if (!hasAnySchedule) {
              return (
                <EmptyState
                  icon="calendar"
                  title="No Timetable"
                  message="You are not enrolled in any courses yet."
                />
              );
            }

            return days.map((day) => {
              const daySchedule = timetableByDay[day] || [];
              if (daySchedule.length === 0) return null;

              return (
                <View key={day} style={styles.timetableDayCard}>
                  <View style={styles.timetableDayHeader}>
                    <Feather name="calendar" size={20} color="#2563eb" />
                    <Text style={styles.timetableDayTitle}>{day}</Text>
                  </View>
                  {daySchedule.map((item, index) => (
                    <View key={index} style={styles.timetableItem}>
                      <View style={styles.timetableItemTime}>
                        <Feather name="clock" size={16} color="#6b7280" />
                        <Text style={styles.timetableTimeText}>{item.time}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.timetableCourseName}>{item.course}</Text>
                        <View style={styles.timetableItemDetails}>
                          <Text style={styles.timetableItemDetail}>
                            <Feather name="book" size={12} color="#6b7280" /> {item.type}
              </Text>
                          <Text style={styles.timetableItemDetail}>
                            <Feather name="map-pin" size={12} color="#6b7280" /> {item.room}
                          </Text>
                        </View>
                      </View>
            </View>
          ))}
                </View>
              );
            }).filter(Boolean);
          })()}

          {/* Deadlines */}
          <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
          {upcomingDeadlines.length === 0 ? (
            <EmptyState
              icon="file-text"
              title="No Deadlines"
              message="You have no upcoming assignment deadlines."
            />
          ) : (
            upcomingDeadlines.map((item, index) => (
            <View
              key={index}
              style={[
                styles.card,
                item.urgent && { borderLeftColor: "#dc2626", borderLeftWidth: 4 },
              ]}
            >
              <View style={styles.row}>
                <Feather
                  name="file-text"
                  size={20}
                  color={item.urgent ? "#dc2626" : "#2563eb"}
                />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <Text style={styles.cardSubtitle}>{item.course}</Text>
              <Text style={styles.cardExtra}>Due: {item.due}</Text>

              <Text
                style={[
                  styles.status,
                  item.status === "submitted"
                    ? styles.statusDone
                    : styles.statusPending,
                ]}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>
            ))
          )}
        </>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === "assignments" && (
        <>
          <Text style={styles.sectionTitle}>My Assignments</Text>
          <Text style={styles.sectionSubtitle}>
            Assignments created by your faculty
          </Text>

          {(() => {
            const allAssignments = studentCourses.flatMap((course) => {
              const courseAssignments = getAssignmentsByCourse(course.id);
              return courseAssignments.map((assignment) => {
                const submission = assignment.submissions.find((s) => s.studentId === studentId);
                const status = submission?.status || "pending";
                const progress = status === "submitted" ? 100 : 0;
                // Check if due date is within 24 hours (urgent)
                const dueDate = new Date(assignment.dueDate);
                const now = new Date();
                const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                const urgent = hoursUntilDue > 0 && hoursUntilDue <= 24;
                
                return {
                  id: assignment.id,
                  title: assignment.title,
                  course: course.name,
                  due: assignment.dueDate,
                  status,
                  progress,
                  urgent,
                };
              });
            });
            return allAssignments.length === 0 ? (
              <EmptyState
                icon="file-text"
                title="No Assignments"
                message="You have no assignments yet."
              />
            ) : (
              allAssignments.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                item.urgent && { borderLeftColor: "#dc2626", borderLeftWidth: 4 },
              ]}
            >
              <View style={styles.row}>
                <Feather
                  name="file-text"
                  size={20}
                  color={item.urgent ? "#dc2626" : "#2563eb"}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.course}</Text>
            </View>
                <Text
                style={[
                  styles.status,
                  item.status === "submitted"
                    ? styles.statusDone
                    : styles.statusPending,
                ]}
                >
                  {item.status.toUpperCase().replace("-", " ")}
                </Text>
              </View>

              <Text style={styles.cardExtra}>Due: {item.due}</Text>

              <View style={styles.assignmentActions}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => {
                    setShowAssignmentDetails(item.id);
                  }}
                >
                  <Feather name="eye" size={14} color="#2563eb" />
                  <Text style={styles.viewBtnText}>View Details</Text>
                </TouchableOpacity>

                {item.status !== "submitted" && (
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={async () => {
                      try {
                        let result;
                        if (Platform.OS === "web") {
                          // For web, use hidden file input
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".pdf,.doc,.docx,.zip,.txt";
                          input.onchange = (e: Event) => {
                            const target = e.target as HTMLInputElement;
                            const file = target.files?.[0];
                            if (file) {
                              setUploadedFiles((prev) => ({
                                ...prev,
                                [item.id]: {
                                  name: file.name,
                                  size: file.size,
                                },
                              }));
                              Alert.alert("Success", `File "${file.name}" selected successfully!`);
                            }
                          };
                          input.click();
                        } else {
                          // For mobile, use expo-document-picker
                          result = await DocumentPicker.getDocumentAsync({
                            type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "text/plain"],
                            copyToCacheDirectory: true,
                          });

                          if (!result.canceled && result.assets && result.assets[0]) {
                            const file = result.assets[0];
                            setUploadedFiles((prev) => ({
                              ...prev,
                              [item.id]: {
                                name: file.name,
                                uri: file.uri,
                                size: file.size,
                              },
                            }));
                            Alert.alert("Success", `File "${file.name}" selected successfully!`);
                          }
                        }
                      } catch (error) {
                        Alert.alert("Error", "Failed to select file. Please try again.");
                        console.error("File picker error:", error);
                      }
                    }}
                  >
                    <Feather name="upload" size={14} color="#10b981" />
                    <Text style={styles.uploadBtnText}>
                      {uploadedFiles[item.id] ? "Change File" : "Upload File"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {uploadedFiles[item.id] && (
                <View style={styles.uploadedFileContainer}>
                  <Feather name="file" size={16} color="#10b981" />
                  <Text style={styles.uploadedFileName} numberOfLines={1}>
                    {uploadedFiles[item.id].name}
                    {uploadedFiles[item.id].size && ` (${(uploadedFiles[item.id].size! / 1024).toFixed(1)} KB)`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setUploadedFiles((prev) => {
                        const newFiles = { ...prev };
                        delete newFiles[item.id];
                        return newFiles;
                      });
                    }}
                  >
                    <Feather name="x" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}

              {item.status !== "submitted" && (
                <>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${item.progress}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{item.progress}% Complete</Text>
                  </View>
                  {uploadedFiles[item.id] && (
                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={async () => {
                        try {
                          // Direct submit without confirmation
                          const fileUrl = uploadedFiles[item.id]?.uri || "";
                          const fileName = uploadedFiles[item.id]?.name || "";
                          await submitAssignment(item.id, studentId, fileUrl, fileName);
                          await createNotification({
                            title: `Assignment Submitted: ${item.title}`,
                            message: `You have successfully submitted your assignment for ${item.course}.`,
                            time: "Just now",
                            type: "success",
                            recipient: "students",
                          });
                          Alert.alert("Success", "Assignment submitted successfully!");
                          setUploadedFiles((prev) => {
                            const newFiles = { ...prev };
                            delete newFiles[item.id];
                            return newFiles;
                          });
                        } catch (error) {
                          // Error is already handled in the context
                        }
                      }}
                    >
                      <Feather name="send" size={16} color="white" />
                      <Text style={styles.submitBtnText}>Submit Assignment</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              {item.status === "submitted" && (
                <View style={styles.submittedContainer}>
                  <Feather name="check-circle" size={16} color="#10b981" />
                  <Text style={styles.submittedText}>Submitted successfully</Text>
                </View>
              )}
            </View>
              ))
            );
          })()}
        </>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <>
          <Text style={styles.sectionSubtitle}>
            Attendance marked by faculty (Read-only)
          </Text>
          <View style={styles.attendanceSummary}>
            <Text style={styles.attendanceTitle}>Overall Attendance</Text>
            {(() => {
              const allAttendance = studentCourses.flatMap((course) => getAttendanceByCourse(course.id));
              const totalClasses = allAttendance.length;
              const presentClasses = allAttendance.filter((att) => {
                const record = att.records.find((r) => r.studentId === studentId);
                return record?.present;
              }).length;
              const overallPercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
              return (
                <>
                  <Text style={styles.attendancePercentage}>{overallPercentage.toFixed(1)}%</Text>
                  <Text style={styles.attendanceSubtext}>Present: {presentClasses} / {totalClasses} classes</Text>
                </>
              );
            })()}
          </View>

          <Text style={styles.sectionTitle}>By Course</Text>

          {studentCourses.length === 0 ? (
            <EmptyState
              icon="book-open"
              title="No Courses"
              message="You are not enrolled in any courses yet."
            />
          ) : (
            studentCourses.map((course) => {
            const courseAttendance = getAttendanceByCourse(course.id);
            const totalClasses = courseAttendance.length;
            const presentClasses = courseAttendance.filter((att) => {
              const record = att.records.find((r) => r.studentId === studentId);
              return record?.present;
            }).length;
            const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
            const status = percentage >= 90 ? "excellent" : percentage >= 75 ? "good" : "warning";
            
            return (
            <View key={course.id} style={styles.card}>
              <View style={styles.row}>
                <Feather
                  name="book-open"
                  size={20}
                  color={
                    status === "excellent"
                      ? "#10b981"
                      : status === "good"
                      ? "#2563eb"
                      : "#f59e0b"
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{course.name}</Text>
                  <Text style={styles.cardSubtitle}>{course.code}</Text>
                </View>
                <Text
                  style={[
                    styles.attendanceBadge,
                    status === "excellent"
                      ? styles.attendanceExcellent
                      : status === "good"
                      ? styles.attendanceGood
                      : styles.attendanceWarning,
                  ]}
                >
                  {percentage.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.attendanceBar}>
                <View
                  style={[
                    styles.attendanceBarFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor:
                        status === "excellent"
                          ? "#10b981"
                          : status === "good"
                          ? "#2563eb"
                          : "#f59e0b",
                    },
                  ]}
                />
              </View>

              <Text style={styles.cardExtra}>
                {presentClasses} present out of {totalClasses} classes
              </Text>
            </View>
            );
          })
          )}
        </>
      )}

      {/* TIMELINE TAB */}
      {activeTab === "timeline" && (
        <>
          <Text style={styles.sectionTitle}>Academic Timeline</Text>
          <Text style={styles.sectionSubtitle}>
            Your academic progress and milestones
          </Text>

          {(() => {
            // Collect all timeline events from assignments, attendance, and courses
            const timelineEvents: Array<{
              id: string;
              type: "assignment" | "attendance" | "course" | "submission";
              title: string;
              description: string;
              date: string;
              icon: string;
              color: string;
            }> = [];

            // Add assignment deadlines
            studentCourses.forEach((course) => {
              const courseAssignments = getAssignmentsByCourse(course.id);
              courseAssignments.forEach((assignment) => {
                const submission = assignment.submissions.find((s) => s.studentId === studentId);
                timelineEvents.push({
                  id: `assignment-${assignment.id}`,
                  type: submission?.status === "submitted" ? "submission" : "assignment",
                  title: submission?.status === "submitted" ? "Assignment Submitted" : "Assignment Due",
                  description: `${assignment.title} - ${course.name}`,
                  date: assignment.dueDate,
                  icon: submission?.status === "submitted" ? "check-circle" : "file-text",
                  color: submission?.status === "submitted" ? "#10b981" : "#2563eb",
                });
              });
            });

            // Add attendance records
            studentCourses.forEach((course) => {
              const courseAttendance = getAttendanceByCourse(course.id);
              courseAttendance.forEach((att) => {
                const record = att.records.find((r) => r.studentId === studentId);
                if (record) {
                  timelineEvents.push({
                    id: `attendance-${att.id}-${record.studentId}`,
                    type: "attendance",
                    title: record.present ? "Marked Present" : "Marked Absent",
                    description: `${course.name} - ${att.date}`,
                    date: att.date,
                    icon: record.present ? "check" : "x",
                    color: record.present ? "#10b981" : "#dc2626",
                  });
                }
              });
            });

            // Add course enrollments (if course has enrollment date, use it; otherwise skip)
            // Note: Enrollment dates should come from backend/context in real implementation

            // Sort by date (most recent first)
            timelineEvents.sort((a, b) => {
              try {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
              } catch {
                // If date parsing fails, keep original order
                return b.date.localeCompare(a.date);
              }
            });

            if (timelineEvents.length === 0) {
              return (
                <EmptyState
                  icon="clock"
                  title="No Timeline Events"
                  message="Your academic timeline will appear here as you progress."
                />
              );
            }

            return timelineEvents.map((event) => (
              <View key={event.id} style={styles.card}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.timelineIcon,
                      { backgroundColor: `${event.color}15` },
                    ]}
                  >
                    <Feather name={event.icon as any} size={20} color={event.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle}>{event.title}</Text>
                    <Text style={styles.cardSubtitle}>{event.description}</Text>
                    <Text style={styles.cardExtra}>{event.date}</Text>
                  </View>
                </View>
              </View>
            ));
          })()}
        </>
      )}
    </ScrollView>

      {/* Notifications Modal */}
      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onDelete={async (id: string | number) => {
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
        filterRecipient="students"
      />

      {/* Assignment Details Modal */}
      <Modal
        visible={showAssignmentDetails !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignmentDetails(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAssignmentDetails(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            {showAssignmentDetails && (() => {
              const assignment = assignments.find((a) => a.id === showAssignmentDetails);
              const assignmentItem = studentCourses.flatMap((course) => {
                const courseAssignments = getAssignmentsByCourse(course.id);
                return courseAssignments
                  .filter((a) => a.id === showAssignmentDetails)
                  .map((a) => ({
                    id: a.id,
                    title: a.title,
                    course: course.name,
                    due: a.dueDate,
                  }));
              })[0];

              return (
                <>
                  <Text style={styles.modalTitle}>{assignment?.title || "Assignment Details"}</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Course:</Text>
                    <Text style={styles.modalDetailValue}>{assignmentItem?.course || "N/A"}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Due Date:</Text>
                    <Text style={styles.modalDetailValue}>{assignmentItem?.due || "N/A"}</Text>
                  </View>
                  <Text style={styles.modalDetailLabel}>Description:</Text>
                  <Text style={styles.modalDescription}>
                    {assignment?.description || "No description available"}
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonClose]}
                    onPress={() => setShowAssignmentDetails(null)}
                  >
                    <Text style={styles.modalButtonTextClose}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>


      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: "assignments", icon: "file-text", label: "Assignments" },
          { id: "attendance", icon: "check-circle", label: "Attendance" },
          { id: "timeline", icon: "clock", label: "Timeline" },
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

// ---------------------------------------------------
//                  STYLES
// ---------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
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


  headerActions: {
    flexDirection: "row",
    gap: 12,
  },

  iconBtn: {
    padding: 8,
  },

  topTabRow: {
    flexDirection: "row",
    marginBottom: 20,
    marginTop: 12,
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

  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 20,
    marginBottom: 10,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
    fontStyle: "italic",
  },

  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  cardSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },

  cardExtra: {
    marginTop: 4,
    fontSize: 13,
    color: "#4b5563",
  },

  status: {
    marginTop: 6,
    fontSize: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#b45309",
  },

  statusDone: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },

  notification: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 10,
  },

  notificationText: {
    fontSize: 14,
    color: "#374151",
  },

  progressContainer: {
    marginTop: 12,
  },

  progressBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 3,
  },

  progressText: {
    fontSize: 12,
    color: "#6b7280",
  },

  statusRunning: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },

  attendanceSummary: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  attendanceTitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
  },

  attendancePercentage: {
    fontSize: 48,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 4,
  },

  attendanceSubtext: {
    fontSize: 14,
    color: "#6b7280",
  },

  attendanceBadge: {
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  attendanceExcellent: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },

  attendanceGood: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },

  attendanceWarning: {
    backgroundColor: "#fef3c7",
    color: "#b45309",
  },

  attendanceBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 4,
  },

  attendanceBarFill: {
    height: "100%",
    borderRadius: 4,
  },

  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  timelineCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  timelineDotCompleted: {
    backgroundColor: "#10b981",
  },

  timelineDotUpcoming: {
    backgroundColor: "#2563eb",
  },

  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  timelineDate: {
    fontSize: 13,
    color: "#6b7280",
  },

  timelineStatus: {
    fontSize: 11,
    fontWeight: "600",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  timelineStatusCompleted: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },

  timelineStatusUpcoming: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },


  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },

  submitBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

  submittedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#dcfce7",
    borderRadius: 8,
  },

  submittedText: {
    color: "#15803d",
    fontWeight: "600",
    fontSize: 14,
  },

  notificationItemMessage: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },

  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "flex-start",
  },

  viewBtnText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 13,
  },

  timetableDayCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  timetableDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  timetableDayTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  timetableItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  timetableItemTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 100,
  },

  timetableTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  timetableCourseName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  timetableItemDetails: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },

  timetableItemDetail: {
    fontSize: 12,
    color: "#6b7280",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  assignmentActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  uploadBtnText: {
    color: "#10b981",
    fontWeight: "600",
    fontSize: 13,
  },

  uploadedFileContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ecfdf5",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#10b981",
  },

  uploadedFileName: {
    flex: 1,
    fontSize: 13,
    color: "#10b981",
    fontWeight: "500",
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
    marginBottom: 16,
  },

  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },

  modalDetailRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  modalDetailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    width: 100,
  },

  modalDetailValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },

  modalDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },

  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  modalButtonClose: {
    backgroundColor: "#2563eb",
  },

  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
    marginTop: 12,
  },

  modalButtonTextClose: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

  modalButtonTextCancel: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },

  fileUploadOptions: {
    gap: 12,
    marginBottom: 20,
  },

  fileOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  fileOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
});
