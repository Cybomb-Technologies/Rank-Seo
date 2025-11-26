const express = require("express");
const router = express.Router();
const { 
  createAdmin, 
  adminLogin, 
  getDashboardData,
  getAllUsers,
  getToolData 
} = require("../controllers/adminController");
const { verifyAdmin } = require("../middleware/authMiddleware");

router.post("/create-admin", createAdmin);
router.post("/admin/login", adminLogin);
router.get("/admin/dashboard", getDashboardData);
router.get("/admin/users", getAllUsers);
router.get("/admin/tool-data/:tool", getToolData);

module.exports = router;