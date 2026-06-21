const User = require('../models/user.model');
const { logAction } = require('../utils/auditLogger');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res) => {
  try {
    // If not admin, only show active users. Admins can see all.
    const query = req.user.role === 'admin' ? {} : { isActive: true };
    const users = await User.find(query).select('-password');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to create users' });
    }

    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const newUser = await User.create({
      name,
      email,
      password: password || 'TaskFlow123!', // fallback password
      role: role || 'member',
    });

    const userObj = newUser.toJSON();

    await logAction({
      userId: req.user._id,
      action: 'USER_CREATE',
      entity: 'User',
      entityId: newUser._id,
      newValue: { name, email, role: role || 'member' },
    });

    res.status(201).json({ success: true, user: userObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile / settings
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, avatar, password } = req.body;

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Users can only update their own profile unless admin
    const isSelf = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to update this user' });
    }

    const previousValue = userToUpdate.toJSON();
    const updateData = {};

    // Fields that anyone can update for themselves
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (password) updateData.password = password; // pre-save hook will hash it

    // Fields that only Admin can update or update emails
    if (isAdmin) {
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    } else {
      // Self can update email but let's check validation
      if (email !== undefined && email !== userToUpdate.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        updateData.email = email;
      }
    }

    // Perform update
    // If updating password, we want to run the pre-save hook, so we save the document manually
    Object.assign(userToUpdate, updateData);
    await userToUpdate.save();

    const updatedUser = await User.findById(req.params.id).select('-password');

    await logAction({
      userId: req.user._id,
      action: 'USER_UPDATE',
      entity: 'User',
      entityId: userToUpdate._id,
      previousValue,
      newValue: updatedUser.toJSON(),
    });

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userToDeactivate = await User.findById(req.params.id);
    if (!userToDeactivate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousValue = userToDeactivate.toJSON();

    userToDeactivate.isActive = false;
    await userToDeactivate.save();

    await logAction({
      userId: req.user._id,
      action: 'USER_DELETE',
      entity: 'User',
      entityId: userToDeactivate._id,
      previousValue,
      newValue: { isActive: false },
    });

    res
      .status(200)
      .json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
