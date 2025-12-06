import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import api from "../services/api";

// Data Types
export interface Course {
  id: string;
  code: string;
  name: string;
  teacherId: string;
  teacherName: string;
  year: string;
  studentCount: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  courseIds: string[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  year: string;
  courseIds: string[];
}

export interface Timetable {
  id: string;
  courseId: string;
  day: string;
  time: string;
  type: string;
  room: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
  createdBy: string;
  submissions: { studentId: string; status: "pending" | "submitted" }[];
}

export interface Attendance {
  id: string;
  courseId: string;
  courseName: string;
  date: string;
  records: { studentId: string; studentName: string; present: boolean }[];
  markedBy: string;
}

export interface AutomationTask {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  status: "pending" | "running" | "completed";
  lastRun: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "warning" | "success" | "error";
  recipient?: "all" | "students" | "teachers" | "parents";
}

interface AppDataContextType {
  // Data
  courses: Course[];
  teachers: Teacher[];
  students: Student[];
  timetables: Timetable[];
  assignments: Assignment[];
  attendance: Attendance[];
  automationTasks: AutomationTask[];
  notifications: AppNotification[];
  isLoading: boolean;

  // Admin Functions
  createCourse: (course: Omit<Course, "id">) => Promise<void>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  createTeacher: (teacher: Omit<Teacher, "id" | "courseIds">) => Promise<void>;
  updateTeacher: (teacherId: string, updates: Partial<Teacher>) => Promise<void>;
  createStudent: (student: Omit<Student, "id" | "courseIds">) => Promise<void>;
  assignCourseToTeacher: (courseId: string, teacherId: string) => void;
  assignStudentToCourse: (studentId: string, courseId: string) => Promise<void>;
  createTimetable: (timetable: Omit<Timetable, "id">) => Promise<void>;

  // Faculty Functions
  createAssignment: (assignment: Omit<Assignment, "id" | "submissions">) => Promise<void>;
  markAttendance: (attendance: Omit<Attendance, "id">) => Promise<void>;
  updateAttendance: (attendanceId: string, records: Attendance["records"]) => Promise<void>;
  createAutomationTask: (task: Omit<AutomationTask, "id">) => Promise<void>;
  updateAutomationTask: (taskId: string, updates: Partial<AutomationTask>) => Promise<void>;
  deleteAutomationTask: (taskId: string) => Promise<void>;
  runAutomationTask: (taskId: string) => Promise<void>;

  // Helper Functions
  getCoursesByTeacher: (teacherId: string) => Course[];
  getCoursesByStudent: (studentId: string) => Course[];
  getTimetableByCourse: (courseId: string) => Timetable[];
  getAssignmentsByCourse: (courseId: string) => Assignment[];
  getAttendanceByCourse: (courseId: string) => Attendance[];

  // Student Functions
  submitAssignment: (assignmentId: string, studentId: string, fileUrl?: string, fileName?: string) => Promise<void>;

  // Notification Functions
  createNotification: (notification: Omit<AppNotification, "id">) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

  // Refresh Functions
  refreshData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Helper function to convert backend _id to frontend id
const convertBackendToFrontend = <T extends { _id: string }>(item: T): Omit<T, "_id"> & { id: string } => {
  const { _id, ...rest } = item;
  return { ...rest, id: _id.toString() } as Omit<T, "_id"> & { id: string };
};

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data from backend
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [coursesData, teachersData, studentsData, timetablesData, assignmentsData, attendanceData, automationTasksData, notificationsData] = await Promise.all([
        api.getCourses().catch(() => []),
        api.getTeachers().catch(() => []),
        api.getStudents().catch(() => []),
        api.getTimetables().catch(() => []),
        api.getAssignments().catch(() => []),
        api.getAttendance().catch(() => []),
        api.getAutomationTasks().catch(() => []),
        api.getNotifications().catch(() => []),
      ]);

