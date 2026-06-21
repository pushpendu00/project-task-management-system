const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const { logAction } = require('../utils/auditLogger');
const { sendEmail } = require('../config/mailer');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user._id);

    // Audit log
    await logAction({
      userId: user._id,
      action: 'USER_REGISTER',
      entity: 'User',
      entityId: user._id,
      newValue: { name, email, role },
    });

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    const userObj = user.toJSON();

    // Audit log login event
    await logAction({
      userId: user._id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
    });

    res.status(200).json({ success: true, token, user: userObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  if (req.user) {
    await logAction({
      userId: req.user._id,
      action: 'LOGOUT',
      entity: 'User',
      entityId: req.user._id,
    });
  }
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Forgot Password - request reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email address.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    await user.save();

    // Mock reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message = `
      <h3>Password Reset Request</h3>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset for your TaskFlow account. Please click the link below to reset your password:</p>
      <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
      <p>This link is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'TaskFlow Password Reset Request',
      html: message,
    });

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    // Log password update action
    await logAction({
      userId: user._id,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: user._id,
    });

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, logout, forgotPassword, resetPassword };
