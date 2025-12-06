import { Platform } from 'react-native';

// API Base URL configuration
// Priority: EXPO_PUBLIC_API_URL env var > Platform-specific defaults
// For Android: Try actual IP first (more reliable), fallback to 10.0.2.2 for emulator
// For iOS/Web: Use localhost
const getApiBaseUrl = () => {
  // Allow override via environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  if (Platform.OS === 'android') {
    // Use your machine's IP address (update this if your IP changes)
    // This works for both Android emulator and physical devices on the same network
    // Alternative: 'http://10.0.2.2:5000/api' for Android emulator only
    return 'http://172.31.255.53:5000/api';
  }
  
  // iOS simulator and web can use localhost
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE_URL);
console.log('Platform:', Platform.OS);

class ApiService {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('token', token);
    }
  }

  getToken() {
    if (!this.token && typeof window !== 'undefined' && window.localStorage) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making API request to:', url);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Unexpected response format: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      console.error('Request URL:', url);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  // Auth
  async login(email, password, role) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Users
  async getUsers(role) {
    const query = role ? `?role=${role}` : '';
    return this.request(`/users${query}`);
  }

  async getTeachers() {
    return this.request('/users/teachers');
  }

  async getStudents() {
    return this.request('/users/students');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, updates) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Courses
  async getCourses() {
    return this.request('/courses');
  }

  async getCoursesByTeacher(teacherId) {
    return this.request(`/courses/teacher/${teacherId}`);
  }

  async getCoursesByStudent(studentId) {
    return this.request(`/courses/student/${studentId}`);
  }

  async createCourse(courseData) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(courseId, updates) {
    return this.request(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCourse(courseId) {
    return this.request(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  async assignStudentToCourse(courseId, studentId) {
    return this.request(`/courses/${courseId}/assign-student/${studentId}`, {
      method: 'POST',
    });
  }

  // Timetables
  async getTimetables() {
    return this.request('/timetables');
  }

  async getTimetableByCourse(courseId) {
    return this.request(`/timetables/course/${courseId}`);
  }

  async createTimetable(timetableData) {
    return this.request('/timetables', {
      method: 'POST',
      body: JSON.stringify(timetableData),
    });
  }

  async updateTimetable(timetableId, updates) {
    return this.request(`/timetables/${timetableId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTimetable(timetableId) {
    return this.request(`/timetables/${timetableId}`, {
      method: 'DELETE',
    });
  }

  // Assignments
  async getAssignments() {
    return this.request('/assignments');
  }

  async getAssignmentsByCourse(courseId) {
    return this.request(`/assignments/course/${courseId}`);
  }

  async createAssignment(assignmentData) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  }

  async submitAssignment(assignmentId, fileUrl, fileName) {
    return this.request(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ fileUrl, fileName }),
    });
  }

  async updateAssignment(assignmentId, updates) {
    return this.request(`/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAssignment(assignmentId) {
    return this.request(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  // Attendance
  async getAttendance() {
    return this.request('/attendance');
  }

  async getAttendanceByCourse(courseId) {
    return this.request(`/attendance/course/${courseId}`);
  }

  async markAttendance(attendanceData) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async updateAttendance(attendanceId, updates) {
    return this.request(`/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Automation
  async getAutomationTasks() {
    return this.request('/automation');
  }

  async getAutomationTasksByCourse(courseId) {
    return this.request(`/automation/course/${courseId}`);
  }

  async createAutomationTask(taskData) {
    return this.request('/automation', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async runAutomationTask(taskId) {
    return this.request(`/automation/${taskId}/run`, {
      method: 'POST',
    });
  }

  async updateAutomationTask(taskId, updates) {
    return this.request(`/automation/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAutomationTask(taskId) {
    return this.request(`/automation/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(recipient) {
    const query = recipient ? `?recipient=${recipient}` : '';
    return this.request(`/notifications${query}`);
  }

  async createNotification(notificationData) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async clearAllNotifications() {
    return this.request('/notifications', {
      method: 'DELETE',
    });
  }
}

export default new ApiService();

