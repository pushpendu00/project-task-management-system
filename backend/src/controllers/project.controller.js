const Project = require('../models/project.model');
const Task = require('../models/task.model');
const { logAction } = require('../utils/auditLogger');

// @desc    Get all projects (with RBAC and filters)
// @route   GET /api/projects
// @access  Private
const getAllProjects = async (req, res) => {
  try {
    let query = {};

    // RBAC: Admins can see all. PMs and employees only see projects they are assigned to.
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { owner: req.user._id },
          { assignedManager: req.user._id },
          { 'members.user': req.user._id },
        ],
      };
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by assigned manager
    if (req.query.assignedManager) {
      query.assignedManager = req.query.assignedManager;
    }

    // Filter by date range (project start/end dates overlapping search window)
    if (req.query.startDate || req.query.endDate) {
      const dateQuery = {};
      if (req.query.startDate) {
        dateQuery.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        dateQuery.$lte = new Date(req.query.endDate);
      }
      query.startDate = dateQuery;
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('assignedManager', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const total = await Task.countDocuments({ project: project._id });
        const completed = await Task.countDocuments({ project: project._id, status: 'completed' });
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        const projectObj = project.toJSON();
        projectObj.progress = progress;
        return projectObj;
      })
    );

    res.status(200).json({ success: true, count: projectsWithProgress.length, projects: projectsWithProgress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('assignedManager', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found' });
    }

    // RBAC: Verify user has access to the project
    const isOwner = project.owner?._id.toString() === req.user._id.toString();
    const isAssignedPM = project.assignedManager?._id.toString() === req.user._id.toString();
    const isMember = project.members?.some(m => m.user?._id.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedPM && !isMember && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
    }

    const total = await Task.countDocuments({ project: project._id });
    const completed = await Task.countDocuments({ project: project._id, status: 'completed' });
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const projectObj = project.toJSON();
    projectObj.progress = progress;

    res.status(200).json({ success: true, project: projectObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    // RBAC: Only Admin can create projects
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to create projects' });
    }

    const project = await Project.create({
      ...req.body,
      owner: req.user._id,
    });

    await project.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'assignedManager', select: 'name email avatar' }
    ]);

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'PROJECT_CREATE',
      entity: 'Project',
      entityId: project._id,
      newValue: project.toJSON(),
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found' });
    }

    // RBAC: Only Admins or the assigned Project Manager can update the project details
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAssignedPM = project.assignedManager && project.assignedManager.toString() === req.user._id.toString();
    const isManagerInTeam = project.members?.some(m => m.user.toString() === req.user._id.toString() && m.role === 'manager');
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedPM && !isManagerInTeam && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to update this project' });
    }

    const previousValue = project.toJSON();

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('assignedManager', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'PROJECT_UPDATE',
      entity: 'Project',
      entityId: project._id,
      previousValue,
      newValue: updated.toJSON(),
    });

    const total = await Task.countDocuments({ project: updated._id });
    const completed = await Task.countDocuments({ project: updated._id, status: 'completed' });
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const projectObj = updated.toJSON();
    projectObj.progress = progress;

    res.status(200).json({ success: true, project: projectObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found' });
    }

    // RBAC: Only admin can delete projects
    if (req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to delete projects' });
    }

    const previousValue = project.toJSON();
    await project.deleteOne();

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'PROJECT_DELETE',
      entity: 'Project',
      entityId: project._id,
      previousValue,
    });

    res
      .status(200)
      .json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found' });
    }

    // RBAC: Only Admin or Project Manager of this project can add members
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAssignedPM = project.assignedManager && project.assignedManager.toString() === req.user._id.toString();
    const isManagerInTeam = project.members?.some(m => m.user.toString() === req.user._id.toString() && m.role === 'manager');
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedPM && !isManagerInTeam && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage project members' });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userId
    );
    if (alreadyMember) {
      return res
        .status(400)
        .json({ success: false, message: 'User is already a member' });
    }

    const previousValue = project.toJSON();
    project.members.push({ user: userId, role: role || 'developer' });
    await project.save();
    
    const updated = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('assignedManager', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'PROJECT_MEMBER_ADD',
      entity: 'Project',
      entityId: project._id,
      previousValue,
      newValue: updated.toJSON(),
    });

    const total = await Task.countDocuments({ project: updated._id });
    const completed = await Task.countDocuments({ project: updated._id, status: 'completed' });
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const projectObj = updated.toJSON();
    projectObj.progress = progress;

    res.status(200).json({ success: true, project: projectObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found' });
    }

    // RBAC: Only Admin or Project Manager of this project can remove members
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAssignedPM = project.assignedManager && project.assignedManager.toString() === req.user._id.toString();
    const isManagerInTeam = project.members?.some(m => m.user.toString() === req.user._id.toString() && m.role === 'manager');
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedPM && !isManagerInTeam && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage project members' });
    }

    const previousValue = project.toJSON();
    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );

    await project.save();

    const updated = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('assignedManager', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Audit log
    await logAction({
      userId: req.user._id,
      action: 'PROJECT_MEMBER_REMOVE',
      entity: 'Project',
      entityId: project._id,
      previousValue,
      newValue: updated.toJSON(),
    });

    const total = await Task.countDocuments({ project: updated._id });
    const completed = await Task.countDocuments({ project: updated._id, status: 'completed' });
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const projectObj = updated.toJSON();
    projectObj.progress = progress;

    res.status(200).json({ success: true, message: 'Member removed successfully', project: projectObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
