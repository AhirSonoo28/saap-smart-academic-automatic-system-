const express = require('express');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all assignments
router.get('/', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('courseId', 'name code')
      .populate('createdBy', 'name');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assignments by course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ courseId: req.params.courseId });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create assignment (Faculty only)
router.post('/', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { courseId, title, description, dueDate } = req.body;

    if (!courseId || !title || !dueDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const assignment = new Assignment({
      courseId,
      courseName: course.name,
      title,
      description: description || '',
      dueDate,
      createdBy: req.user._id,
      submissions: []
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit assignment (Student only)
router.post('/:id/submit', auth, authorize('student'), async (req, res) => {
  try {
    const { fileUrl, fileName } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const existingSubmission = assignment.submissions.find(
      s => s.studentId.toString() === req.user._id.toString()
    );

    if (existingSubmission) {
      existingSubmission.status = 'submitted';
      existingSubmission.submittedAt = new Date();
      if (fileUrl) existingSubmission.fileUrl = fileUrl;
      if (fileName) existingSubmission.fileName = fileName;
    } else {
      assignment.submissions.push({
        studentId: req.user._id,
        status: 'submitted',
        submittedAt: new Date(),
        fileUrl: fileUrl || '',
        fileName: fileName || ''
      });
    }

    await assignment.save();
    res.json({ message: 'Assignment submitted successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update assignment (Faculty/Admin only)
router.put('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete assignment (Faculty/Admin only)
router.delete('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

