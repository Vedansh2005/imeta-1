require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('../routes/authRoutes');

const app = express();

app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend is active and running.'
  });
});

// Mount authentication & OTP API routes
app.use('/api', authRoutes);

// Start server locally
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );
});

module.exports = app;