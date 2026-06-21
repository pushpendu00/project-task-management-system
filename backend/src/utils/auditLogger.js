const AuditLog = require('../models/auditlog.model');

/**
 * Creates an entry in the AuditLog database collection.
 * @param {Object} params
 * @param {string} params.userId ID of the user performing the action
 * @param {string} params.action Description of the action (e.g. 'LOGIN', 'PROJECT_CREATE')
 * @param {string} params.entity Name of the affected collection (e.g. 'Project', 'Task')
 * @param {string} [params.entityId] ID of the affected record
 * @param {Object} [params.previousValue] Previous state of the entity
 * @param {Object} [params.newValue] Modified state of the entity
 */
const logAction = async ({ userId, action, entity, entityId, previousValue, newValue }) => {
  try {
    if (!userId) return; // Ignore if user is unauthenticated or system task
    
    await AuditLog.create({
      user: userId,
      action,
      entity,
      entityId,
      previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : null,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
    });
  } catch (error) {
    console.error('❌ [Audit Logger] Failed to record system log:', error.message);
  }
};

module.exports = {
  logAction,
};
