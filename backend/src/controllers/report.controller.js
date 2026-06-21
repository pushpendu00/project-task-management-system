const Project = require('../models/project.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');
const WorkLog = require('../models/worklog.model');
const AuditLog = require('../models/auditlog.model');

// @desc    Get dashboard metrics based on user role
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;
    const now = new Date();

    if (role === 'admin') {
      // Admin dashboard metrics
      const totalProjects = await Project.countDocuments({});
      const totalTasks = await Task.countDocuments({});
      const activeEmployees = await User.countDocuments({ role: 'member', isActive: true });
      const completedTasks = await Task.countDocuments({ status: 'completed' });
      const overdueTasks = await Task.countDocuments({
        status: { $ne: 'completed' },
        dueDate: { $lt: now }
      });

      // Progress Overview (Average Completion % of all projects)
      const projects = await Project.find({}).populate('tasks');
      let totalProgress = 0;
      for (const proj of projects) {
        const tasksCount = await Task.countDocuments({ project: proj._id });
        const completedCount = await Task.countDocuments({ project: proj._id, status: 'completed' });
        const projectProgress = tasksCount > 0 ? (completedCount / tasksCount) * 100 : 0;
        totalProgress += projectProgress;
      }
      const progressOverview = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

      return res.status(200).json({
        success: true,
        stats: {
          totalProjects,
          totalTasks,
          activeEmployees,
          completedTasks,
          overdueTasks,
          progressOverview,
        }
      });
    } else if (role === 'manager') {
      // Project Manager dashboard metrics (managed projects only)
      const managedProjects = await Project.find({
        $or: [
          { owner: req.user._id },
          { assignedManager: req.user._id },
          { 'members.user': req.user._id },
        ],
      }).select('_id');
      const managedIds = managedProjects.map(p => p._id);

      const projectsCount = managedIds.length;
      const activeTasks = await Task.countDocuments({
        project: { $in: managedIds },
        status: { $ne: 'completed' }
      });

      // Upcoming deadlines (due in the next 7 days)
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const upcomingDeadlines = await Task.countDocuments({
        project: { $in: managedIds },
        status: { $ne: 'completed' },
        dueDate: { $gte: now, $lte: sevenDaysLater }
      });

      // Employee Productivity (Total hours logged in managed tasks)
      const tasksInManaged = await Task.find({ project: { $in: managedIds } }).select('_id');
      const taskIds = tasksInManaged.map(t => t._id);
      const hoursLoggedData = await WorkLog.aggregate([
        { $match: { task: { $in: taskIds } } },
        { $group: { _id: null, total: { $sum: '$hoursWorked' } } }
      ]);
      const employeeProductivityHours = hoursLoggedData.length > 0 ? hoursLoggedData[0].total : 0;

      return res.status(200).json({
        success: true,
        stats: {
          managedProjects: projectsCount,
          activeTasks,
          upcomingDeadlines,
          employeeProductivity: employeeProductivityHours,
        }
      });
    } else {
      // Employee / Member dashboard metrics (assigned tasks only)
      const assignedTasks = await Task.countDocuments({ assignedTo: req.user._id });
      const completedTasks = await Task.countDocuments({ assignedTo: req.user._id, status: 'completed' });

      // Due soon (due in next 48 hours)
      const fortyEightHoursLater = new Date();
      fortyEightHoursLater.setHours(fortyEightHoursLater.getHours() + 48);
      const tasksDueSoon = await Task.countDocuments({
        assignedTo: req.user._id,
        status: { $ne: 'completed' },
        dueDate: { $gte: now, $lte: fortyEightHoursLater }
      });

      // Recent Activity Logs related to this user
      const recentActivity = await AuditLog.find({ user: req.user._id })
        .sort({ timestamp: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        stats: {
          assignedTasks,
          completedTasks,
          tasksDueSoon,
          recentActivity,
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get completion reports for all or specific projects
// @route   GET /api/reports/projects/:id
// @access  Private (Admin & PM)
const getProjectReport = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('assignedManager', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // RBAC: Verify PM or Admin access
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAssignedPM = project.assignedManager && project.assignedManager.toString() === req.user._id.toString();
    const isManagerInTeam = project.members?.some(m => m.user.toString() === req.user._id.toString() && m.role === 'manager');
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedPM && !isManagerInTeam && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view project reports' });
    }

    const tasks = await Task.find({ project: project._id });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Breakdown of statuses
    const statusCounts = { todo: 0, 'in-progress': 0, 'in-review': 0, completed: 0, blocked: 0 };
    tasks.forEach(t => {
      if (statusCounts[t.status] !== undefined) {
        statusCounts[t.status]++;
      }
    });

    // Breakdown of priority
    const priorityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    tasks.forEach(t => {
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
    });

    res.status(200).json({
      success: true,
      report: {
        projectName: project.name,
        description: project.description,
        status: project.status,
        manager: project.assignedManager?.name || 'Unassigned',
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate,
        statusCounts,
        priorityCounts,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get employee performance reports
// @route   GET /api/reports/employees
// @access  Private (Admin & PM)
const getEmployeeReport = async (req, res) => {
  try {
    // Only Admin and Managers can access reports
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Not authorized to view employee reports' });
    }

    // Get all employees (role: member)
    const employees = await User.find({ role: 'member', isActive: true }).select('name email avatar');
    const reportData = [];

    for (const employee of employees) {
      // Find tasks assigned to this employee
      const tasks = await Task.find({ assignedTo: employee._id });
      const assignedTasksCount = tasks.length;
      const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

      // Sum hours logged by this employee from WorkLog
      const workLogs = await WorkLog.find({ employee: employee._id });
      const totalHoursLogged = workLogs.reduce((acc, log) => acc + log.hoursWorked, 0);

      // Average task completion time in hours
      let totalCompletionTimeMs = 0;
      let completedTaskWithHistoryCount = 0;

      for (const task of tasks) {
        if (task.status === 'completed') {
          // Find transition to completed in history
          const completionLog = task.history.find(
            h => h.action === 'STATUS_CHANGE' && h.newValue === 'completed'
          );

          if (completionLog) {
            const timeDiff = new Date(completionLog.timestamp).getTime() - new Date(task.createdAt).getTime();
            totalCompletionTimeMs += timeDiff;
            completedTaskWithHistoryCount++;
          }
        }
      }

      const avgCompletionTimeHours = completedTaskWithHistoryCount > 0
        ? Math.round((totalCompletionTimeMs / (1000 * 60 * 60)) / completedTaskWithHistoryCount)
        : 0;

      reportData.push({
        employeeId: employee._id,
        name: employee.name,
        email: employee.email,
        avatar: employee.avatar,
        assignedTasks: assignedTasksCount,
        completedTasks: completedTasksCount,
        totalHoursLogged,
        avgCompletionTimeHours,
      });
    }

    res.status(200).json({ success: true, report: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system-wide audit activity logs (Admin only)
// @route   GET /api/reports/audit-logs
// @access  Private (Admin only)
const getSystemAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view audit logs' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const total = await AuditLog.countDocuments({});
    const logs = await AuditLog.find({})
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getProjectReport,
  getEmployeeReport,
  getSystemAuditLogs,
};
