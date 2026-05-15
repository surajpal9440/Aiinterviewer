/**
 * authService.js — Authentication service
 * Handles user registration and login with bcrypt + JWT.
 * Direct port of Java AuthService.
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * Register a new user
 */
async function register(username, email, password, fullName) {
  // Check if email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new Error('Email already registered');
  }

  // Check if username already exists
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new Error('Username already taken');
  }

  // Create user with hashed password
  const passwordHash = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    email,
    passwordHash,
    fullName
  });

  const savedUser = await user.save();

  // Generate JWT
  const token = generateToken(savedUser._id.toString(), savedUser.username);

  return {
    token,
    username: savedUser.username,
    fullName: savedUser.fullName,
    userId: savedUser._id.toString(),
    message: 'Registration successful'
  };
}

/**
 * Login user
 */
async function login(email, password) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user._id.toString(), user.username);

  return {
    token,
    username: user.username,
    fullName: user.fullName,
    userId: user._id.toString(),
    message: 'Login successful'
  };
}

module.exports = { register, login };
