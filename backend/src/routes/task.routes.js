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
  [
    body('text').custom((value, { req }) => {
      if (!value?.trim() && !req.body.attachmentUrl) {
        throw new Error('Comment text or attachment is required');
      }
      return true;
    }),
  ],
  validate,
  addComment
);

module.exports = router;
