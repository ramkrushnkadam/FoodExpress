const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validates that the email is a valid Gmail address ending with @gmail.com
 */
const isValidGmail = (email) => {
    if (!email || typeof email !== "string") return false;
    const trimmed = email.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@gmail\.com$/;
    return gmailRegex.test(trimmed);
};

/**
 * Validates that the mobile number contains exactly 10 digits starting with 6, 7, 8, or 9
 */
const isValidMobile = (mobile) => {
    if (!mobile) return false;
    const cleaned = String(mobile).trim();
    return /^[6-9]\d{9}$/.test(cleaned);
};

/**
 * Validates password strength:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const isValidPassword = (password) => {
    if (!password || typeof password !== "string") return false;
    if (password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasNumber && hasSpecial;
};

// ==========================================
// REGISTER (Always creates role: "customer")
// ==========================================

const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            confirmPassword,
            mobile,
            address
        } = req.body;

        // Check required fields
        if (!name || !email || !password || !mobile) {
            return res.status(400).json({
                message: "Please fill all required fields (name, email, password, mobile)"
            });
        }

        if (!name.trim()) {
            return res.status(400).json({
                message: "Please enter your full name."
            });
        }

        // Email validation: must be valid Gmail
        if (!isValidGmail(email)) {
            return res.status(400).json({
                message: "Please enter a valid Gmail address."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Mobile validation: 10 digits
        if (!isValidMobile(mobile)) {
            return res.status(400).json({
                message: "Mobile number must be exactly 10 digits."
            });
        }

        const normalizedMobile = String(mobile).trim();

        // Password strength validation
        if (!isValidPassword(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            });
        }

        // Confirm password check (if supplied)
        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match."
            });
        }

        // Check existing user by email
        const existingEmailUser = await User.findOne({ email: normalizedEmail });
        if (existingEmailUser) {
            return res.status(400).json({
                message: "A user already exists with this Gmail address."
            });
        }

        // Check existing user by mobile
        const existingMobileUser = await User.findOne({ mobile: normalizedMobile });
        if (existingMobileUser) {
            return res.status(400).json({
                message: "A user already exists with this mobile number."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user - Force role: "customer"
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            mobile: normalizedMobile,
            address: address ? address.trim() : "",
            role: "customer"
        });

        // Create JWT for immediate seamless login
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                address: user.address,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Register Error:", error.message);
        res.status(500).json({
            message: "Server error during registration"
        });
    }
};

// ==========================================
// LOGIN
// ==========================================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Validate Gmail format for customer login
        if (!isValidGmail(email)) {
            return res.status(400).json({
                message: "Please enter a valid Gmail address."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                address: user.address,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(500).json({
            message: "Server error during login"
        });
    }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Please enter your registered Gmail address."
            });
        }

        if (!isValidGmail(email)) {
            return res.status(400).json({
                message: "Please enter a valid Gmail address."
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                message: "No registered account found with this Gmail address."
            });
        }

        // Generate a cryptographically secure 32-byte reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token for database storage (single-use, expires in 1 hour)
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

        await user.save();

        const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        res.status(200).json({
            message: "Password reset link has been sent to your Gmail address.",
            resetUrl
        });

    } catch (error) {
        console.error("Forgot Password Error:", error.message);
        res.status(500).json({
            message: "Failed to process password reset request"
        });
    }
};

// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const token = req.params.token || req.body.token;
        const { password, confirmPassword } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Reset token is missing or invalid."
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "New password is required."
            });
        }

        // Validate password strength
        if (!isValidPassword(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            });
        }

        // Confirm password match
        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match."
            });
        }

        // Hash the incoming token to match database
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired password reset token."
            });
        }

        // Hash new password and clear reset token fields
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        res.status(200).json({
            message: "Password has been reset successfully. You can now login with your new password."
        });

    } catch (error) {
        console.error("Reset Password Error:", error.message);
        res.status(500).json({
            message: "Failed to reset password"
        });
    }
};

// ==========================================
// GET LOGGED-IN USER PROFILE (GET /api/auth/me)
// ==========================================

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpires");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User profile fetched successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                address: user.address,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error("Get Profile Error:", error.message);
        res.status(500).json({ message: "Unable to fetch user profile" });
    }
};

// ==========================================
// UPDATE CUSTOMER PROFILE (PUT /api/auth/profile)
// ==========================================

const updateCustomerProfile = async (req, res) => {
    try {
        const updates = {};
        const { name, mobile, address, password } = req.body;

        if (name && name.trim()) updates.name = name.trim();

        if (mobile && mobile.trim()) {
            if (!isValidMobile(mobile)) {
                return res.status(400).json({
                    message: "Mobile number must be exactly 10 digits."
                });
            }
            updates.mobile = mobile.trim();
        }

        if (address !== undefined) updates.address = String(address).trim();

        if (password) {
            if (!isValidPassword(password)) {
                return res.status(400).json({
                    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
                });
            }
            updates.password = await bcrypt.hash(password, 10);
        }

        // Strictly do NOT allow updating role, id, or reset tokens
        delete updates.role;
        delete updates._id;
        delete updates.resetPasswordToken;
        delete updates.resetPasswordExpires;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select("-password -resetPasswordToken -resetPasswordExpires");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                address: updatedUser.address,
                role: updatedUser.role
            }
        });
    } catch (error) {
        console.error("Update Profile Error:", error.message);
        res.status(400).json({ message: error.message || "Failed to update profile" });
    }
};

module.exports = {
    isValidGmail,
    isValidMobile,
    isValidPassword,
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getMe,
    updateCustomerProfile
};