require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const app = express();

// Initialize Neon PostgreSQL Client using connection string from environment variables
const sql = neon(process.env.DATABASE_URL);

// Middleware
app.use(express.json());
app.use(cors());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is active and running.' });
});

// --------------------------------------------------
// 1. SIGNUP ENDPOINT (/api/signup)
// --------------------------------------------------
app.post('/api/signup', async (req, res) => {
  try {
    let { name, email, password, age, college } = req.body;

    // Sanitize and trim inputs
    name = name ? name.trim() : '';
    email = email ? email.trim().toLowerCase() : '';
    password = password ? password.trim() : '';
    college = college ? college.trim() : '';
    const parsedAge = parseInt(age, 10);

    // Backend Validation Checks
    if (!name || !email || !password || !age || !college) {
      return res.status(400).json({ message: 'All fields (Name, Email, Password, Age, College) are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
      return res.status(400).json({ message: 'Please enter a valid age (between 13 and 120).' });
    }

    // Check if account with email already exists in database
    const existingUsers = await sql`SELECT id FROM users WHERE LOWER(email) = ${email}`;
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'An account with this email address already exists.' });
    }

    // Encrypt password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store complete profile with hashed password into Neon DB
    const newUser = await sql`
      INSERT INTO users (name, email, password, age, college)
      VALUES (${name}, ${email}, ${hashedPassword}, ${parsedAge}, ${college})
      RETURNING id, name, email, age, college, created_at
    `;

    return res.status(201).json({
      message: 'Account registered successfully!',
      user: newUser[0]
    });

  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ message: 'Internal server error during account creation.' });
  }
});

// --------------------------------------------------
// 2. LOGIN ENDPOINT (/api/login)
// --------------------------------------------------
app.post('/api/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    // Sanitize inputs
    email = email ? email.trim().toLowerCase() : '';
    password = password ? password.trim() : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Both email and password are required.' });
    }

    // Query user profile by email
    const users = await sql`SELECT * FROM users WHERE LOWER(email) = ${email}`;
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Verify raw input password against bcrypt hash from database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Return profile data (excluding password)
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
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Start express application on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

module.exports = app;