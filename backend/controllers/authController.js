const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('../config/db');
const JWT_SECRET = require('../config/jwt');
const { verifiedSignups } = require('./otpController');

// Verify Session / Get Current User
const getMe = async (req, res) => {
  try {
    const users = await sql`
      SELECT id, name, email, age, college, created_at FROM users
      WHERE id = ${req.user.id}
    `;

    if (users.length === 0) {
      return res.status(404).json({
        message: 'User account not found.'
      });
    }

    return res.status(200).json({
      user: users[0]
    });

  } catch (error) {
    console.error('Session Verification Error:', error.message);

    return res.status(500).json({
      message: 'Failed to fetch user session profile.'
    });
  }
};

// Signup
const signup = async (req, res) => {
  try {
    let {
      name,
      email,
      password,
      age,
      college
    } = req.body;

    name = name ? name.trim() : '';
    email = email ? email.trim().toLowerCase() : '';
    password = password ? password.trim() : '';
    college = college ? college.trim() : '';

    const parsedAge = parseInt(age, 10);

    // Check required fields
    if (
      !name ||
      !email ||
      !password ||
      !age ||
      !college
    ) {
      return res.status(400).json({
        message: 'All fields are required.'
      });
    }

    // Check OTP verification
    if (!verifiedSignups.has(email)) {
      return res.status(403).json({
        message: 'Please verify your email address with OTP before registering.'
      });
    }

    // Validate Name (only letters and spaces)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        message: 'Full Name can only contain letters and spaces (no numbers or special characters).'
      });
    }

    // Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address (e.g. user@gmail.com).'
      });
    }

    // Validate Password
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.'
      });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*[\d\W]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must contain at least one letter and one number or special character.'
      });
    }

    // Validate Age
    if (
      isNaN(parsedAge) ||
      parsedAge < 13 ||
      parsedAge > 120
    ) {
      return res.status(400).json({
        message: 'Please enter a valid age between 13 and 120.'
      });
    }

    // Check existing user
    const existingUsers = await sql`
      SELECT id FROM users
      WHERE LOWER(email) = ${email}
    `;

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create user
    const newUser = await sql`
      INSERT INTO users
      (name, email, password, age, college)
      VALUES
      (${name}, ${email}, ${hashedPassword}, ${parsedAge}, ${college})
      RETURNING id, name, email, age, college, created_at
    `;

    // Clear signup verification
    verifiedSignups.delete(email);

    return res.status(201).json({
      message: 'Account registered successfully!',
      user: newUser[0]
    });

  } catch (error) {
    console.error('Signup Error:', error);

    return res.status(500).json({
      message: 'Internal server error during account creation.'
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email ? email.trim().toLowerCase() : '';
    password = password ? password.trim() : '';

    if (!email || !password) {
      return res.status(400).json({
        message: 'Both email and password are required.'
      });
    }

    // Find user
    const users = await sql`
      SELECT * FROM users
      WHERE LOWER(email) = ${email}
    `;

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token (expires in 10 hours)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '10h' }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        college: user.college,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Login Error:', error);

    return res.status(500).json({
      message: 'Internal server error during login.'
    });
  }
};

// Logout
const logout = (req, res) => {
  return res.status(200).json({
    message: 'Logged out successfully.'
  });
};

module.exports = {
  getMe,
  signup,
  login,
  logout
};
