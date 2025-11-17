// server/controllers/paymentController.js
const axios = require("axios");
const PricingPlan = require("../models/PricingPlan");
const User = require("../models/User");
const Payment = require("../models/Payment");
require("dotenv").config();

const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL || "https://sandbox.cashfree.com/pg/orders";
const EXCHANGE_RATE = process.env.EXCHANGE_RATE ? Number(process.env.EXCHANGE_RATE) : 83.5;

// Load pricing plans from MongoDB
const getPricingPlans = async () => {
  try {
    const plans = await PricingPlan.find({ isActive: true }).sort({ sortOrder: 1 });
    return plans;
  } catch (error) {
    console.error("Error loading pricing plans from DB:", error);
    return [];
  }
};

// Get specific plan by ID
const getPlanById = async (planId) => {
  try {
    const plan = await PricingPlan.findOne({ 
      $or: [
        { _id: planId },
        { id: planId }
      ],
      isActive: true 
    });
    return plan;
  } catch (error) {
    console.error("Error getting plan by ID:", error);
    return null;
  }
};

/**
 * Helper: compute amount & currency from plan / billing / currency
 */
const calculateAmountFromPlan = async ({ planId, billingCycle, currency, customAmount }) => {
  const plan = await getPlanById(planId);

  if (!plan) {
    throw new Error("Invalid plan selected");
  }

  // Enterprise → expect backend-side or validated custom amount
  if (plan.custom) {
    if (!customAmount || typeof customAmount !== "number" || customAmount <= 0) {
      throw new Error("Custom amount required for Enterprise plan");
    }
    return {
      amount: customAmount,
      currency: currency === "INR" ? "INR" : "USD",
    };
  }

  const cycleKey = billingCycle === "annual" ? "annualUSD" : "monthlyUSD";
  const basePrice = plan[cycleKey];

  if (!basePrice) {
    throw new Error("Invalid billing cycle for selected plan");
  }

  let amount;
  let finalCurrency = currency;

  if (currency === "INR") {
    // Apply 20% discount for annual billing
    const discountedPrice = billingCycle === "annual" ? basePrice * 0.8 : basePrice;
    amount = Math.round(discountedPrice * EXCHANGE_RATE);
    finalCurrency = "INR";
  } else {
    // Apply 20% discount for annual billing
    amount = billingCycle === "annual" ? basePrice * 0.8 : basePrice;
    finalCurrency = "USD";
  }

  return { amount, currency: finalCurrency };
};

/**
 * Calculate expiry date based on billing cycle
 */
const calculateExpiryDate = (billingCycle) => {
  const now = new Date();
  if (billingCycle === "annual") {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  } else {
    return new Date(now.setMonth(now.getMonth() + 1));
  }
};

