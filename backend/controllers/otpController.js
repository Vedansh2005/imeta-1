const sql = require('../config/db');

// Store signup OTPs temporarily
const signupOtpStore = new Map();
const verifiedSignups = new Set();

// Generate signup OTP
const sendSignupOtp = async (req, res) => {
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
};

// Verify signup OTP
const verifySignupOtp = async (req, res) => {
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
};

module.exports = {
  sendSignupOtp,
  verifySignupOtp,
  verifiedSignups
};
