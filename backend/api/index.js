require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'imeta_secret_jwt_key_2026_secure_random_string_98765';

app.use(express.json());
app.use(cors());

// Store signup OTPs temporarily
const signupOtpStore = new Map();
const verifiedSignups = new Set();

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend is active and running.'
  });
});

// Verify Session / Get Current User
app.get('/api/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No session token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const users = await sql`
      SELECT id, name, email, age, college, created_at FROM users
      WHERE id = ${decoded.id}
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

    return res.status(401).json({
      message: 'Invalid or expired session token.'
    });
  }
});

// Generate signup OTP
app.post('/api/send-signup-otp', async (req, res) => {
  try {
    let { email } = req.body;

    email = email ? email.trim().toLowerCase() : '';

    if (!email) {
      return res.status(400).json({
        message: 'Email address is required.'
      });
    }

    // Validate Email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address (e.g. user@gmail.com).'
      });
    }

    // Check if user already exists
    const users = await sql`
      SELECT id FROM users
      WHERE LOWER(email) = ${email}
    `;

    if (users.length > 0) {
      return res.status(409).json({
        message: 'An account with this email address already exists.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP expires in 5 minutes
    signupOtpStore.set(email, {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Reset previous signup verification
    verifiedSignups.delete(email);

    // Show OTP in console
    console.log('================================');
    console.log(`Signup OTP for ${email}: ${otp}`);
    console.log('OTP valid for 5 minutes');
    console.log('================================');

    return res.status(200).json({
      message: 'OTP generated successfully.',
      otp: otp
    });

  } catch (error) {
    console.error('Send Signup OTP Error:', error);

    return res.status(500).json({
      message: 'Failed to generate OTP.'
    });
  }
});

// Verify signup OTP
app.post('/api/verify-signup-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;

    email = email ? email.trim().toLowerCase() : '';
    otp = otp ? otp.trim() : '';

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required.'
      });
    }

    const storedOtp = signupOtpStore.get(email);

    if (!storedOtp) {
      return res.status(400).json({
        message: 'OTP not found. Please generate a new OTP.'
      });
    }

    // Check expiry
    if (Date.now() > storedOtp.expiresAt) {
      signupOtpStore.delete(email);

      return res.status(400).json({
        message: 'OTP has expired. Please generate a new OTP.'
      });
    }

    // Check OTP
    if (storedOtp.otp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP.'
      });
    }

    // OTP verified for signup
    signupOtpStore.delete(email);
    verifiedSignups.add(email);

    console.log(`Signup OTP verified for ${email}`);

    return res.status(200).json({
      message: 'OTP verified successfully.'
    });

  } catch (error) {
    console.error('Verify Signup OTP Error:', error);

    return res.status(500).json({
      message: 'Failed to verify OTP.'
    });
  }
});

// Signup
app.post('/api/signup', async (req, res) => {
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
});

// Login
app.post('/api/login', async (req, res) => {
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

    // Generate JWT token (expires in 15 minutes)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
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
});

// Logout
app.post('/api/logout', (req, res) => {
  return res.status(200).json({
    message: 'Logged out successfully.'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );
});

module.exports = app;