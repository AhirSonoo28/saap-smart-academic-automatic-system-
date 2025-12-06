const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacherId', 'name email')
      .populate('studentIds', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get courses by teacher
router.get('/teacher/:teacherId', auth, async (req, res) => {
  try {
    const courses = await Course.find({ teacherId: req.params.teacherId });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get courses by student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const courses = await Course.find({ _id: { $in: student.courseIds } });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create course (Admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { code, name, teacherId, year } = req.body;

    if (!code || !name || !teacherId || !year) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'faculty') {
      return res.status(400).json({ message: 'Invalid teacher' });
    }

    const course = new Course({
      code,
      name,
      teacherId,
      teacherName: teacher.name,
      year,
      studentCount: 0
    });

    await course.save();

    // Add course to teacher's courseIds
    await User.findByIdAndUpdate(teacherId, {
      $push: { courseIds: course._id }
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course (Admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete course (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign student to course (Admin only)
router.post('/:courseId/assign-student/:studentId', auth, authorize('admin'), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    const course = await Course.findById(courseId);
    const student = await User.findById(studentId);

    if (!course || !student) {
      return res.status(404).json({ message: 'Course or student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }

    // Add student to course
    if (!course.studentIds.includes(studentId)) {
      course.studentIds.push(studentId);
      course.studentCount = course.studentIds.length;
      await course.save();
    }

    // Add course to student
    if (!student.courseIds.includes(courseId)) {
      student.courseIds.push(courseId);
      await student.save();
    }

    res.json({ message: 'Student assigned to course successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

