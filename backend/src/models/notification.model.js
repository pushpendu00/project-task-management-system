const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['reminder', 'overdue', 'assignment', 'log_reply', 'system'],
    },
    message: {
      type: String,
      required: true,
    },
    relatedLink: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const notificationEvents = require('../utils/notificationEvents');

notificationSchema.post('save', function (doc) {
  notificationEvents.emit('new-notification', doc);
});

module.exports = mongoose.model('Notification', notificationSchema);
