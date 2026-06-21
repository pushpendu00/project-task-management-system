const express = require('express');
const { body } = require('express-validator');
const {
  submitWorkLog,
  replyToWorkLog,
  getWorkLogs,
} = require('../controllers/worklog.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect); // All work log routes require authentication

router
  .route('/')
  .get(getWorkLogs)
  .post(
    [
      body('task').notEmpty().withMessage('Task ID is required'),
      body('description').notEmpty().withMessage('Description is required'),
      body('hoursWorked')
        .isFloat({ min: 0 })
        .withMessage('Hours worked must be a positive number'),
    ],
    validate,
    submitWorkLog
  );

router.post(
  '/:id/replies',
  [body('text').notEmpty().withMessage('Reply comment text is required')],
  validate,
  replyToWorkLog
);

module.exports = router;
