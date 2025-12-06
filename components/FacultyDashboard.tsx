import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useAppData } from "../contexts/AppDataContext";
import { FacultyStats } from "./dashboard/FacultyStats";
import { EmptyState } from "./shared/EmptyState";
import { NotificationModal } from "./shared/NotificationModal";

interface FacultyDashboardProps {
  onLogout: () => void;
  onOpenAI: () => void;
  facultyId: string;
}

export function FacultyDashboard({
  onLogout,
  onOpenAI,
  facultyId,
}: FacultyDashboardProps) {
  const {
    courses,
    students,
    assignments,
    attendance,
    automationTasks,
    notifications: appNotifications,
    getCoursesByTeacher,
    createAssignment,
    markAttendance,
    updateAttendance,
    createAutomationTask,
    updateAutomationTask,
    deleteAutomationTask,
    runAutomationTask,
    getAttendanceByCourse,
    deleteNotification,
    clearAllNotifications,
  } = useAppData();

  const facultyCourses = getCoursesByTeacher(facultyId);

  const [activeTab, setActiveTab] = useState<
    "overview" | "courses" | "assignments" | "attendance" | "automation"
  >("overview");
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] = useState<string | null>(null);
  
  const [assignmentForm, setAssignmentForm] = useState({
    courseId: "",
    title: "",
    description: "",
    dueDate: "",
  });

  const [attendanceRecords, setAttendanceRecords] = useState<
    { studentId: string; studentName: string; present: boolean }[]
  >([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<{ assignmentId: string; courseId: string } | null>(null);

  const handleCreateAssignment = async () => {
    if (!assignmentForm.courseId || !assignmentForm.title || !assignmentForm.dueDate) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    try {
      const course = courses.find((c) => c.id === assignmentForm.courseId);
      await createAssignment({
        courseId: assignmentForm.courseId,
        courseName: course?.name || "",
        title: assignmentForm.title,
        description: assignmentForm.description,
        dueDate: assignmentForm.dueDate,
        createdBy: facultyId,
      });
      setAssignmentForm({ courseId: "", title: "", description: "", dueDate: "" });
      setShowCreateAssignment(false);
      Alert.alert("Success", "Assignment created successfully!");
    } catch (error) {
      // Error is already handled in the context
    }
  };

  const handleMarkAttendance = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    // Get students enrolled in this course
    const enrolledStudents = students.filter((s) => s.courseIds.includes(courseId));
    
    // Check if attendance for today already exists
    const today = new Date().toLocaleDateString();
    const existingAttendance = attendance.find(
      (a) => a.courseId === courseId && a.date === today
    );

    if (existingAttendance) {
      // Load existing attendance records
      setAttendanceRecords(existingAttendance.records);
    } else {
      // Create new records with all students defaulting to present
      setAttendanceRecords(
        enrolledStudents.map((s) => ({
          studentId: s.id,
          studentName: s.name,
          present: true, // Default to present
        }))
      );
    }
    setSelectedCourseForAttendance(courseId);
  };

  const toggleAttendance = (studentId: string) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.studentId === studentId
          ? { ...record, present: !record.present }
          : record
      )
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourseForAttendance || attendanceRecords.length === 0) return;
    try {
      const course = courses.find((c) => c.id === selectedCourseForAttendance);
      const today = new Date().toLocaleDateString();
      
      // Check if attendance for today already exists
      const existingAttendance = attendance.find(
        (a) => a.courseId === selectedCourseForAttendance && a.date === today
      );

      if (existingAttendance) {
        // Update existing attendance
        await updateAttendance(existingAttendance.id, attendanceRecords);
        Alert.alert("Success", "Attendance updated successfully!");
      } else {
        // Create new attendance
        await markAttendance({
          courseId: selectedCourseForAttendance,
          courseName: course?.name || "",
          date: today,
          records: attendanceRecords,
          markedBy: facultyId,
        });
        Alert.alert("Success", "Attendance marked successfully!");
      }
      
      setSelectedCourseForAttendance(null);
      setAttendanceRecords([]);
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
        <Text style={styles.headerTitle}>Faculty Dashboard</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.iconBtn}>
            <View style={styles.notificationBadge}>
              <Feather name="bell" size={22} color="#2563eb" />
              {appNotifications.filter((n) => !n.recipient || n.recipient === "all" || n.recipient === "teachers").length > 0 && (
                <View style={styles.notificationBadgeDot}>
                  <Text style={styles.notificationCount}>
                    {appNotifications.filter((n) => !n.recipient || n.recipient === "all" || n.recipient === "teachers").length}
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
        {[
          { id: "overview", label: "Overview" },
          { id: "courses", label: "Courses" },
        ].map((tab) => (
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

      {/* ---------------- TAB CONTENT ---------------- */}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          <Text style={styles.sectionTitle}>Quick Stats</Text>

          <FacultyStats
            totalStudents={facultyCourses.reduce((sum, c) => sum + c.studentCount, 0)}
            activeCourses={facultyCourses.length}
          />

        </>
      )}

      {/* COURSES TAB */}
      {activeTab === "courses" && (
        <>
          <Text style={styles.sectionTitle}>Your Courses</Text>

          {facultyCourses.map((course) => (
            <View key={course.id} style={styles.card}>
              <View style={styles.row}>
                <Feather name="book-open" size={22} color="#2563eb" />
                <Text style={styles.cardTitle}>
                  {course.name} ({course.code})
                </Text>
              </View>

              <Text style={styles.cardSubtitle}>
                Students Enrolled: {course.studentCount}
              </Text>
              <Text style={styles.cardSubtitle}>
                Assignments: {assignments.filter((a) => a.courseId === course.id).length}
              </Text>
              <Text style={styles.cardSubtitle}>
                Year: {course.year}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === "assignments" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Assignments</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => setShowCreateAssignment(true)}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>

          {showCreateAssignment && (
            <View style={styles.createCard}>
              <Text style={styles.createCardTitle}>Create New Assignment</Text>
              {facultyCourses.length === 0 ? (
                <Text style={styles.emptyStateText}>No courses assigned yet. Please contact admin.</Text>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Select Course</Text>
                  <ScrollView style={styles.selectList}>
                    {facultyCourses.map((course) => (
                      <TouchableOpacity
                        key={course.id}
                        style={[
                          styles.selectItem,
                          assignmentForm.courseId === course.id && styles.selectItemActive,
                        ]}
                        onPress={() => setAssignmentForm({ ...assignmentForm, courseId: course.id })}
                      >
                        <Text>{course.code} - {course.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TextInput
                    style={styles.input}
                    placeholder="Assignment Title"
                    value={assignmentForm.title}
                    onChangeText={(text) => setAssignmentForm({ ...assignmentForm, title: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Description (optional)"
                    value={assignmentForm.description}
                    onChangeText={(text) => setAssignmentForm({ ...assignmentForm, description: text })}
                    multiline
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Due Date (e.g., Tomorrow, 11:59 PM)"
                    value={assignmentForm.dueDate}
                    onChangeText={(text) => setAssignmentForm({ ...assignmentForm, dueDate: text })}
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonCancel]}
                      onPress={() => {
                        setShowCreateAssignment(false);
                        setAssignmentForm({ courseId: "", title: "", description: "", dueDate: "" });
                      }}
                    >
                      <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonSave]}
                      onPress={handleCreateAssignment}
                      disabled={!assignmentForm.courseId || !assignmentForm.title || !assignmentForm.dueDate}
                    >
                      <Text style={[
                        styles.modalButtonTextSave,
                        (!assignmentForm.courseId || !assignmentForm.title || !assignmentForm.dueDate) && styles.modalButtonTextDisabled
                      ]}>
                        Create
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {facultyCourses.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Feather name="book-open" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No Courses Assigned</Text>
              <Text style={styles.emptyStateText}>You don't have any courses assigned yet. Please contact the administrator.</Text>
            </View>
          ) : (
            facultyCourses.map((course) => {
              const courseAssignments = assignments.filter((a) => a.courseId === course.id);
              return (
                <View key={course.id} style={styles.card}>
              <View style={styles.row}>
                <Feather name="file-text" size={20} color="#2563eb" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{course.name}</Text>
                      <Text style={styles.cardSubtitle}>
                        Total: {courseAssignments.length}
                      </Text>
                    </View>
                    {courseAssignments.length > 0 && (
                      <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => {
                          if (viewingAssignment?.courseId === course.id) {
                            setViewingAssignment(null);
                          } else {
                            setViewingAssignment({ assignmentId: "", courseId: course.id });
                          }
                        }}
                      >
                        <Feather name={viewingAssignment?.courseId === course.id ? "eye-off" : "eye"} size={16} color="#2563eb" />
                      </TouchableOpacity>
                    )}
              </View>

                  {courseAssignments.length === 0 && (
                    <View style={styles.emptyStateMini}>
                      <Text style={styles.emptyStateMiniText}>No assignments yet. Create one to get started!</Text>
                    </View>
                  )}

                {viewingAssignment?.courseId === course.id && courseAssignments.length > 0 && (
                  <View style={styles.submissionsView}>
                    <Text style={styles.submissionsViewTitle}>Student Submissions</Text>
                    {courseAssignments.map((assignment) => {
                      const enrolledStudents = students.filter((s) => s.courseIds.includes(course.id));
                      return (
                        <View key={assignment.id} style={styles.submissionCard}>
                          <Text style={styles.submissionAssignmentTitle}>{assignment.title}</Text>
                          <Text style={styles.submissionAssignmentDue}>Due: {assignment.dueDate}</Text>
                          
                          <View style={styles.submissionList}>
                            {enrolledStudents.map((student) => {
                              const submission = assignment.submissions.find((s) => s.studentId === student.id);
                              return (
                                <TouchableOpacity
                                  key={student.id}
                                  style={styles.submissionItem}
                                  onPress={() => {
                                    Alert.alert(
                                      "View Submission",
                                      `${student.name}'s submission for ${assignment.title}`,
                                      [
                                        { text: "View File", onPress: () => Alert.alert("File Viewer", "Would open file viewer here") },
                                        { text: "Download", onPress: () => Alert.alert("Download", "File download started") },
                                        { text: "Close", style: "cancel" },
                                      ]
                                    );
                                  }}
                                >
                                  <View style={styles.submissionItemLeft}>
                                    <Feather
                                      name={submission?.status === "submitted" ? "check-circle" : "clock"}
                                      size={18}
                                      color={submission?.status === "submitted" ? "#10b981" : "#f59e0b"}
                                    />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                      <Text style={styles.submissionStudentName}>{student.name}</Text>
                                      <Text style={styles.submissionStatus}>
                                        {submission?.status === "submitted" ? "Submitted" : "Pending"}
              </Text>
                                    </View>
                                  </View>
                                  {submission?.status === "submitted" && (
                                    <View style={styles.submissionActions}>
                                      <TouchableOpacity
                                        style={styles.viewFileBtn}
                                        onPress={() => {
                                          Alert.alert(
                                            "View Submission",
                                            `Viewing ${student.name}'s submission:\n\nFile: assignment_${assignment.id}_${student.id}.pdf\nSize: 2.4 MB\nFormat: PDF\n\nWould open in file viewer.`
                                          );
                                        }}
                                      >
                                        <Feather name="file" size={14} color="#2563eb" />
                                        <Text style={styles.viewFileBtnText}>View</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={styles.downloadFileBtn}
                                        onPress={() => {
                                          Alert.alert("Download", "File download started");
                                        }}
                                      >
                                        <Feather name="download" size={14} color="#10b981" />
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {selectedAssignment === course.id && courseAssignments.length > 0 && (
                  <View style={styles.assignmentDetails}>
                    <Text style={styles.assignmentDetailsTitle}>Assignment Details</Text>
                    {courseAssignments.map((assignment) => {
                      const submitted = assignment.submissions.filter((s) => s.status === "submitted").length;
                      const total = course.studentCount;
                      const pending = total - submitted;
                      return (
                        <View key={assignment.id} style={styles.assignmentDetailCard}>
                          <Text style={styles.assignmentDetailTitle}>{assignment.title}</Text>
                          {assignment.description && (
                            <Text style={styles.assignmentDetailDescription}>{assignment.description}</Text>
                          )}
                          <View style={styles.assignmentDetailStats}>
                            <View style={styles.assignmentStatItem}>
                              <Feather name="check-circle" size={14} color="#10b981" />
                              <Text style={styles.assignmentStatText}>Submitted: {submitted}</Text>
                            </View>
                            <View style={styles.assignmentStatItem}>
                              <Feather name="clock" size={14} color="#f59e0b" />
                              <Text style={styles.assignmentStatText}>Pending: {pending}</Text>
                            </View>
                            <View style={styles.assignmentStatItem}>
                              <Feather name="users" size={14} color="#2563eb" />
                              <Text style={styles.assignmentStatText}>Total: {total}</Text>
                            </View>
                          </View>
                          <Text style={styles.assignmentDetailDue}>Due: {assignment.dueDate}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.assignmentList}>
                  {courseAssignments.map((assignment) => {
                    const submitted = assignment.submissions.filter((s) => s.status === "submitted").length;
                    const total = course.studentCount;
                    return (
                      <View key={assignment.id} style={styles.assignmentItem}>
                        <View style={styles.assignmentRow}>
                          <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                          <Text style={styles.assignmentDue}>Due: {assignment.dueDate}</Text>
                        </View>
                        <Text style={styles.assignmentSubmissions}>
                          {submitted}/{total} submitted
              </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              );
            })
          )}
        </>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <>
          <Text style={styles.sectionTitle}>Mark Attendance</Text>

          {facultyCourses.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Feather name="book-open" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No Courses Assigned</Text>
              <Text style={styles.emptyStateText}>You don't have any courses assigned yet. Please contact the administrator.</Text>
            </View>
          ) : (
            facultyCourses.map((course) => {
              const enrolledStudents = students.filter((s) => s.courseIds.includes(course.id));
              return (
                <View key={course.id} style={styles.card}>
                  <View style={styles.row}>
                    <Feather name="book-open" size={20} color="#2563eb" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{course.name}</Text>
              <Text style={styles.cardSubtitle}>
                        {course.code} • {course.studentCount} students
              </Text>
                    </View>
                    {enrolledStudents.length > 0 && (
                      <TouchableOpacity
                        style={styles.markBtn}
                        onPress={() => handleMarkAttendance(course.id)}
                      >
                        <Feather name="check-circle" size={18} color="#10b981" />
                        <Text style={styles.markBtnText}>Mark</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {enrolledStudents.length === 0 && (
                    <View style={styles.emptyStateMini}>
                      <Text style={styles.emptyStateMiniText}>No students enrolled in this course yet.</Text>
                    </View>
                  )}

                  {selectedCourseForAttendance === course.id && (
                    <View style={styles.attendanceMarking}>
                  <Text style={styles.attendanceMarkingTitle}>
                    Mark Attendance for {course.name}
                  </Text>
                  <Text style={styles.attendanceMarkingDate}>
                    Date: {new Date().toLocaleDateString()}
                  </Text>

                  <View style={styles.attendanceList}>
                    {attendanceRecords.map((record) => (
                      <View key={record.studentId} style={styles.studentRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.studentName}>{record.studentName}</Text>
                          <Text style={styles.studentId}>{record.studentId}</Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.attendanceToggle,
                            record.present && styles.attendanceTogglePresent,
                          ]}
                          onPress={() => toggleAttendance(record.studentId)}
                        >
                          <Feather
                            name={record.present ? "check" : "x"}
                            size={16}
                            color={record.present ? "#10b981" : "#dc2626"}
                          />
                          <Text
                            style={[
                              styles.attendanceToggleText,
                              record.present && styles.attendanceToggleTextPresent,
                            ]}
                          >
                            {record.present ? "Present" : "Absent"}
                          </Text>
                        </TouchableOpacity>
            </View>
          ))}
                  </View>

                  <TouchableOpacity
                    style={styles.saveAttendanceBtn}
                    onPress={handleSaveAttendance}
                  >
                    <Feather name="save" size={18} color="#fff" />
                    <Text style={styles.saveAttendanceBtnText}>Save Attendance</Text>
                  </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.attendanceStats}>
                <Text style={styles.attendanceStatsText}>
                  Students: {enrolledStudents.length}
                </Text>
                <TouchableOpacity
                  style={styles.viewHistoryBtn}
                  onPress={() => {
                    if (showAttendanceHistory === course.id) {
                      setShowAttendanceHistory(null);
                    } else {
                      setShowAttendanceHistory(course.id);
                    }
                  }}
                >
                  <Text style={styles.viewHistoryBtnText}>
                    {showAttendanceHistory === course.id ? "Hide History" : "View History"}
                  </Text>
                </TouchableOpacity>
                  </View>

                  {showAttendanceHistory === course.id && (
                    <View style={styles.attendanceHistory}>
                  <Text style={styles.attendanceHistoryTitle}>Attendance History</Text>
                  {(() => {
                    const courseAttendance = getAttendanceByCourse(course.id);
                    if (courseAttendance.length === 0) {
                      return (
                        <Text style={styles.noHistoryText}>No attendance records yet</Text>
                      );
                    }
                    return (
                      <>
                        {courseAttendance.map((att) => {
                          const presentCount = att.records.filter((r) => r.present).length;
                          const totalCount = att.records.length;
                          return (
                            <View key={att.id} style={styles.historyItem}>
                              <View style={styles.historyHeader}>
                                <Text style={styles.historyDate}>{att.date}</Text>
                                <Text style={styles.historyStats}>
                                  {presentCount}/{totalCount} Present
                                </Text>
                              </View>
                              <View style={styles.historyStudents}>
                                {att.records.slice(0, 5).map((record) => (
                                  <View key={record.studentId} style={styles.historyStudent}>
                                    <Feather
                                      name={record.present ? "check" : "x"}
                                      size={12}
                                      color={record.present ? "#10b981" : "#dc2626"}
                                    />
                                    <Text style={styles.historyStudentName}>{record.studentName}</Text>
                                  </View>
                                ))}
                                {att.records.length > 5 && (
                                  <Text style={styles.historyMore}>
                                    +{att.records.length - 5} more students
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </>
                    );
                  })()}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </>
      )}

      {/* AUTOMATION TAB */}
      {activeTab === "automation" && (
        <>
          <Text style={styles.sectionTitle}>Automation Tasks</Text>
          <Text style={styles.sectionSubtitle}>
            Automate repetitive tasks to save time
          </Text>

          {automationTasks.length === 0 ? (
            <EmptyState
              icon="zap"
              title="No Automation Tasks"
              message="Create your first automation task to save time on repetitive work."
            />
          ) : (
            automationTasks.map((task) => (
            <View key={task.id} style={styles.card}>
              <View style={styles.row}>
                <Feather name="zap" size={20} color="#f59e0b" />
                <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{task.title}</Text>
                  <Text style={styles.cardSubtitle}>{task.description}</Text>
                </View>
              </View>

              <View style={styles.automationDetails}>
                <View style={styles.automationRow}>
                  <Text style={styles.automationLabel}>Course:</Text>
                  <Text style={styles.automationValue}>{task.courseName}</Text>
                </View>
                <View style={styles.automationRow}>
                  <Text style={styles.automationLabel}>Last Run:</Text>
                  <Text style={styles.automationValue}>{task.lastRun}</Text>
                </View>
              </View>

              <View style={styles.automationActions}>
                <View
                style={[
                    styles.statusButton,
                  task.status === "completed"
                    ? styles.statusDone
                    : task.status === "running"
                    ? styles.statusRunning
                    : styles.statusPending,
                ]}
              >
                  <Text style={[
                    styles.statusButtonText,
                    task.status === "completed"
                      ? styles.statusTextDone
                      : task.status === "running"
                      ? styles.statusTextRunning
                      : styles.statusTextPending,
                  ]}>
                {task.status.toUpperCase()}
              </Text>
            </View>
                
                <View style={styles.automationActionButtons}>
                  {task.status === "pending" && (
                    <TouchableOpacity
                      style={styles.runTaskBtn}
                      onPress={() => {
                        runAutomationTask(task.id);
                        Alert.alert("Running", "Automation task is now running...");
                      }}
                    >
                      <Feather name="play" size={14} color="#fff" />
                      <Text style={styles.runTaskBtnText}>Run</Text>
          </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.editAutomationBtn}
                    onPress={() => {
                      if (editingTask === task.id) {
                        setEditingTask(null);
                      } else {
                        setEditingTask(task.id);
                      }
                    }}
                  >
                    <Feather name={editingTask === task.id ? "x" : "edit-2"} size={14} color="#2563eb" />
                    <Text style={styles.editAutomationText}>
                      {editingTask === task.id ? "Cancel" : "Edit"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.deleteAutomationBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      const taskIdToDelete = task.id;
                      
                      // Clear editing state first if needed
                      if (editingTask === taskIdToDelete) {
                        setEditingTask(null);
                      }
                      // Delete the task directly
                      deleteAutomationTask(taskIdToDelete);
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#dc2626" />
                    <Text style={styles.deleteAutomationText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {editingTask === task.id && (
                <View style={styles.editTaskForm}>
                  <Text style={styles.editTaskTitle}>Edit Automation Task</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Task Title"
                    value={task.title}
                    onChangeText={(text) => updateAutomationTask(task.id, { title: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Description"
                    value={task.description}
                    onChangeText={(text) => updateAutomationTask(task.id, { description: text })}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.saveEditBtn}
                    onPress={() => {
                      setEditingTask(null);
                      Alert.alert("Success", "Task updated successfully!");
                    }}
                  >
                    <Text style={styles.saveEditBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            ))
          )}

          <View style={styles.automationCreateOptions}>
            <TouchableOpacity
              style={[styles.createTaskBtn, styles.createTaskBtnHalf]}
              onPress={async () => {
                try {
                  const newTask = {
                    title: "Auto-grade MCQ Assignments",
                    description: "Automatically grade multiple choice questions",
                    courseId: facultyCourses[0]?.id || "",
                    courseName: facultyCourses[0]?.name || "All Courses",
                    status: "pending" as const,
                    lastRun: "Not started",
                  };
                  await createAutomationTask(newTask);
                  Alert.alert("Success", "Auto-grade automation task created!");
                } catch (error) {
                  // Error is already handled in the context
                }
              }}
            >
              <Feather name="check-circle" size={18} color="white" />
              <Text style={styles.createTaskText}>Auto-Grade</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createTaskBtn, styles.createTaskBtnHalf]}
              onPress={async () => {
                try {
                  const newTask = {
                    title: "Generate Weekly Reports",
                    description: "Auto-generate weekly performance reports",
                    courseId: facultyCourses[0]?.id || "",
                    courseName: facultyCourses[0]?.name || "All Courses",
                    status: "pending" as const,
                    lastRun: "Not started",
                  };
                  await createAutomationTask(newTask);
                  Alert.alert("Success", "Report generation automation task created!");
                } catch (error) {
                  // Error is already handled in the context
                }
              }}
            >
              <Feather name="file-text" size={18} color="white" />
              <Text style={styles.createTaskText}>Generate Reports</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.automationInfo}>
            <Feather name="info" size={18} color="#2563eb" />
            <Text style={styles.automationInfoText}>
              Automation tasks help reduce manual work by 70-80%. Create tasks to
              auto-grade, send reminders, generate reports, and more.
            </Text>
          </View>
        </>
      )}
    </ScrollView>

      {/* Notifications Modal */}
      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={appNotifications}
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
            Alert.alert("Success", "All notifications marked as read");
          } catch (error) {
            // Error is already handled in the context
          }
        }}
        filterRecipient="teachers"
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: "assignments", icon: "file-text", label: "Assignments" },
          { id: "attendance", icon: "check-circle", label: "Attendance" },
          { id: "automation", icon: "zap", label: "Automation" },
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

//
// ------------------------- STYLES -------------------------
//

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
    marginTop: 20,
    marginBottom: 10,
    color: "#111827",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
    fontStyle: "italic",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
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
    gap: 10,
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

  cardNumber: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "700",
    color: "#2563eb",
  },

  notification: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  notificationText: {
    fontSize: 14,
    color: "#374151",
  },

  status: {
    marginTop: 6,
    fontSize: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  statusButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },

  automationActionButtons: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
    flexShrink: 0,
    zIndex: 2,
  },

  automationCreateOptions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    marginBottom: 20,
  },

  createTaskBtnHalf: {
    flex: 1,
  },

  deleteAutomationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fecaca",
    minHeight: 32,
    minWidth: 70,
  },

  deleteAutomationText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "600",
  },

  submissionsView: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  submissionsViewTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },

  submissionCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  submissionAssignmentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  submissionAssignmentDue: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },

  submissionList: {
    gap: 8,
  },

  submissionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  submissionItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  submissionStudentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },

  submissionStatus: {
    fontSize: 12,
    color: "#6b7280",
  },

  submissionActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  viewFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },

  viewFileBtnText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },

  downloadFileBtn: {
    padding: 6,
    backgroundColor: "#dcfce7",
    borderRadius: 6,
  },


  runTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10b981",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  runTaskBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  statusPending: {
    backgroundColor: "#fef3c7",
  },

  statusRunning: {
    backgroundColor: "#dbeafe",
  },

  statusDone: {
    backgroundColor: "#dcfce7",
  },

  statusTextPending: {
    color: "#b45309",
  },

  statusTextRunning: {
    color: "#1d4ed8",
  },

  statusTextDone: {
    color: "#15803d",
  },

  createTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 14,
    marginBottom: 20,
  },

  createTaskText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  createBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },

  createCard: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  createCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },

  createCardHint: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },

  createCardBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  createCardBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

  viewBtn: {
    padding: 6,
  },

  assignmentList: {
    marginTop: 12,
    gap: 8,
  },

  assignmentItem: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  assignmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  assignmentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  assignmentDue: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "500",
  },

  assignmentSubmissions: {
    fontSize: 12,
    color: "#6b7280",
  },

  markBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  markBtnText: {
    color: "#15803d",
    fontWeight: "600",
    fontSize: 12,
  },

  attendanceMarking: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  attendanceMarkingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  attendanceMarkingDate: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },

  attendanceList: {
    gap: 8,
    marginBottom: 12,
  },

  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  studentName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },

  studentId: {
    fontSize: 12,
    color: "#6b7280",
  },

  attendanceToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },

  attendanceTogglePresent: {
    backgroundColor: "#dcfce7",
  },

  attendanceToggleText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#dc2626",
  },

  attendanceToggleTextPresent: {
    color: "#15803d",
  },

  saveAttendanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
  },

  saveAttendanceBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

  attendanceStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  attendanceStatsText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },

  viewHistoryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  viewHistoryBtnText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },

  automationDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 6,
  },

  automationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  automationLabel: {
    fontSize: 12,
    color: "#6b7280",
  },

  automationValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
  },

  automationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexWrap: "wrap",
    gap: 8,
    zIndex: 1,
  },

  editAutomationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  editAutomationText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },

  automationInfo: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#eff6ff",
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  automationInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
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

  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
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

  assignmentDetails: {
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  assignmentDetailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  assignmentDetailCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  assignmentDetailTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  assignmentDetailDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },

  assignmentDetailStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },

  assignmentStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  assignmentStatText: {
    fontSize: 12,
    color: "#374151",
  },

  assignmentDetailDue: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "500",
  },

  attendanceHistory: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  attendanceHistoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },

  noHistoryText: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
    textAlign: "center",
    padding: 12,
  },

  historyItem: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  historyDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  historyStats: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },

  historyStudents: {
    gap: 6,
  },

  historyStudent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  historyStudentName: {
    fontSize: 12,
    color: "#374151",
  },

  historyMore: {
    fontSize: 11,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 4,
  },

  editTaskForm: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  editTaskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  saveEditBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },

  saveEditBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

  emptyStateCard: {
    backgroundColor: "white",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 20,
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

  modalButtonTextDisabled: {
    opacity: 0.5,
  },

  emptyStateMini: {
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },

  emptyStateMiniText: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
  },

});
