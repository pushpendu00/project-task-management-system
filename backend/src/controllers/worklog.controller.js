const WorkLog = require('../models/worklog.model');
const Task = require('../models/task.model');
const Project = require('../models/project.model');
const Notification = require('../models/notification.model');
const { logAction } = require('../utils/auditLogger');

// @desc    Submit a new work log
// @route   POST /api/worklogs
// @access  Private
const submitWorkLog = async (req, res) => {
  try {
    const { task: taskId, description, hoursWorked, timestamp, attachment } = req.body;
    
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // RBAC: Verify if the user is the assignee of the task (or admin/manager)
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const project = task.project;
    const isPM = project && (
      project.owner?.toString() === req.user._id.toString() ||
      project.assignedManager?.toString() === req.user._id.toString() ||
      project.members?.some(m => m.user.toString() === req.user._id.toString() && (m.role === 'manager' || req.user.role === 'manager'))
    );

    if (!isAssignee && !isAdmin && !isPM) {
      return res.status(403).json({ success: false, message: 'Not authorized to log work on this task' });
    }

    const workLog = await WorkLog.create({
      task: taskId,
      employee: req.user._id,
      description,
      hoursWorked,
      timestamp: timestamp || new Date(),
      attachment: attachment || '',
    });

    // Notify Project Manager about the new log submission
    const manager = project?.assignedManager || project?.owner;
    if (manager && req.user.role === 'member') {
      await Notification.create({
        user: manager,
        type: 'reminder',
        message: `${req.user.name} submitted a work log of ${hoursWorked} hours on task "${task.title}".`,
        relatedLink: `/tasks/${task._id}`,
      });
    }

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'WORKLOG_SUBMIT',
      entity: 'WorkLog',
      entityId: workLog._id,
      newValue: workLog.toJSON(),
    });

    // Emit real-time worklog submit event
    try {
      const { sendToTask } = require('../utils/socket');
      sendToTask(taskId.toString(), 'worklog_update', { taskId });
    } catch (socketErr) {
      console.error('Socket error emitting worklog submit:', socketErr);
    }

    res.status(201).json({ success: true, workLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a work log
// @route   POST /api/worklogs/:id/replies
// @access  Private
const replyToWorkLog = async (req, res) => {
  try {
    const { text } = req.body;
    
    const workLog = await WorkLog.findById(req.params.id)
      .populate('employee')
      .populate({
        path: 'task',
        populate: { path: 'project' }
      });

    if (!workLog) {
      return res.status(404).json({ success: false, message: 'Work log not found' });
    }

    const task = workLog.task;
    const project = task?.project;

    // RBAC: Admins, project manager, or the logging employee can reply
    const isOwner = workLog.employee._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isPM = project && (
      project.owner?.toString() === req.user._id.toString() ||
      project.assignedManager?.toString() === req.user._id.toString() ||
      project.members?.some(m => m.user.toString() === req.user._id.toString() && (m.role === 'manager' || req.user.role === 'manager'))
    );

    if (!isOwner && !isAdmin && !isPM) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this work log' });
    }

    const previousValue = workLog.toJSON();

    workLog.replies.push({
      user: req.user._id,
      name: req.user.name,
      text,
      createdAt: new Date(),
    });

    await workLog.save();

    // Notify the other party
    if (isPM || isAdmin) {
      // Notify employee of PM reply
      await Notification.create({
        user: workLog.employee._id,
        type: 'log_reply',
        message: `${req.user.name} commented on your work log for "${task.title}".`,
        relatedLink: `/tasks/${task._id}`,
      });
    } else if (isOwner) {
      // Notify PM of employee reply
      const manager = project?.assignedManager || project?.owner;
      if (manager) {
        await Notification.create({
          user: manager,
          type: 'log_reply',
          message: `${req.user.name} replied to comments on work log for "${task.title}".`,
          relatedLink: `/tasks/${task._id}`,
        });
      }
    }

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'WORKLOG_REPLY',
      entity: 'WorkLog',
      entityId: workLog._id,
      previousValue,
      newValue: { repliesCount: workLog.replies.length, lastReply: text },
    });

    // Emit real-time worklog reply event
    try {
      const { sendToTask } = require('../utils/socket');
      sendToTask(task._id.toString(), 'worklog_update', { taskId: task._id });
    } catch (socketErr) {
      console.error('Socket error emitting worklog reply:', socketErr);
    }

    res.status(200).json({ success: true, workLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get work logs (with RBAC and filters)
// @route   GET /api/worklogs
// @access  Private
const getWorkLogs = async (req, res) => {
  try {
    let query = {};

    // Filters from query params
    if (req.query.task) query.task = req.query.task;
    if (req.query.employee) query.employee = req.query.employee;

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) query.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.timestamp.$lte = new Date(req.query.endDate);
    }

    // RBAC logic to scope down logs
    if (req.user.role === 'admin') {
      // Admin sees all based on filters.
      // If project filter is requested:
      if (req.query.project) {
        const tasks = await Task.find({ project: req.query.project }).select('_id');
        query.task = { $in: tasks.map(t => t._id) };
      }
    } else if (req.user.role === 'manager') {
      // PM sees logs only for projects they manage
      const managedProjects = await Project.find({
        $or: [
          { owner: req.user._id },
          { assignedManager: req.user._id },
          { 'members.user': req.user._id },
        ],
      }).select('_id');
      const managedIds = managedProjects.map(p => p._id);

      let taskQuery = { project: { $in: managedIds } };
      if (req.query.project) {
        if (managedIds.map(String).includes(String(req.query.project))) {
          taskQuery.project = req.query.project;
        } else {
          return res.status(403).json({ success: false, message: 'Not authorized to view logs for this project' });
        }
      }

      const tasks = await Task.find(taskQuery).select('_id');
      query.task = { $in: tasks.map(t => t._id) };
    } else {
      // Employee sees only their own work logs
      query.employee = req.user._id;
      if (req.query.project) {
        const tasks = await Task.find({ project: req.query.project }).select('_id');
        query.task = { $in: tasks.map(t => t._id) };
      }
    }

    const workLogs = await WorkLog.find(query)
      .populate({
        path: 'task',
        select: 'title project',
        populate: { path: 'project', select: 'name' }
      })
      .populate('employee', 'name email avatar')
      .populate('replies.user', 'name email avatar')
      .sort({ timestamp: -1 });

    res.status(200).json({ success: true, count: workLogs.length, workLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitWorkLog,
  replyToWorkLog,
  getWorkLogs,
};
