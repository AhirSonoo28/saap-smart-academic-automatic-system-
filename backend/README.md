# Backend API Documentation

## Setup Instructions

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create a `.env` file in the `backend` directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/automation_system
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development

# Email Configuration (for sending passwords to new users)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Note for Gmail:** You'll need to use an "App Password" instead of your regular password. Go to Google Account > Security > 2-Step Verification > App passwords to generate one.

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

**Note:** User registration is disabled. Only admins can create users via `/api/users` endpoint.

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/teachers` - Get all teachers
- `GET /api/users/students` - Get all students
- `POST /api/users` - Create user (Admin only)
  - **Note:** Password is auto-generated and sent to user's email via nodemailer
  - Only `faculty` and `student` roles can be created (not `admin`)
  - Required fields: `name`, `email`, `role`
  - Optional fields: `department` (for faculty), `year` (for students)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/teacher/:teacherId` - Get courses by teacher
- `GET /api/courses/student/:studentId` - Get courses by student
- `POST /api/courses` - Create course (Admin only)
- `PUT /api/courses/:id` - Update course (Admin only)
- `DELETE /api/courses/:id` - Delete course (Admin only)
- `POST /api/courses/:courseId/assign-student/:studentId` - Assign student to course (Admin only)

### Timetables
- `GET /api/timetables` - Get all timetables
- `GET /api/timetables/course/:courseId` - Get timetable by course
- `POST /api/timetables` - Create timetable (Admin only)
- `PUT /api/timetables/:id` - Update timetable (Admin only)
- `DELETE /api/timetables/:id` - Delete timetable (Admin only)

### Assignments
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/course/:courseId` - Get assignments by course
- `POST /api/assignments` - Create assignment (Faculty/Admin only)
- `POST /api/assignments/:id/submit` - Submit assignment (Student only)
- `PUT /api/assignments/:id` - Update assignment (Faculty/Admin only)
- `DELETE /api/assignments/:id` - Delete assignment (Faculty/Admin only)

### Attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance/course/:courseId` - Get attendance by course
- `POST /api/attendance` - Mark attendance (Faculty/Admin only)
- `PUT /api/attendance/:id` - Update attendance (Faculty/Admin only)

### Automation Tasks
- `GET /api/automation` - Get all automation tasks
- `GET /api/automation/course/:courseId` - Get automation tasks by course
- `POST /api/automation` - Create automation task (Faculty/Admin only)
- `POST /api/automation/:id/run` - Run automation task (Faculty/Admin only)
- `PUT /api/automation/:id` - Update automation task (Faculty/Admin only)
- `DELETE /api/automation/:id` - Delete automation task (Faculty/Admin only)

### Notifications
- `GET /api/notifications` - Get all notifications
- `POST /api/notifications` - Create notification (Admin only)
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications` - Clear all notifications

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## MongoDB Schemas

### User
- name, email, password, role (admin/faculty/student)
- department (for faculty), year (for students)
- courseIds (array of course references)

### Course
- code, name, teacherId, teacherName, year
- studentCount, studentIds

### Timetable
- courseId, day, time, type, room

### Assignment
- courseId, courseName, title, description, dueDate
- createdBy, submissions (array)

### Attendance
- courseId, courseName, date, records (array), markedBy

### AutomationTask
- courseId, courseName, title, description, type
- status, lastRun, createdBy

### Notification
- title, message, time, type, recipient, userId, read

