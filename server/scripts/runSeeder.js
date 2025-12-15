
const mongoose = require("mongoose");
const seedPricingPlans = require("../pricingPlansSeeder");
const connectDB = require("../config/db");

const run = async () => {
  await connectDB();
  await seedPricingPlans();
  console.log("Seeding complete. Exiting...");
  process.exit(0);
};

run();