      // Convert backend format to frontend format
      setCourses(
        coursesData.map((course: any) => ({
          id: course._id || course.id,
          code: course.code,
          name: course.name,
          teacherId: course.teacherId?._id?.toString() || course.teacherId?.toString() || course.teacherId,
          teacherName: course.teacherName || course.teacherId?.name || "",
          year: course.year,
          studentCount: course.studentCount || (course.studentIds?.length || 0),
        }))
      );

      setTeachers(
        teachersData.map((teacher: any) => ({
          id: teacher._id || teacher.id,
          name: teacher.name,
          email: teacher.email,
          department: teacher.department || "",
          courseIds: (teacher.courseIds || []).map((id: any) => id.toString()),
        }))
      );

      setStudents(
        studentsData.map((student: any) => ({
          id: student._id || student.id,
          name: student.name,
          email: student.email,
          year: student.year || "",
          courseIds: (student.courseIds || []).map((id: any) => id.toString()),
        }))
      );

      setTimetables(
        timetablesData.map((timetable: any) => ({
          id: timetable._id || timetable.id,
          courseId: timetable.courseId?._id?.toString() || timetable.courseId?.toString() || timetable.courseId,
          day: timetable.day,
          time: timetable.time,
          type: timetable.type,
          room: timetable.room,
        }))
      );

      setAssignments(
        assignmentsData.map((assignment: any) => ({
          id: assignment._id || assignment.id,
          courseId: assignment.courseId?._id?.toString() || assignment.courseId?.toString() || assignment.courseId,
          courseName: assignment.courseName || assignment.courseId?.name || "",
          title: assignment.title,
          description: assignment.description || "",
          dueDate: assignment.dueDate,
          createdBy: assignment.createdBy?._id?.toString() || assignment.createdBy?.toString() || assignment.createdBy,
          submissions: (assignment.submissions || []).map((sub: any) => ({
            studentId: sub.studentId?.toString() || sub.studentId,
            status: sub.status || "pending",
          })),
        }))
      );

      setAttendance(
        attendanceData.map((att: any) => ({
          id: att._id || att.id,
          courseId: att.courseId?._id?.toString() || att.courseId?.toString() || att.courseId,
          courseName: att.courseName || att.courseId?.name || "",
          date: att.date,
          records: (att.records || []).map((rec: any) => ({
            studentId: rec.studentId?.toString() || rec.studentId,
            studentName: rec.studentName || "",
            present: rec.present || false,
          })),
          markedBy: att.markedBy?._id?.toString() || att.markedBy?.toString() || att.markedBy,
        }))
      );

      setAutomationTasks(
        automationTasksData.map((task: any) => ({
          id: task._id || task.id,
          title: task.title,
          description: task.description || "",
          courseId: task.courseId?._id?.toString() || task.courseId?.toString() || task.courseId,
          courseName: task.courseName || task.courseId?.name || "",
          status: task.status || "pending",
          lastRun: task.lastRun || "Not started",
        }))
      );

