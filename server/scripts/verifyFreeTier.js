
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const PricingPlan = require("../models/PricingPlan");
const { getPlanLimits } = require("../middleware/auditMiddleware");

const verify = async () => {
    await connectDB();

    console.log("--- Verifying Free Plan Existence ---");
    const freePlan = await PricingPlan.findOne({ isFree: true });
    if (!freePlan) {
        console.error("❌ Free plan not found in DB!");
        process.exit(1);
    }
    console.log("✅ Free plan found:", freePlan.name, freePlan._id);

    console.log("--- Verifying Logic for Defaults ---");
    // Test 1: User with "starter" string (simulating legacy/default user)
    console.log("Test 1: planId = 'starter'");
    const limits1 = await getPlanLimits("starter");
    
    if (limits1.planId && limits1.planId.toString() === freePlan._id.toString()) {
        console.log("✅ Correctly resolved 'starter' string to Free plan from DB");
    } else {
        console.error("❌ Failed: 'starter' did not resolve to Free plan ID. Got:", limits1);
    }

    // Test 2: User with null plan
    console.log("Test 2: planId = null");
    const limits2 = await getPlanLimits(null);
    if (limits2.planId && limits2.planId.toString() === freePlan._id.toString()) {
        console.log("✅ Correctly resolved null to Free plan from DB");
    } else {
        console.error("❌ Failed: null did not resolve to Free plan ID. Got:", limits2);
    }
    
    // Test 3: Check values
    if (limits1.maxAuditsPerMonth === 5) {
        console.log("✅ Max audits verified at 5 (as seeded)");
    } else {
         console.warn("⚠️ Max audits mismatch. Expected 5, got:", limits1.maxAuditsPerMonth);
    }

    process.exit(0);
};

verify();
