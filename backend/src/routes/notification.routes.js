const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  streamNotifications,
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // Require auth for all notification routes

router.get('/', getNotifications);
router.get('/stream', streamNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
