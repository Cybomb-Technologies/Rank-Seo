// controllers/pricingController.js
const Payment = require("../models/Payment");
const User = require("../models/User");

// Create Payment & Update User isPro
exports.createPayment = async (req, res) => {
  try {
    const { userId, amount, transactionId, days } = req.body;

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days); // valid for `days` days

    // Create Payment entry
    const payment = await Payment.create({
      userId,
      amount,
      transactionId,
      status: "success", // assume success for now (you can integrate gateway later)
      expiryDate,
    });

    // Update User isPro = true until expiry date
    await User.findByIdAndUpdate(userId, { 
      isPro: true, 
      proExpiry: expiryDate 
    });

    res.status(201).json({ success: true, payment, message: "Payment successful & user upgraded" });
  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({ success: false, message: "Payment failed" });
  }
};

// Check and update isPro status if expired
exports.checkProStatus = async (req, res) => {
  try {
    const users = await User.find({ isPro: true });
    const now = new Date();

    for (let user of users) {
      if (user.proExpiry && user.proExpiry < now) {
        await User.findByIdAndUpdate(user._id, { isPro: false, proExpiry: null });
      }
    }

    res.json({ success: true, message: "Pro status checked & updated" });
  } catch (err) {
    console.error("Check Pro Status Error:", err);
    res.status(500).json({ success: false, message: "Error updating Pro status" });
  }
};