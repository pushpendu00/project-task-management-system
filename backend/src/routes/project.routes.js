const express = require('express');
const { body } = require('express-validator');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect); // All project routes require authentication

router
  .route('/')
  .get(getAllProjects)
  .post(
    [body('name').notEmpty().withMessage('Project name is required')],
    validate,
    createProject
  );

router
  .route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.route('/:id/members').post(addMember);
router.route('/:id/members/:userId').delete(removeMember);

module.exports = router;