// ✅ Create Order (called by frontend from pricing/checkout)
const createOrder = async (req, res) => {
  try {
    const {
      planId,
      billingCycle = "monthly",
      currency = "USD",
      name,
      email,
      phone,
      amount: customAmount, // used only for enterprise/custom
    } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!planId) {
      return res.status(400).json({ message: "Plan is required" });
    }

    // Get user details for customer info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify plan exists and is active
    const plan = await getPlanById(planId);
    if (!plan) {
      return res.status(400).json({ message: "Plan not found or inactive" });
    }

    // Compute order amount & currency from plan configuration
    const { amount, currency: orderCurrency } = await calculateAmountFromPlan({
      planId,
      billingCycle,
      currency,
      customAmount,
    });

    const orderId = `ORDER_${Date.now()}_${userId}`;

    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: userId.toString(),
        customer_name: name || user.name || "Customer",
        customer_email: email || user.email || "customer@example.com",
        customer_phone: phone || user.phone || "9999999999",
      },
      order_note: `Plan: ${plan.name}, Billing: ${billingCycle}, Currency: ${orderCurrency}`,
      order_meta: {
        return_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/result?order_id={order_id}`,
        notify_url: `${process.env.API_URL || "http://localhost:5000"}/api/payments/webhook`
      }
    };

    console.log("Creating Cashfree order:", { orderId, amount, orderCurrency, planId: plan._id, billingCycle });

    const response = await axios.post(CASHFREE_BASE_URL, orderPayload, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-01-01",
        "Content-Type": "application/json",
      },
    });

    // Create payment record in database
    const paymentRecord = new Payment({
      userId,
      amount,
      currency: orderCurrency,
      status: "pending",
      transactionId: orderId,
      expiryDate: calculateExpiryDate(billingCycle),
      planId: plan._id.toString(),
      planName: plan.name,
      billingCycle,
    });

    await paymentRecord.save();

    return res.json({
      success: true,
      paymentLink: response.data.payment_link,
      orderId: response.data.order_id || orderId,
      paymentSessionId: response.data.payment_session_id,
      amount,
      currency: orderCurrency,
      planId: plan._id,
      billingCycle,
    });
  } catch (err) {
    console.error("Cashfree Create Order Error:", err.response?.data || err.message);
    return res.status(500).json({
      message: err.response?.data?.message || err.message || "Failed to create order",
    });
  }
};

// ✅ Verify Payment (only checks payment + returns info for frontend)
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?._id;

    if (!orderId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required data for verification",
      });
    }

    console.log("Verifying payment for order:", orderId);

    const response = await axios.get(`${CASHFREE_BASE_URL}/${orderId}`, {
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-01-01",
      },
    });

    const data = response.data;

    if (data.order_status === "PAID") {
      // Find the payment record
      const paymentRecord = await Payment.findOne({ transactionId: orderId });
      
      if (paymentRecord) {
        // Update payment status
        paymentRecord.status = "success";
        await paymentRecord.save();

        // Get plan details for user update
        const plan = await PricingPlan.findById(paymentRecord.planId);

        // Update user's plan
        await User.findByIdAndUpdate(userId, {
          plan: paymentRecord.planId,
          planName: plan?.name || paymentRecord.planName,
          billingCycle: paymentRecord.billingCycle,
          subscriptionStatus: "active",
          planExpiry: paymentRecord.expiryDate,
          maxAuditsPerMonth: plan?.maxAuditsPerMonth || 0,
          maxTrackedKeywords: plan?.maxTrackedKeywords || 0,
        });

        console.log("Payment verified and user plan updated for order:", orderId);
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        orderStatus: data.order_status,
        orderAmount: data.order_amount,
        orderCurrency: data.order_currency,
        planId: paymentRecord?.planId,
        planName: paymentRecord?.planName,
        billingCycle: paymentRecord?.billingCycle,
      });
    } else {
      // Update payment status to failed if not paid
      await Payment.findOneAndUpdate(
        { transactionId: orderId },
        { status: "failed" }
      );

      return res.status(200).json({
        success: false,
        message: "Payment not completed yet",
        orderStatus: data.order_status,
      });
    }
  } catch (err) {
    console.error("Cashfree Verify Payment Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

// ✅ Get Payment Status
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const paymentRecord = await Payment.findOne({ 
      transactionId: orderId, 
      userId 
    });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    return res.json({
      success: true,
      payment: paymentRecord,
    });
  } catch (err) {
    console.error("Get Payment Status Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get payment status",
    });
  }
};

// ✅ Webhook handler for Cashfree notifications
const handlePaymentWebhook = async (req, res) => {
  try {
    const { data, event } = req.body;
    
    if (event === "PAYMENT_SUCCESS_WEBHOOK") {
      const { orderId, orderAmount, paymentMode, referenceId } = data;
      
      console.log("Payment webhook received:", { orderId, orderAmount });

      // Update payment record
      const paymentRecord = await Payment.findOne({ transactionId: orderId });
      if (paymentRecord) {
        paymentRecord.status = "success";
        await paymentRecord.save();

        // Get plan details
        const plan = await PricingPlan.findById(paymentRecord.planId);

        // Update user plan
        await User.findByIdAndUpdate(paymentRecord.userId, {
          plan: paymentRecord.planId,
          planName: plan?.name || paymentRecord.planName,
          billingCycle: paymentRecord.billingCycle,
          subscriptionStatus: "active",
          planExpiry: paymentRecord.expiryDate,
          maxAuditsPerMonth: plan?.maxAuditsPerMonth || 0,
          maxTrackedKeywords: plan?.maxTrackedKeywords || 0,
        });

        console.log("User plan updated via webhook for order:", orderId);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false });
  }
};

module.exports = { 
  createOrder, 
  verifyPayment, 
  getPaymentStatus, 
  handlePaymentWebhook,
  getPricingPlans // Export for use in other controllers
};