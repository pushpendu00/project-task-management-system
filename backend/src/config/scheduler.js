const Task = require('../models/task.model');
const Notification = require('../models/notification.model');
const { sendEmail } = require('./mailer');

/**
 * Checks all tasks against deadlines and dispatches alerts/reminders
 */
const runDeadlineChecks = async () => {
  try {
    console.log('⏰ [Scheduler] Scanning tasks for upcoming deadlines and overdue statuses...');
    
    // Find all tasks that are not completed (we check status != 'completed')
    const tasks = await Task.find({ status: { $ne: 'completed' } })
      .populate('assignedTo')
      .populate({
        path: 'project',
        populate: [
          { path: 'assignedManager' },
          { path: 'owner' }
        ]
      });

    const now = new Date();

    for (const task of tasks) {
      if (!task.dueDate) continue;

      const dueDate = new Date(task.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const hoursLeft = diffMs / (1000 * 60 * 60);

      // Overdue Check
      if (hoursLeft <= 0) {
        if (!task.sentReminders.includes('overdue')) {
          // Prevent duplicates
          task.sentReminders.push('overdue');
          await task.save();

          const employee = task.assignedTo;
          const manager = task.project?.assignedManager || task.project?.owner;
          const dueDateStr = dueDate.toLocaleString();

          // 1. Employee Notification & Email
          if (employee) {
            await Notification.create({
              user: employee._id,
              type: 'overdue',
              message: `Task Overdue Alert: The deadline for "${task.title}" has passed (${dueDateStr}).`,
            });

            await sendEmail({
              to: employee.email,
              subject: `🚨 OVERDUE TASK: "${task.title}"`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ffccd5; background-color: #fff0f3; border-radius: 8px;">
                  <h2 style="color: #da3633; margin-top: 0;">Task Deadline Passed</h2>
                  <p>Hello <strong>${employee.name}</strong>,</p>
                  <p>The deadline for your assigned task <strong>"${task.title}"</strong> under project <strong>"${task.project?.name || 'N/A'}"</strong> has passed.</p>
                  <p><strong>Due Date:</strong> ${dueDateStr}</p>
                  <p>Please update the task status, submit your work log, or contact your Project Manager if you are blocked.</p>
                </div>
              `,
            });
          }

          // 2. Manager Notification & Email
          if (manager) {
            await Notification.create({
              user: manager._id,
              type: 'overdue',
              message: `Overdue Task Alert: "${task.title}" assigned to ${employee ? employee.name : 'Unassigned'} has passed its deadline.`,
            });

            await sendEmail({
              to: manager.email,
              subject: `🚨 OVERDUE TASK: "${task.title}" (${employee ? employee.name : 'Unassigned'})`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ffccd5; background-color: #fff0f3; border-radius: 8px;">
                  <h2 style="color: #da3633; margin-top: 0;">Assigned Task Overdue Alert</h2>
                  <p>Hello <strong>${manager.name}</strong>,</p>
                  <p>The task <strong>"${task.title}"</strong> under project <strong>"${task.project?.name || 'N/A'}"</strong> is now overdue.</p>
                  <p><strong>Assigned To:</strong> ${employee ? employee.name : 'Unassigned'}</p>
                  <p><strong>Due Date:</strong> ${dueDateStr}</p>
                </div>
              `,
            });
          }
        }
      } else {
        // Upcoming Reminder thresholds: 1h, 12h, 24h, 48h
        let reminderType = null;
        let label = '';

        if (hoursLeft <= 1) {
          reminderType = '1h';
          label = '1 hour';
        } else if (hoursLeft <= 12) {
          reminderType = '12h';
          label = '12 hours';
        } else if (hoursLeft <= 24) {
          reminderType = '24h';
          label = '24 hours';
        } else if (hoursLeft <= 48) {
          reminderType = '48h';
          label = '48 hours';
        }

        if (reminderType && !task.sentReminders.includes(reminderType)) {
          task.sentReminders.push(reminderType);
          await task.save();

          const employee = task.assignedTo;
          const manager = task.project?.assignedManager || task.project?.owner;
          const dueDateStr = dueDate.toLocaleString();

          // 1. Notify employee
          if (employee) {
            await Notification.create({
              user: employee._id,
              type: 'reminder',
              message: `Deadline Reminder: Task "${task.title}" is due in less than ${label}.`,
            });

            await sendEmail({
              to: employee.email,
              subject: `⏰ Upcoming Task Deadline: "${task.title}" (${label} remaining)`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #c7d2fe; background-color: #f5f7ff; border-radius: 8px;">
                  <h2 style="color: #4f46e5; margin-top: 0;">Task Due Soon</h2>
                  <p>Hello <strong>${employee.name}</strong>,</p>
                  <p>Your assigned task <strong>"${task.title}"</strong> is due in less than <strong>${label}</strong>.</p>
                  <p><strong>Due Date:</strong> ${dueDateStr}</p>
                  <p>Please log your hours and progress appropriately.</p>
                </div>
              `,
            });
          }

          // 2. Notify Manager (alerting them of upcoming tasks for assigned employees)
          if (manager) {
            await Notification.create({
              user: manager._id,
              type: 'reminder',
              message: `Upcoming Deadline: Task "${task.title}" assigned to ${employee ? employee.name : 'Unassigned'} is due in less than ${label}.`,
            });

            await sendEmail({
              to: manager.email,
              subject: `⏰ Upcoming Task Deadline: "${task.title}" assigned to ${employee ? employee.name : 'Unassigned'}`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 8px;">
                  <h2 style="color: #475569; margin-top: 0;">Upcoming Task Deadline Alert</h2>
                  <p>Hello <strong>${manager.name}</strong>,</p>
                  <p>The task <strong>"${task.title}"</strong> assigned to <strong>${employee ? employee.name : 'Unassigned'}</strong> is due in less than <strong>${label}</strong>.</p>
                  <p><strong>Project:</strong> ${task.project?.name || 'N/A'}</p>
                  <p><strong>Due Date:</strong> ${dueDateStr}</p>
                </div>
              `,
            });
          }
        }
      }
    }
    console.log('⏰ [Scheduler] Task scans and reminders checked successfully.');
  } catch (error) {
    console.error('❌ [Scheduler] Error running deadline checks:', error);
  }
};

/**
 * Initializes the background jobs
 */
const initScheduler = () => {
  // Check tasks shortly after startup
  setTimeout(runDeadlineChecks, 5000);

  // Scan every 15 minutes
  setInterval(runDeadlineChecks, 15 * 60 * 1000);
  console.log('⏰ [Scheduler] Background reminder scheduler initialized (scanning every 15 minutes).');
};

module.exports = {
  initScheduler,
  runDeadlineChecks
};
