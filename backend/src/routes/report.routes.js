const express = require('express');
const {
  getDashboardStats,
  getProjectReport,
  getEmployeeReport,
  getSystemAuditLogs,
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // Require auth for all report routes

router.get('/dashboard', getDashboardStats);
router.get('/projects/:id', getProjectReport);
router.get('/employees', getEmployeeReport);
router.get('/audit-logs', getSystemAuditLogs);

module.exports = router;
