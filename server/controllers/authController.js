// authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// URLs configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3001';

const GITHUB_REDIRECT_URI = `${API_URL}/api/auth/github/callback`;
const GOOGLE_REDIRECT_URI = `${API_URL}/api/auth/google/callback`;
const FRONTEND_URL = CLIENT_URL;

let tokenBlacklist = [];

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// Function to send OTP email
const sendOtpEmail = async (email, otp, name) => {
    try {
        const mailOptions = {
            from: `"RankSeo.in" <${SMTP_USER}>`,
            to: email,
            subject: 'Your OTP for Verification',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="text-align: center; color: #10B981;">OTP Verification</h2>
                    <p style="font-size: 16px;">Hi ${name || 'there'},</p>
                    <p style="font-size: 16px;">Your One-Time Password (OTP) for verification is:</p>
                    <h1 style="text-align: center; font-size: 36px; color: #10B981; letter-spacing: 5px;">${otp}</h1>
                    <p style="font-size: 14px; color: #666;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
                    <hr style="margin-top: 20px; border-color: #ddd;">
                    <p style="text-align: center; font-size: 12px; color: #aaa;">Thank you!</p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email.');
    }
};

// Signup with OTP
const signup = async (req, res) => {
    const { name, email, mobile, password } = req.body;
    try {
        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        const otp = otpGenerator.generate(6, { 
            digits: true, 
            lowerCaseAlphabets: false, 
            upperCaseAlphabets: false, 
            specialChars: false 
        });
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            mobile: mobile ? mobile.trim() : undefined,
            password,
            otp,
            otpExpiresAt,
        });

        await user.save();
        await sendOtpEmail(email, otp, name);

        res.status(201).json({ 
            msg: 'OTP sent to your email. Please verify to complete signup.',
            email: email 
        });
    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({ msg: 'Server error during signup' });
    }
};

// Verify OTP and complete signup
const verifyOtpAndSignup = async (req, res) => {
    const { email, otp } = req.body;
    try {
        if (!email || !otp) {
            return res.status(400).json({ msg: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ msg: 'User not found.' });
        }
        if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP.' });
        }

        // OTP is correct, mark user as verified
        user.isVerified = true;
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        const token = jwt.sign(
            { user: { id: user._id, role: user.role || "user" } },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({ 
            msg: 'Email verified and signup successful!', 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (err) {
        console.error('OTP verification error:', err.message);
        res.status(500).json({ msg: 'Server error during OTP verification' });
    }
};

// Login
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        if (!user.password) {
            return res.status(400).json({ msg: 'Please log in with your social provider.' });
        }
       
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ msg: 'Please verify your email before logging in.' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { user: { id: user._id, role: user.role || "user" } },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                profilePicture: user.profilePicture,
                isVerified: user.isVerified
            } 
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ msg: 'Server error during login' });
    }
};

// Forgot Password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ msg: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.status(200).json({ msg: 'If the email exists, OTP will be sent.' });
        }

        const otp = otpGenerator.generate(6, { 
            digits: true, 
            lowerCaseAlphabets: false, 
            upperCaseAlphabets: false, 
            specialChars: false 
        });
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();
       
        await sendOtpEmail(email, otp, user.name);

        res.status(200).json({ msg: 'OTP sent to your email for password reset.' });
    } catch (err) {
        console.error('Forgot password error:', err.message);
        res.status(500).json({ msg: 'Server error during password reset request' });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP.' });
        }

        // Update password and clear OTP
        user.password = newPassword;
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        res.status(200).json({ msg: 'Password has been successfully reset.' });
    } catch (err) {
        console.error('Password reset error:', err.message);
        res.status(500).json({ msg: 'Server error during password reset' });
    }
};

// Get User Profile
const getProfile = async (req, res) => {
    try {
        let user = await User.findById(req.user.id)
            .select('-password -otp -otpExpiresAt')
            .populate('plan', 'name price features');

        // Ensure free plan users are active
        if (user && (user.planName === 'Free' || !user.plan) && user.subscriptionStatus !== 'active') {
            user.subscriptionStatus = 'active';
            await user.save();
        }

        res.json(user);
    } catch (err) {
        console.error('Get profile error:', err.message);
        res.status(500).json({ msg: 'Server error while fetching profile' });
    }
};

