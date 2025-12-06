const express = require('express');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all attendance
router.get('/', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('courseId', 'name code')
      .populate('markedBy', 'name');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance by course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ courseId: req.params.courseId });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark attendance (Faculty only)
router.post('/', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { courseId, date, records } = req.body;

    if (!courseId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if attendance for this date already exists
    const existing = await Attendance.findOne({
      courseId,
      date
    });

    if (existing) {
      // Update existing attendance
      existing.records = records;
      await existing.save();
      return res.json({ message: 'Attendance updated successfully', attendance: existing });
    }

    // Create new attendance
    const attendance = new Attendance({
      courseId,
      courseName: course.name,
      date,
      records,
      markedBy: req.user._id
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update attendance (Faculty only)
router.put('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

