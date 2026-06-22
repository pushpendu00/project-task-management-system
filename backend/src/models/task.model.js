const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'in-review', 'completed', 'blocked'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min: [0, 'Estimated hours cannot be negative'],
    },
    tags: [{ type: String, trim: true }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, trim: true, default: '' },
        attachmentUrl: { type: String },
        attachmentName: { type: String },
        attachmentType: { type: String },
        replyTo: { type: String, default: null },
        replyToUser: { type: String, default: null },
        replyToText: { type: String, default: null },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    sentReminders: {
      type: [String],
      default: [],
    },
    history: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: { type: String },
        previousValue: { type: String, default: '' },
        newValue: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Task', taskSchema);
