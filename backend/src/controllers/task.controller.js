const Task = require('../models/task.model');
const Project = require('../models/project.model');
const Notification = require('../models/notification.model');
const { logAction } = require('../utils/auditLogger');
const { sendEmail } = require('../config/mailer');

// @desc    Get all tasks for a project / current user
// @route   GET /api/tasks
// @access  Private
const getAllTasks = async (req, res) => {
  try {
    const filter = {};

    // Filters from query
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    // Filter by deadline (due date range)
    if (req.query.dueDateStart || req.query.dueDateEnd) {
      filter.dueDate = {};
      if (req.query.dueDateStart) filter.dueDate.$gte = new Date(req.query.dueDateStart);
      if (req.query.dueDateEnd) filter.dueDate.$lte = new Date(req.query.dueDateEnd);
    }

    // RBAC Task scoping
    if (req.user.role === 'admin') {
      if (req.query.project) filter.project = req.query.project;
    } else if (req.user.role === 'manager') {
      const managedProjects = await Project.find({
        $or: [
          { owner: req.user._id },
          { assignedManager: req.user._id },
          { 'members.user': req.user._id },
        ],
      }).select('_id');
      const managedIds = managedProjects.map((p) => p._id.toString());

      if (req.query.project) {
        if (!managedIds.includes(req.query.project.toString())) {
          return res.status(403).json({ success: false, message: 'Not authorized to view tasks for this project' });
        }
        filter.project = req.query.project;
      } else {
        filter.project = { $in: managedProjects.map(p => p._id) };
      }
    } else {
      // Employee / Member role: view assigned tasks only
      filter.assignedTo = req.user._id;
      if (req.query.project) {
        filter.project = req.query.project;
      }
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate({
        path: 'project',
        select: 'name description owner assignedManager members',
        populate: [
          { path: 'assignedManager', select: 'name email' },
          { path: 'owner', select: 'name email' },
          { path: 'members.user', select: 'name email' }
        ]
      })
      .populate('comments.user', 'name email avatar')
      .populate('history.user', 'name email');

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    // RBAC: Verify permission to read task
    const isAdmin = req.user.role === 'admin';
    const isAssignee = task.assignedTo && (task.assignedTo._id || task.assignedTo).toString() === req.user._id.toString();
    
    // PM of project
    const project = task.project;
    const isPM = project && (
      (project.owner?._id || project.owner)?.toString() === req.user._id.toString() ||
      (project.assignedManager?._id || project.assignedManager)?.toString() === req.user._id.toString() ||
      project.members?.some(m => (m.user?._id || m.user)?.toString() === req.user._id.toString() && (m.role === 'manager' || req.user.role === 'manager'))
    );

    if (!isAdmin && !isAssignee && !isPM) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this task' });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { project: projectId } = req.body;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // RBAC: Only Admin or Project Managers on this project can create tasks
    const isAdmin = req.user.role === 'admin';
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAssignedPM = project.assignedManager && project.assignedManager.toString() === req.user._id.toString();
    const isManagerInTeam = project.members?.some(m => m.user.toString() === req.user._id.toString() && (m.role === 'manager' || req.user.role === 'manager'));

    if (!isAdmin && !isOwner && !isAssignedPM && !isManagerInTeam) {
      return res.status(403).json({ success: false, message: 'Not authorized to create tasks in this project' });
    }

    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await task.populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { path: 'project', select: 'name' }
    ]);

    // Add assignment notification if assigned during creation
    if (task.assignedTo) {
      await Notification.create({
        user: task.assignedTo._id,
        type: 'assignment',
        message: `You have been assigned to task "${task.title}" by ${req.user.name}.`,
        relatedLink: `/tasks/${task._id}`,
      });

      await sendEmail({
        to: task.assignedTo.email,
        subject: `📋 Assigned Task: "${task.title}"`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e7ff; background-color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-top: 0;">New Task Assignment</h2>
            <p>Hello <strong>${task.assignedTo.name}</strong>,</p>
            <p>You have been assigned to task <strong>"${task.title}"</strong> under project <strong>"${project.name}"</strong> by <strong>${req.user.name}</strong>.</p>
            <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
            <p>Please log in to TaskFlow to view details and update your progress.</p>
          </div>
        `,
      });
    }

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'TASK_CREATE',
      entity: 'Task',
      entityId: task._id,
      newValue: task.toJSON(),
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project');

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const project = task.project;
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAssignedPM = project.assignedManager && project.assignedManager.toString() === req.user._id.toString();
    const isManagerInTeam = project.members?.some(m => m.user.toString() === req.user._id.toString() && (m.role === 'manager' || req.user.role === 'manager'));
    const isPM = isOwner || isAssignedPM || isManagerInTeam;

    const isProjectMember = project.members?.some(m => m.user.toString() === req.user._id.toString());
    const isMemberOrStaff = isAdmin || isPM || isProjectMember || task.assignedTo?.toString() === req.user._id.toString();

    // Check update permissions
    if (!isMemberOrStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    // Standard members (non-PM/Admin) can ONLY update status, assignee, and timeline (dueDate)
    if (!isAdmin && !isPM) {
      const allowedKeys = ['status', 'assignedTo', 'dueDate'];
      const keys = Object.keys(req.body);
      const isAllowed = keys.every(k => allowedKeys.includes(k));
      if (!isAllowed) {
        return res.status(403).json({ success: false, message: 'Project members can only modify task status, assignee, and timeline.' });
      }
    }

    const previousValue = task.toJSON();
    const historyEntries = [];

    // Track status transitions
    if (req.body.status && req.body.status !== task.status) {
      historyEntries.push({
        user: req.user._id,
        action: 'STATUS_CHANGE',
        previousValue: task.status,
        newValue: req.body.status,
        timestamp: new Date()
      });
    }

    // Track assignee changes with names instead of IDs
    if (req.body.assignedTo !== undefined && req.body.assignedTo !== (task.assignedTo ? task.assignedTo.toString() : '')) {
      const User = require('../models/user.model');
      let prevAssigneeName = 'Unassigned';
      if (task.assignedTo) {
        const prevUser = await User.findById(task.assignedTo);
        if (prevUser) prevAssigneeName = prevUser.name;
      }
      let newAssigneeName = 'Unassigned';
      if (req.body.assignedTo) {
        const newUser = await User.findById(req.body.assignedTo);
        if (newUser) newAssigneeName = newUser.name;
      }

      historyEntries.push({
        user: req.user._id,
        action: 'ASSIGNEE_CHANGE',
        previousValue: prevAssigneeName,
        newValue: newAssigneeName,
        timestamp: new Date()
      });

      // Notify new assignee if changed
      if (req.body.assignedTo) {
        const newAssignee = await User.findById(req.body.assignedTo);
        if (newAssignee) {
          await Notification.create({
            user: newAssignee._id,
            type: 'assignment',
            message: `Task "${task.title}" has been assigned to you by ${req.user.name}.`,
            relatedLink: `/tasks/${task._id}`,
          });

          await sendEmail({
            to: newAssignee.email,
            subject: `📋 Assigned Task: "${task.title}"`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e7ff; background-color: #f8fafc; border-radius: 8px;">
                <h2 style="color: #4f46e5; margin-top: 0;">New Task Assignment</h2>
                <p>Hello <strong>${newAssignee.name}</strong>,</p>
                <p>You have been assigned to task <strong>"${task.title}"</strong> under project <strong>"${project.name}"</strong> by <strong>${req.user.name}</strong>.</p>
                <p>Please log in to TaskFlow to view details and update your progress.</p>
              </div>
            `,
          });
        }
      }
    }

    // Track due date (timeline) changes
    if (req.body.dueDate !== undefined) {
      const prevDateStr = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : 'None';
      const newDateStr = req.body.dueDate ? new Date(req.body.dueDate).toISOString().slice(0, 10) : 'None';
      if (prevDateStr !== newDateStr) {
        historyEntries.push({
          user: req.user._id,
          action: 'DUE_DATE_CHANGE',
          previousValue: prevDateStr,
          newValue: newDateStr,
          timestamp: new Date()
        });
      }
    }

    // Append to task history
    if (historyEntries.length > 0) {
      task.history.push(...historyEntries);
    }

    // Update fields
    Object.assign(task, req.body);
    await task.save();

    const updatedTask = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate({
        path: 'project',
        select: 'name description owner assignedManager members',
        populate: [
          { path: 'assignedManager', select: 'name email' },
          { path: 'owner', select: 'name email' },
          { path: 'members.user', select: 'name email' }
        ]
      })
      .populate('comments.user', 'name email avatar')
      .populate('history.user', 'name email');

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'TASK_UPDATE',
      entity: 'Task',
      entityId: task._id,
      previousValue,
      newValue: updatedTask.toJSON(),
    });

    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    const project = task.project;
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAssignedPM = project.assignedManager && project.assignedManager.toString() === req.user._id.toString();
    const isManagerInTeam = project.members?.some(m => m.user.toString() === req.user._id.toString() && (m.role === 'manager' || req.user.role === 'manager'));
    const isAdmin = req.user.role === 'admin';

    // Only Admin or PM can delete
    if (!isAdmin && !isOwner && !isAssignedPM && !isManagerInTeam) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    const previousValue = task.toJSON();
    await task.deleteOne();

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'TASK_DELETE',
      entity: 'Task',
      entityId: task._id,
      previousValue,
    });

    res
      .status(200)
      .json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    
    const updated = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('history.user', 'name email')
      .populate({
        path: 'project',
        select: 'name description owner assignedManager members',
        populate: [
          { path: 'assignedManager', select: 'name email' },
          { path: 'owner', select: 'name email' },
          { path: 'members.user', select: 'name email' }
        ]
      });

    // Audit log for comment submission
    await logAction({
      userId: req.user._id,
      action: 'TASK_COMMENT_ADD',
      entity: 'Task',
      entityId: task._id,
      newValue: { text: req.body.text },
    });

    res.status(200).json({ success: true, task: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
};
