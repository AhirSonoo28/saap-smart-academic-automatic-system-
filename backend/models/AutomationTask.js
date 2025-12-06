const mongoose = require('mongoose');

const automationTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['auto-grade', 'generate-reports'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed'],
    default: 'pending'
  },
  lastRun: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AutomationTask', automationTaskSchema);

