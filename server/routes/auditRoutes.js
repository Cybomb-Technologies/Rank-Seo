const express = require("express");
const router = express.Router();
const { saveAudit, getAudits } = require("../controllers/auditController");
const { verifyUser } = require("../middleware/auditMiddleware");
const { checkAuditLimit } = require("../middleware/checkAuditLimit");

// ✅ Attach middleware to routes
router.post("/create-audits", verifyUser, saveAudit); 
router.get("/audits", verifyUser, getAudits);        
router.post("/guest-audits", checkAuditLimit, saveAudit);

module.exports = router;