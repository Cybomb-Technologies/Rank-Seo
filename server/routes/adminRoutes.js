const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin"); // Changed from User to Admin
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "rankseo-secret-key";
const { 
  getDashboardData,
  getToolData 
} = require("../controllers/adminController");

// ✅ Allowed domains (bypass token verification)
const ALLOWED_DOMAINS = [
  "https://rankseoadmin.rankseo.com",
  "http://localhost:5173",
];

// ✅ Auth Middleware (Modified)
const verifyAdmin = async (req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer || "";

  // If request is from allowed domain, skip token check
  if (
    (origin && ALLOWED_DOMAINS.includes(origin)) ||
    ALLOWED_DOMAINS.some((d) => referer.startsWith(d))
  ) {
    console.log("✅ Domain allowed without token:", origin || referer);
    return next();
  }

  // Otherwise, verify JWT
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Invalid Token:", error.message);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

// ✅ Admin Registration (Store plain text password for visibility)
const createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists with this email",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Store both hashed and plain text passwords
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin with both passwords
    const newAdmin = new Admin({
      email,
      password: hashedPassword,
      plainPassword: password, // Store plain text password for visibility
    });

    await newAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: newAdmin._id,
        email: newAdmin.email,
        isAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      token,
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        password: password, // Return plain password in response
      },
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// ✅ Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
        isAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        password: admin.plainPassword, // Return plain password
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Get All Admins WITH PASSWORDS
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .sort({ createdAt: -1 });

    console.log("🔍 Fetched admins with passwords:", admins);

    // Return admins with plain text passwords
    const adminsWithPasswords = admins.map(admin => ({
      id: admin._id,
      email: admin.email,
      password: admin.plainPassword || "No password set",
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    }));

    res.json({
      success: true,
      admins: adminsWithPasswords,
      count: admins.length,
    });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Get Single Admin WITH PASSWORD
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        password: admin.plainPassword || "No password set",
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      },
    });
  } catch (error) {
    console.error("Get admin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Update Admin
const updateAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { id } = req.params;

    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Update email if provided
    if (email) admin.email = email;

    // Update password if provided
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }
      
      // Update both hashed and plain passwords
      const saltRounds = 12;
      admin.password = await bcrypt.hash(password, saltRounds);
      admin.plainPassword = password;
    }

    await admin.save();

    res.json({
      success: true,
      message: "Admin updated successfully",
      admin: {
        id: admin._id,
        email: admin.email,
        password: admin.plainPassword,
      },
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Delete Admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user && req.user.adminId === id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Special endpoint to get passwords only
const getAdminPasswords = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select("email plainPassword createdAt")
      .sort({ createdAt: -1 });

    console.log("🔐 Fetched admins with plain passwords:", admins);

    res.json({
      success: true,
      admins: admins.map(admin => ({
        id: admin._id,
        email: admin.email,
        password: admin.plainPassword || "No password set",
        createdAt: admin.createdAt
      })),
      count: admins.length,
    });
  } catch (error) {
    console.error("Get admin passwords error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Token Verify Endpoint
const verifyToken = (req, res) => {
  res.json({
    success: true,
    admin: req.user || "Bypassed (allowed domain)",
  });
};

// Routes
router.post("/create-admin", createAdmin);
router.post("/admin/login", adminLogin);
router.get("/admin/dashboard", verifyAdmin, getDashboardData);
router.get("/admin/users", verifyAdmin, getAllAdmins); // Updated to getAllAdmins
router.get("/admin/tool-data/:tool", verifyAdmin, getToolData);

// Additional admin management routes
router.get("/admin", verifyAdmin, getAllAdmins);
router.get("/admin/:id", verifyAdmin, getAdminById);
router.put("/admin/:id", verifyAdmin, updateAdmin);
router.delete("/admin/:id", verifyAdmin, deleteAdmin);
router.get("/admin-passwords", verifyAdmin, getAdminPasswords);
router.get("/verify", verifyAdmin, verifyToken);

module.exports = router;