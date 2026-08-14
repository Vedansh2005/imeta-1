require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(express.json());
app.use(cors());

// Store login OTPs temporarily
const otpStore = new Map();
const verifiedLogins = new Set();

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend is active and running.'
  });
});

// Generate login OTP
app.post('/api/send-login-otp', async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email ? email.trim().toLowerCase() : '';
    password = password ? password.trim() : '';

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
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

    // Generate 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP expires in 5 minutes
    otpStore.set(email, {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Reset previous verification
    verifiedLogins.delete(email);

    // Show OTP in console
    console.log('================================');
    console.log(`Login OTP for ${email}: ${otp}`);
    console.log('OTP valid for 5 minutes');
    console.log('================================');

    return res.status(200).json({
      message: 'OTP generated successfully.',
      otp: otp
    });

  } catch (error) {
    console.error('Send Login OTP Error:', error);

    return res.status(500).json({
      message: 'Failed to generate OTP.'
    });
  }
});

// Verify login OTP
app.post('/api/verify-login-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;

    email = email ? email.trim().toLowerCase() : '';
    otp = otp ? otp.trim() : '';

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required.'
      });
    }

    const storedOtp = otpStore.get(email);

    if (!storedOtp) {
      return res.status(400).json({
        message: 'OTP not found. Please generate a new OTP.'
      });
    }

    // Check expiry
    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(email);

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

    // OTP verified
    otpStore.delete(email);
    verifiedLogins.add(email);

    console.log(`Login OTP verified for ${email}`);

    return res.status(200).json({
      message: 'OTP verified successfully.'
    });

  } catch (error) {
    console.error('Verify Login OTP Error:', error);

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

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email address format.'
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Validate age
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

    // Check OTP verification
    if (!verifiedLogins.has(email)) {
      return res.status(403).json({
        message: 'Please verify the OTP before logging in.'
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

    // Remove OTP verification after login
    verifiedLogins.delete(email);

    return res.status(200).json({
      message: 'Login successful!',
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

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );
});

module.exports = app;