      setNotifications(
        notificationsData.map((notif: any) => ({
          id: notif._id || notif.id,
          title: notif.title,
          message: notif.message,
          time: notif.time || notif.createdAt || new Date().toLocaleString(),
          type: notif.type || "info",
          recipient: notif.recipient || "all",
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Admin Functions
  const createCourse = useCallback(async (courseData: Omit<Course, "id">) => {
    try {
      const response = await api.createCourse({
        code: courseData.code,
        name: courseData.name,
        teacherId: courseData.teacherId,
        year: courseData.year,
      });

      const newCourse: Course = {
        id: response._id || response.id,
        code: response.code,
        name: response.name,
        teacherId: response.teacherId?.toString() || response.teacherId,
        teacherName: response.teacherName || "",
        year: response.year,
        studentCount: response.studentCount || 0,
      };

      setCourses((prev) => [...prev, newCourse]);
      
      // Update teacher's courseIds
      setTeachers((prevTeachers) =>
        prevTeachers.map((teacher) =>
          teacher.id === newCourse.teacherId
            ? { ...teacher, courseIds: [...teacher.courseIds, newCourse.id] }
            : teacher
        )
      );
    } catch (error: any) {
      console.error("Error creating course:", error);
      Alert.alert("Error", error.message || "Failed to create course");
      throw error;
    }
  }, []);

  const updateCourse = useCallback(async (courseId: string, updates: Partial<Course>) => {
    try {
      const response = await api.updateCourse(courseId, updates);
      
      const updatedCourse: Course = {
        id: response._id || response.id,
        code: response.code,
        name: response.name,
        teacherId: response.teacherId?.toString() || response.teacherId,
        teacherName: response.teacherName || "",
        year: response.year,
        studentCount: response.studentCount || 0,
      };

      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? updatedCourse : course))
      );

      // Update teacher's courseIds if teacherId changed
      if (updates.teacherId) {
        const oldCourse = courses.find((c) => c.id === courseId);
        if (oldCourse && oldCourse.teacherId !== updates.teacherId) {
          // Remove from old teacher
          setTeachers((prevTeachers) =>
            prevTeachers.map((teacher) =>
              teacher.id === oldCourse.teacherId
                ? { ...teacher, courseIds: teacher.courseIds.filter((id) => id !== courseId) }
                : teacher
            )
          );
          // Add to new teacher
          setTeachers((prevTeachers) =>
            prevTeachers.map((teacher) =>
              teacher.id === updates.teacherId
                ? { ...teacher, courseIds: [...teacher.courseIds, courseId] }
                : teacher
            )
          );
        }
      }
    } catch (error: any) {
      console.error("Error updating course:", error);
      Alert.alert("Error", error.message || "Failed to update course");
      throw error;
    }
  }, [courses]);

  const createTeacher = useCallback(async (teacherData: Omit<Teacher, "id" | "courseIds">) => {
    try {
      const response = await api.createUser({
        name: teacherData.name,
        email: teacherData.email,
        role: "faculty",
        department: teacherData.department,
      });

      const newTeacher: Teacher = {
        id: response._id || response.id,
        name: response.name,
        email: response.email,
        department: response.department || "",
        courseIds: [],
      };

      setTeachers((prev) => [...prev, newTeacher]);
    } catch (error: any) {
      console.error("Error creating teacher:", error);
      Alert.alert("Error", error.message || "Failed to create teacher");
      throw error;
    }
  }, []);

  const updateTeacher = useCallback(async (teacherId: string, updates: Partial<Teacher>) => {
    try {
      const response = await api.updateUser(teacherId, updates);
      
      const updatedTeacher: Teacher = {
        id: response._id || response.id,
        name: response.name,
        email: response.email,
        department: response.department || "",
        courseIds: (response.courseIds || []).map((id: any) => id.toString()),
      };

      setTeachers((prev) =>
        prev.map((teacher) => (teacher.id === teacherId ? updatedTeacher : teacher))
      );
    } catch (error: any) {
      console.error("Error updating teacher:", error);
      Alert.alert("Error", error.message || "Failed to update teacher");
      throw error;
    }
  }, []);

  const createStudent = useCallback(async (studentData: Omit<Student, "id" | "courseIds">) => {
    try {
      const response = await api.createUser({
        name: studentData.name,
        email: studentData.email,
        role: "student",
        year: studentData.year,
      });

      const newStudent: Student = {
        id: response._id || response.id,
        name: response.name,
        email: response.email,
        year: response.year || "",
        courseIds: [],
      };

      setStudents((prev) => [...prev, newStudent]);
    } catch (error: any) {
      console.error("Error creating student:", error);
      Alert.alert("Error", error.message || "Failed to create student");
      throw error;
    }
  }, []);

  const assignCourseToTeacher = (courseId: string, teacherId: string) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              teacherId,
              teacherName: teachers.find((t) => t.id === teacherId)?.name || "",
            }
          : course
      )
    );
    setTeachers((prev) =>
      prev.map((teacher) =>
        teacher.id === teacherId
          ? { ...teacher, courseIds: [...teacher.courseIds, courseId] }
          : teacher
      )
    );
  };

  const assignStudentToCourse = useCallback(async (studentId: string, courseId: string) => {
    try {
      await api.assignStudentToCourse(courseId, studentId);
      
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId
            ? { ...student, courseIds: [...student.courseIds, courseId] }
            : student
        )
      );
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, studentCount: course.studentCount + 1 }
            : course
        )
      );
    } catch (error: any) {
      console.error("Error assigning student to course:", error);
      Alert.alert("Error", error.message || "Failed to assign student to course");
      throw error;
    }
  }, []);

  const createTimetable = useCallback(async (timetableData: Omit<Timetable, "id">) => {
    try {
      const response = await api.createTimetable({
        courseId: timetableData.courseId,
        day: timetableData.day,
        time: timetableData.time,
        type: timetableData.type,
        room: timetableData.room,
      });

      const newTimetable: Timetable = {
        id: response._id || response.id,
        courseId: response.courseId?.toString() || response.courseId,
        day: response.day,
        time: response.time,
        type: response.type,
        room: response.room,
      };

      setTimetables((prev) => [...prev, newTimetable]);
    } catch (error: any) {
      console.error("Error creating timetable:", error);
      Alert.alert("Error", error.message || "Failed to create timetable");
      throw error;
    }
  }, []);

  // Faculty Functions
  const createAssignment = useCallback(async (
    assignmentData: Omit<Assignment, "id" | "submissions">
  ) => {
    try {
      const response = await api.createAssignment({
        courseId: assignmentData.courseId,
        title: assignmentData.title,
        description: assignmentData.description || "",
        dueDate: assignmentData.dueDate,
      });

      const newAssignment: Assignment = {
        id: response._id || response.id,
        courseId: response.courseId?.toString() || response.courseId,
        courseName: response.courseName || "",
        title: response.title,
        description: response.description || "",
        dueDate: response.dueDate,
        createdBy: response.createdBy?.toString() || response.createdBy,
        submissions: (response.submissions || []).map((sub: any) => ({
          studentId: sub.studentId?.toString() || sub.studentId,
          status: sub.status || "pending",
        })),
      };

      setAssignments((prev) => [...prev, newAssignment]);
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      Alert.alert("Error", error.message || "Failed to create assignment");
      throw error;
    }
  }, []);

  const markAttendance = useCallback(async (attendanceData: Omit<Attendance, "id">) => {
    try {
      const response = await api.markAttendance({
        courseId: attendanceData.courseId,
        date: attendanceData.date,
        records: attendanceData.records.map((rec) => ({
          studentId: rec.studentId,
          studentName: rec.studentName,
          present: rec.present,
        })),
      });

      const attendanceRecord: Attendance = {
        id: response.attendance?._id || response._id || response.id,
        courseId: response.attendance?.courseId?.toString() || response.courseId?.toString() || response.courseId,
        courseName: response.attendance?.courseName || response.courseName || "",
        date: response.attendance?.date || response.date,
        records: (response.attendance?.records || response.records || []).map((rec: any) => ({
          studentId: rec.studentId?.toString() || rec.studentId,
          studentName: rec.studentName || "",
          present: rec.present || false,
        })),
        markedBy: response.attendance?.markedBy?.toString() || response.markedBy?.toString() || response.markedBy,
      };

      // Check if attendance for this date already exists
      const existing = attendance.find(
        (a) => a.courseId === attendanceRecord.courseId && a.date === attendanceRecord.date
      );

      if (existing) {
        setAttendance((prev) =>
          prev.map((a) => (a.id === existing.id ? attendanceRecord : a))
        );
      } else {
        setAttendance((prev) => [...prev, attendanceRecord]);
      }
    } catch (error: any) {
      console.error("Error marking attendance:", error);
      Alert.alert("Error", error.message || "Failed to mark attendance");
      throw error;
    }
  }, [attendance]);

  const updateAttendance = useCallback(async (attendanceId: string, records: Attendance["records"]) => {
    try {
      const attendanceRecord = attendance.find((a) => a.id === attendanceId);
      if (!attendanceRecord) {
        throw new Error("Attendance record not found");
      }

      const response = await api.updateAttendance(attendanceId, {
        records: records.map((rec) => ({
          studentId: rec.studentId,
          studentName: rec.studentName,
          present: rec.present,
        })),
      });

      const updatedAttendance: Attendance = {
        id: response._id || response.id,
        courseId: response.courseId?.toString() || response.courseId,
        courseName: response.courseName || "",
        date: response.date,
        records: (response.records || []).map((rec: any) => ({
          studentId: rec.studentId?.toString() || rec.studentId,
          studentName: rec.studentName || "",
          present: rec.present || false,
        })),
        markedBy: response.markedBy?.toString() || response.markedBy,
      };

      setAttendance((prev) =>
        prev.map((a) => (a.id === attendanceId ? updatedAttendance : a))
      );
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      Alert.alert("Error", error.message || "Failed to update attendance");
      throw error;
    }
  }, [attendance]);

  const createAutomationTask = useCallback(async (taskData: Omit<AutomationTask, "id">) => {
    try {
      const response = await api.createAutomationTask({
        courseId: taskData.courseId,
        title: taskData.title,
        description: taskData.description || "",
        type: taskData.title.toLowerCase().includes("grade") ? "auto-grade" : "generate-reports",
      });

      const newTask: AutomationTask = {
        id: response._id || response.id,
        title: response.title,
        description: response.description || "",
        courseId: response.courseId?.toString() || response.courseId,
        courseName: response.courseName || "",
        status: response.status || "pending",
        lastRun: response.lastRun || "Not started",
      };

      setAutomationTasks((prev) => [...prev, newTask]);
    } catch (error: any) {
      console.error("Error creating automation task:", error);
      Alert.alert("Error", error.message || "Failed to create automation task");
      throw error;
    }
  }, []);

  const updateAutomationTask = useCallback(async (
    taskId: string,
    updates: Partial<AutomationTask>
  ) => {
    try {
      const response = await api.updateAutomationTask(taskId, updates);
      
      const updatedTask: AutomationTask = {
        id: response._id || response.id,
        title: response.title,
        description: response.description || "",
        courseId: response.courseId?.toString() || response.courseId,
        courseName: response.courseName || "",
        status: response.status || "pending",
        lastRun: response.lastRun || "Not started",
      };

      setAutomationTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (error: any) {
      console.error("Error updating automation task:", error);
      Alert.alert("Error", error.message || "Failed to update automation task");
      throw error;
    }
  }, []);

  const deleteAutomationTask = useCallback(async (taskId: string) => {
    try {
      await api.deleteAutomationTask(taskId);
      setAutomationTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error: any) {
      console.error("Error deleting automation task:", error);
      Alert.alert("Error", error.message || "Failed to delete automation task");
      throw error;
    }
  }, []);

  const runAutomationTask = useCallback(async (taskId: string) => {
    try {
      const response = await api.runAutomationTask(taskId);
      
      setAutomationTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "running", lastRun: new Date().toLocaleString() }
            : t
        )
      );

      // Wait for task to complete (backend simulates 2 seconds)
      setTimeout(() => {
        setAutomationTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: "completed", lastRun: new Date().toLocaleString() }
              : t
          )
        );
      }, 2000);
    } catch (error: any) {
      console.error("Error running automation task:", error);
      Alert.alert("Error", error.message || "Failed to run automation task");
      throw error;
    }
  }, []);

  // Helper Functions
  const getCoursesByTeacher = (teacherId: string) => {
    return courses.filter((course) => course.teacherId === teacherId);
  };

  const getCoursesByStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return [];
    return courses.filter((course) => student.courseIds.includes(course.id));
  };

  const getTimetableByCourse = (courseId: string) => {
    return timetables.filter((tt) => tt.courseId === courseId);
  };

  const getAssignmentsByCourse = (courseId: string) => {
    return assignments.filter((a) => a.courseId === courseId);
  };

  const getAttendanceByCourse = (courseId: string) => {
    return attendance.filter((a) => a.courseId === courseId);
  };

  // Student Functions
  const submitAssignment = useCallback(async (assignmentId: string, studentId: string, fileUrl?: string, fileName?: string) => {
    try {
      const response = await api.submitAssignment(assignmentId, fileUrl || "", fileName || "");
      
      const updatedAssignment: Assignment = {
        id: response.assignment._id || response.assignment.id || assignmentId,
        courseId: response.assignment.courseId?.toString() || response.assignment.courseId,
        courseName: response.assignment.courseName || "",
        title: response.assignment.title,
        description: response.assignment.description || "",
        dueDate: response.assignment.dueDate,
        createdBy: response.assignment.createdBy?.toString() || response.assignment.createdBy,
        submissions: (response.assignment.submissions || []).map((sub: any) => ({
          studentId: sub.studentId?.toString() || sub.studentId,
          status: sub.status || "pending",
        })),
      };

      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === assignmentId ? updatedAssignment : assignment
        )
      );
    } catch (error: any) {
      console.error("Error submitting assignment:", error);
      Alert.alert("Error", error.message || "Failed to submit assignment");
      throw error;
    }
  }, []);

  // Notification Functions
  const createNotification = useCallback(async (notificationData: Omit<AppNotification, "id">) => {
    try {
      const response = await api.createNotification({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || "info",
        recipient: notificationData.recipient || "all",
      });

      const newNotification: AppNotification = {
        id: response._id || response.id,
        title: response.title,
        message: response.message,
        time: response.time || new Date().toLocaleString(),
        type: response.type || "info",
        recipient: response.recipient || "all",
      };

      setNotifications((prev) => [newNotification, ...prev]);
    } catch (error: any) {
      console.error("Error creating notification:", error);
      Alert.alert("Error", error.message || "Failed to create notification");
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await api.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      Alert.alert("Error", error.message || "Failed to delete notification");
      throw error;
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
    } catch (error: any) {
      console.error("Error clearing notifications:", error);
      Alert.alert("Error", error.message || "Failed to clear notifications");
      throw error;
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const contextValue = useMemo(
    () => ({
      courses,
      teachers,
      students,
      timetables,
      assignments,
      attendance,
      automationTasks,
      notifications,
      isLoading,
      createCourse,
      updateCourse,
      createTeacher,
      updateTeacher,
      createStudent,
      assignCourseToTeacher,
      assignStudentToCourse,
      createTimetable,
      createAssignment,
      markAttendance,
      updateAttendance,
      createAutomationTask,
      updateAutomationTask,
      deleteAutomationTask,
      runAutomationTask,
      getCoursesByTeacher,
      getCoursesByStudent,
      getTimetableByCourse,
      getAssignmentsByCourse,
      getAttendanceByCourse,
      submitAssignment,
      createNotification,
      deleteNotification,
      clearAllNotifications,
      refreshData,
    }),
    [
      courses,
      teachers,
      students,
      timetables,
      assignments,
      attendance,
      automationTasks,
      notifications,
      isLoading,
      createCourse,
      updateCourse,
      createTeacher,
      updateTeacher,
      createStudent,
      assignStudentToCourse,
      createTimetable,
      createAssignment,
      markAttendance,
      updateAttendance,
      createAutomationTask,
      updateAutomationTask,
      deleteAutomationTask,
      runAutomationTask,
      submitAssignment,
      createNotification,
      deleteNotification,
      clearAllNotifications,
      refreshData,
    ]
  );

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
