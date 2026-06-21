const express = require('express');
const { body } = require('express-validator');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect); // All task routes require authentication

router
  .route('/')
  .get(getAllTasks)
  .post(
    [
      body('title').notEmpty().withMessage('Task title is required'),
      body('project').notEmpty().withMessage('Project ID is required'),
    ],
    validate,
    createTask
  );

router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

router.post(
  '/:id/comments',
  [body('text').notEmpty().withMessage('Comment text is required')],
  validate,
  addComment
);

module.exports = router;
