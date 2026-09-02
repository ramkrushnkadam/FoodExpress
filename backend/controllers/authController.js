const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==========================================
// REGISTER (Always creates role: "customer")
// ==========================================

const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            mobile,
            address
        } = req.body;

        // Check required fields
        if (!name || !email || !password || !mobile) {
            return res.status(400).json({
                message: "Please fill all required fields (name, email, password, mobile)"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        // Check existing user
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists with this email"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user - Force role: "customer"
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            mobile: mobile.trim(),
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
// GET LOGGED-IN USER PROFILE (GET /api/auth/me)
// ==========================================

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
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
        if (mobile && mobile.trim()) updates.mobile = mobile.trim();
        if (address !== undefined) updates.address = String(address).trim();

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters" });
            }
            updates.password = await bcrypt.hash(password, 10);
        }

        // Strictly do NOT allow updating role or id
        delete updates.role;
        delete updates._id;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select("-password");

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
    registerUser,
    loginUser,
    getMe,
    updateCustomerProfile
};