// Logout
const logoutUser = (req, res) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (token) {
        tokenBlacklist.push(token);
        // Optional: Clean up old tokens periodically
        if (tokenBlacklist.length > 1000) {
            tokenBlacklist = tokenBlacklist.slice(-500);
        }
    }
    res.json({ msg: "Logged out successfully" });
};

// GitHub OAuth
const githubAuth = (req, res) => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&scope=user:email`;
    res.redirect(githubAuthUrl);
};

const githubCallback = async (req, res) => {
    const { code, error } = req.query;
    
    try {
        if (error) {
            console.error('GitHub OAuth error:', error);
            return res.redirect(`${FRONTEND_URL}/login?error=github_oauth_failed`);
        }

        if (!code) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_authorization_code`);
        }

        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: GITHUB_REDIRECT_URI,
            },
            { headers: { Accept: 'application/json' } }
        );

        const { access_token } = tokenResponse.data;
        
        if (!access_token) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_access_token`);
        }

        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const githubUser = userResponse.data;
        const emailResponse = await axios.get('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const primaryEmailObj = emailResponse.data.find(emailObj => emailObj.primary && emailObj.verified);
        const email = primaryEmailObj ? primaryEmailObj.email : githubUser.email;
        
        if (!email) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_verified_email`);
        }

        // Find or create user - don't include mobile field for social logins
        let user = await User.findOne({ 
            $or: [
                { githubId: githubUser.id },
                { email: email.toLowerCase().trim() }
            ] 
        });

        if (!user) {
            user = new User({
                name: githubUser.name || githubUser.login,
                email: email.toLowerCase().trim(),
                profilePicture: githubUser.avatar_url,
                githubId: githubUser.id,
                isVerified: true,
                password: null,
                // Don't include mobile field
            });
            await user.save();
        } else {
            // Update existing user
            if (!user.githubId) {
                user.githubId = githubUser.id;
            }
            user.profilePicture = user.profilePicture || githubUser.avatar_url;
            user.isVerified = true;
            await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { user: { id: user._id, role: user.role || "user" } },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.redirect(`${FRONTEND_URL}`);
    } catch (err) {
        console.error("GitHub OAuth error:", err.response?.data || err.message);
        res.redirect(`${FRONTEND_URL}/login?error=github_auth_failed`);
    }
};

// Google OAuth
const googleAuth = (req, res) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
    res.redirect(googleAuthUrl);
};

const googleCallback = async (req, res) => {
    const { code, error } = req.query;
    
    try {
        if (error) {
            console.error('Google OAuth error:', error);
            return res.redirect(`${FRONTEND_URL}/login?error=google_oauth_failed`);
        }

        if (!code) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_authorization_code`);
        }

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', 
            new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code'
            }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token } = tokenResponse.data;

        // Get user info from Google
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 
                Authorization: `Bearer ${access_token}` 
            }
        });

        const googleUser = userResponse.data;
        
        if (!googleUser.email || !googleUser.sub) {
            return res.redirect(`${FRONTEND_URL}/login?error=invalid_google_user`);
        }

        // Find or create user - don't include mobile field for social logins
        let user = await User.findOne({ 
            $or: [
                { googleId: googleUser.sub },
                { email: googleUser.email.toLowerCase().trim() }
            ] 
        });

        if (!user) {
            user = new User({
                name: googleUser.name,
                email: googleUser.email.toLowerCase().trim(),
                profilePicture: googleUser.picture,
                googleId: googleUser.sub,
                isVerified: true,
                password: null,
                // Don't include mobile field
            });
            await user.save();
        } else {
            // Update existing user with Google ID if not set
            if (!user.googleId) {
                user.googleId = googleUser.sub;
            }
            user.profilePicture = user.profilePicture || googleUser.picture;
            user.isVerified = true;
            await user.save();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { user: { id: user._id, role: user.role || "user" } },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

          res.redirect(`${FRONTEND_URL}/?token=${token}&login=success&source=google`);
 
    } catch (err) {
        console.error("Google OAuth error:", err.response?.data || err.message);
        res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }
};

// Token blacklist middleware
const isTokenBlacklisted = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (token && tokenBlacklist.includes(token)) {
        return res.status(401).json({ msg: "Token has been invalidated. Please log in again." });
    }
    next();
};

module.exports = {
    signup,
    verifyOtpAndSignup,
    login,
    forgotPassword,
    resetPassword,
    getProfile,
    logoutUser,
    githubAuth,
    githubCallback,
    googleAuth,
    googleCallback,
    tokenBlacklist,
    isTokenBlacklisted
};