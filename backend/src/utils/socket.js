const { Server } = require('socket.io');
const notificationEvents = require('./notificationEvents');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a personal room for notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`👤 Socket ${socket.id} joined room: user_${userId}`);
      }
    });

    // Join a room for a specific task (for comments/updates)
    socket.on('join_task', (taskId) => {
      if (taskId) {
        socket.join(`task_${taskId}`);
        console.log(`📝 Socket ${socket.id} joined room: task_${taskId}`);
      }
    });

    // Leave a task room
    socket.on('leave_task', (taskId) => {
      if (taskId) {
        socket.leave(`task_${taskId}`);
        console.log(`📝 Socket ${socket.id} left room: task_${taskId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Listen to mongoose notification save events
  notificationEvents.on('new-notification', (doc) => {
    if (doc && doc.user) {
      const userId = doc.user.toString();
      sendToUser(userId, 'notification', doc);
      console.log(`📡 Emitted real-time notification to user_${userId}`);
    }
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Send unified structure event to a user
const sendToUser = (userId, eventType, data) => {
  if (io) {
    io.to(`user_${userId}`).emit('event', { type: eventType, data });
  }
};

const mongoose = require('mongoose');

// Send unified structure event to all project members associated with the task
const sendToTask = async (taskId, eventType, data) => {
  if (!io) return;

  try {
    let project = data?.task?.project;

    // If project is not populated in data, fetch it from DB
    if (!project || typeof project === 'string') {
      const Task = mongoose.model('Task');
      const taskDoc = await Task.findById(taskId).populate({
        path: 'project',
        select: 'owner assignedManager members',
      });
      project = taskDoc?.project;
    }

    if (!project) {
      console.warn(`⚠️ Project not found for task ${taskId}, falling back to room emission`);
      io.to(`task_${taskId}`).emit('event', { type: eventType, data });
      return;
    }

    const userIds = new Set();
    if (project.owner) {
      const ownerId = project.owner._id || project.owner;
      if (ownerId) userIds.add(ownerId.toString());
    }
    if (project.assignedManager) {
      const managerId = project.assignedManager._id || project.assignedManager;
      if (managerId) userIds.add(managerId.toString());
    }
    if (project.members && project.members.length > 0) {
      project.members.forEach((m) => {
        const uId = m.user?._id || m.user;
        if (uId) userIds.add(uId.toString());
      });
    }

    // Emit to each project member's personal room
    userIds.forEach((userId) => {
      sendToUser(userId, eventType, data);
    });
    console.log(`📡 Emitted real-time task event '${eventType}' to ${userIds.size} members of project ${project._id || project}`);
  } catch (err) {
    console.error(`❌ Error in sendToTask socket emit:`, err);
    // Fallback: emit to task room
    io.to(`task_${taskId}`).emit('event', { type: eventType, data });
  }
};

module.exports = {
  initSocket,
  getIo,
  sendToUser,
  sendToTask,
};
