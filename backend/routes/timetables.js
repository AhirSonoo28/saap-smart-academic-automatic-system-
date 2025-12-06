const express = require('express');
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all timetables
router.get('/', auth, async (req, res) => {
  try {
    const timetables = await Timetable.find().populate('courseId', 'name code');
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get timetable by course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const timetables = await Timetable.find({ courseId: req.params.courseId });
    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create timetable (Admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { courseId, day, time, type, room } = req.body;

    if (!courseId || !day || !time || !type || !room) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const timetable = new Timetable({
      courseId,
      day,
      time,
      type,
      room
    });

    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update timetable (Admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete timetable (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

