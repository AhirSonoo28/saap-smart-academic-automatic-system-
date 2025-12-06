const express = require('express');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all notifications
router.get('/', auth, async (req, res) => {
  try {
    const { recipient } = req.query;
    const filter = {};

    // Filter by recipient role
    if (recipient) {
      if (recipient === 'all') {
        filter.recipient = 'all';
      } else if (recipient === 'students' && req.user.role === 'student') {
        filter.$or = [{ recipient: 'all' }, { recipient: 'students' }];
      } else if (recipient === 'teachers' && req.user.role === 'faculty') {
        filter.$or = [{ recipient: 'all' }, { recipient: 'teachers' }];
      } else if (req.user.role === 'admin') {
        // Admin can see all
      } else {
        filter.recipient = recipient;
      }
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create notification (Admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { title, message, type, recipient } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Please provide title and message' });
    }

    const notification = new Notification({
      title,
      message,
      time: new Date().toLocaleString(),
      type: type || 'info',
      recipient: recipient || 'all'
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear all notifications
router.delete('/', auth, async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

