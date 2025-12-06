const express = require('express');
const AutomationTask = require('../models/AutomationTask');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all automation tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await AutomationTask.find()
      .populate('courseId', 'name code')
      .populate('createdBy', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get automation tasks by course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const tasks = await AutomationTask.find({ courseId: req.params.courseId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create automation task (Faculty only)
router.post('/', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { courseId, title, description, type } = req.body;

    if (!courseId || !title || !type) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['auto-grade', 'generate-reports'].includes(type)) {
      return res.status(400).json({ message: 'Invalid automation type' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const task = new AutomationTask({
      courseId,
      courseName: course.name,
      title,
      description: description || '',
      type,
      status: 'pending',
      createdBy: req.user._id
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Run automation task (Faculty only)
router.post('/:id/run', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const task = await AutomationTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = 'running';
    task.lastRun = new Date().toLocaleString();
    await task.save();

    // Simulate automation execution
    setTimeout(async () => {
      task.status = 'completed';
      task.lastRun = new Date().toLocaleString();
      await task.save();
    }, 2000);

    res.json({ message: 'Automation task started', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update automation task (Faculty only)
router.put('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const task = await AutomationTask.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete automation task (Faculty only)
router.delete('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const task = await AutomationTask.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

