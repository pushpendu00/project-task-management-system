const mongoose = require('mongoose');

const auditlogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entity: {
      type: String,
      required: true,
      enum: ['User', 'Project', 'Task', 'WorkLog', 'Notification'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes for auditing queries
auditlogSchema.index({ timestamp: -1 });
auditlogSchema.index({ user: 1 });
auditlogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', auditlogSchema);
