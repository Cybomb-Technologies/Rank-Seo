// server/controllers/paymentController.js
const axios = require("axios");
const PricingPlan = require("../models/PricingPlan");
const User = require("../models/User");
const Payment = require("../models/Payment");
const { jsPDF } = require("jspdf");
const nodemailer = require("nodemailer");
require("dotenv").config();

const CASHFREE_BASE_URL = process.env.CASHFREE_BASE_URL;
const EXCHANGE_RATE = process.env.EXCHANGE_RATE ? Number(process.env.EXCHANGE_RATE) : 83.3;
const TAX_RATE = 0.18; // 18% GST

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Track email sending to prevent duplicates
const emailSentTracker = new Set();

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
 * Calculate tax and net amount from total amount
 */
const calculateTaxAndNetAmount = (totalAmount) => {
  const netAmount = totalAmount / (1 + TAX_RATE);
  const taxAmount = totalAmount - netAmount;
  
  return {
    netAmount: Math.round(netAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
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

  const cycleKeyUSD = billingCycle === "annual" ? "annualUSD" : "monthlyUSD";
  const cycleKeyINR = billingCycle === "annual" ? "annualINR" : "monthlyINR";
  
  const basePriceUSD = plan[cycleKeyUSD];
  const basePriceINR = plan[cycleKeyINR];

  if (basePriceUSD === undefined && basePriceINR === undefined) {
    throw new Error("Invalid billing cycle for selected plan");
  }

  let amount;
  let finalCurrency = currency;

  // ensure finalCurrency is string 'INR' or 'USD'
  if (currency === "INR") {
    // Use explicit INR price if available, otherwise calculate from USD
    if (basePriceINR !== undefined && basePriceINR !== null) {
      amount = basePriceINR;
    } else if (basePriceUSD !== undefined && basePriceUSD !== null) {
      amount = Math.round(basePriceUSD * EXCHANGE_RATE);
    } else {
       throw new Error("Price not available for INR");
    }
    finalCurrency = "INR";
  } else {
    // Default to USD
    if (basePriceUSD !== undefined && basePriceUSD !== null) {
      amount = basePriceUSD;
    } else {
       // Fallback to converting INR to USD (edge case, but good to have)
       amount = Math.round(basePriceINR / EXCHANGE_RATE);
    }
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

/**
 * Format currency for display
 */
const formatCurrency = (amount, currency) => {
  const symbol = currency === 'INR' ? '₹' : '$';
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${symbol} ${formattedAmount}`;
};

/**
 * Get plan features for display - properly extract feature names
 */
const getPlanFeatures = (plan) => {
  const features = [];
  
  // Add features array from plan - properly extract names
  if (plan && plan.features && Array.isArray(plan.features)) {
    plan.features.forEach(feature => {
      if (typeof feature === 'string') {
        features.push(feature);
      } else if (feature && typeof feature === 'object' && feature.name) {
        features.push(feature.name);
      } else if (feature && typeof feature === 'object' && feature.included !== false) {
        // Try to find any string property that might contain the feature name
        const featureName = Object.values(feature).find(val => typeof val === 'string' && val.length > 0);
        if (featureName && !featureName.includes('ObjectId')) {
          features.push(featureName);
        }
      }
    });
  }
  
  // Add usage limits as features
  if (plan && plan.maxAuditsPerMonth > 0) {
    features.push(`${plan.maxAuditsPerMonth} Website Audits per month`);
  }
  
  if (plan && plan.maxKeywordReportsPerMonth > 0) {
    features.push(`${plan.maxKeywordReportsPerMonth} Keyword Reports per month`);
  }
  
  if (plan && plan.maxBusinessNamesPerMonth > 0) {
    features.push(`${plan.maxBusinessNamesPerMonth} Business Name Generations per month`);
  }
  
  if (plan && plan.maxKeywordChecksPerMonth > 0) {
    features.push(`${plan.maxKeywordChecksPerMonth} Keyword Checks per month`);
  }
  
  if (plan && plan.maxKeywordScrapesPerMonth > 0) {
    features.push(`${plan.maxKeywordScrapesPerMonth} Keyword Scrapes per month`);
  }
  
  // Add billing cycle info
  if (plan) {
    features.push(`${plan.custom ? 'Custom' : 'Standard'} Billing`);
    
    // Add support info based on plan
    if (plan.name && plan.name.toLowerCase().includes('enterprise')) {
      features.push('Priority Support & Dedicated Account Manager');
    } else if (plan.name && plan.name.toLowerCase().includes('pro') || plan.name && plan.name.toLowerCase().includes('premium')) {
      features.push('Priority Email & Chat Support');
    } else {
      features.push('Standard Email Support');
    }
  }
  
  return features;
};

/**
 * Send invoice email to user (with duplicate prevention)
 */
const sendInvoiceEmail = async (user, payment, pdfBuffer) => {
  try {
    // Prevent duplicate email sending
    const emailKey = `${payment.transactionId}_${user.email}`;
    if (emailSentTracker.has(emailKey)) {
      console.log(`Invoice email already sent for ${emailKey}, skipping...`);
      return true;
    }
    
    emailSentTracker.add(emailKey);
    
    // Clean up old entries from tracker (prevent memory leaks)
    if (emailSentTracker.size > 1000) {
      const firstKey = emailSentTracker.values().next().value;
      emailSentTracker.delete(firstKey);
    }

    const { netAmount, taxAmount, totalAmount } = calculateTaxAndNetAmount(payment.amount);
    
    const netAmountFormatted = formatCurrency(netAmount, payment.currency);
    const taxAmountFormatted = formatCurrency(taxAmount, payment.currency);
    const totalAmountFormatted = formatCurrency(totalAmount, payment.currency);
    
    const mailOptions = {
      from: `"RankSEO" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Invoice for Your ${payment.planName} Subscription - ${payment.transactionId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .invoice-details { background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { background: #f1f5f9; padding: 15px; text-align: center; font-size: 14px; }
                .amount { font-size: 18px; font-weight: bold; color: #059669; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Thank You for Your Purchase!</h1>
                <p>Your RankSEO subscription is now active</p>
            </div>
            <div class="content">
                <p>Dear ${user.name},</p>
                <p>Thank you for subscribing to <strong>${payment.planName}</strong> plan (${payment.billingCycle} billing).</p>
                
                <div class="invoice-details">
                    <h3>Invoice Details:</h3>
                    <p><strong>Invoice ID:</strong> ${payment.transactionId}</p>
                    <p><strong>Plan:</strong> ${payment.planName} (${payment.billingCycle})</p>
                    <p><strong>Net Amount:</strong> ${netAmountFormatted}</p>
                    <p><strong>GST (18%):</strong> ${taxAmountFormatted}</p>
                    <p class="amount">Total Paid: ${totalAmountFormatted}</p>
                    <p><strong>Subscription Valid Until:</strong> ${new Date(payment.expiryDate).toLocaleDateString()}</p>
                </div>
                
                <p>You can now access all the features included in your plan. Start by visiting your dashboard to run SEO audits and track keywords.</p>
                
                <p>
                    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/profile/dashboard" 
                       style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Go to Dashboard
                    </a>
                </p>
            </div>
            <div class="footer">
                <p>Need help? Contact our support team at info@rankseo.in or call +91 9715092104</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `RankSEO_Invoice_${payment.transactionId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Invoice email sent successfully to ${user.email}`);
    return true;
  } catch (error) {
    console.error("Error sending invoice email:", error);
    // Remove from tracker on failure so it can be retried
    const emailKey = `${payment.transactionId}_${user.email}`;
    emailSentTracker.delete(emailKey);
    return false;
  }
};

// --- Orders, verification, status, webhooks, renewals, etc. ---
const createOrder = async (req, res) => {
  try {
    const {
      planId,
      billingCycle = "monthly",
      currency = "USD",
      name,
      email,
      phone,
      amount: customAmount,
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
        return_url: `${process.env.CLIENT_URL || "http://localhost:3001"}/payment/result?order_id={order_id}`,
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
      autoRenewal: true,
      renewalStatus: "scheduled",
      nextRenewalDate: calculateExpiryDate(billingCycle)
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
        paymentRecord.renewalStatus = "scheduled";
        paymentRecord.nextRenewalDate = paymentRecord.expiryDate;
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
          maxKeywordReportsPerMonth: plan?.maxKeywordReportsPerMonth || 0,
          maxBusinessNamesPerMonth: plan?.maxBusinessNamesPerMonth || 0,
          maxKeywordChecksPerMonth: plan?.maxKeywordChecksPerMonth || 0,
          maxKeywordScrapesPerMonth: plan?.maxKeywordScrapesPerMonth || 0,
        });

        console.log("Payment verified and user plan updated for order:", orderId);

        // Generate and send invoice email - FIXED: Don't skip email in verifyPayment
        try {
          const user = await User.findById(userId);
          const plan = await PricingPlan.findById(paymentRecord.planId);
          const pdfBuffer = await generateInvoicePDFBuffer(user, paymentRecord, plan);
          await sendInvoiceEmail(user, paymentRecord, pdfBuffer);
          console.log("Invoice email sent via verifyPayment for order:", orderId);
        } catch (emailError) {
          console.error("Failed to send invoice email via verifyPayment:", emailError);
          // Don't fail the whole request if email fails
        }
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        orderStatus: data.order_status,
        orderAmount: data.order_amount,
        orderCurrency: data.order_currency,
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

const handlePaymentWebhook = async (req, res) => {
  try {
    const { data, event } = req.body;
    
    console.log("Payment webhook received:", { event, data: data?.orderId });
    
    if (event === "PAYMENT_SUCCESS_WEBHOOK") {
      const { orderId, orderAmount, paymentMode, referenceId } = data;
      
      console.log("Payment success webhook processing:", { orderId, orderAmount });

      // Update payment record
      const paymentRecord = await Payment.findOne({ transactionId: orderId });
      if (paymentRecord) {
        paymentRecord.status = "success";
        paymentRecord.renewalStatus = "scheduled";
        paymentRecord.nextRenewalDate = paymentRecord.expiryDate;
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
          maxKeywordReportsPerMonth: plan?.maxKeywordReportsPerMonth || 0,
          maxBusinessNamesPerMonth: plan?.maxBusinessNamesPerMonth || 0,
          maxKeywordChecksPerMonth: plan?.maxKeywordChecksPerMonth || 0,
          maxKeywordScrapesPerMonth: plan?.maxKeywordScrapesPerMonth || 0,
        });

        console.log("User plan updated via webhook for order:", orderId);

        // Generate and send invoice email via webhook (primary method)
        try {
          const user = await User.findById(paymentRecord.userId);
          const pdfBuffer = await generateInvoicePDFBuffer(user, paymentRecord, plan);
          await sendInvoiceEmail(user, paymentRecord, pdfBuffer);
          console.log("Invoice email sent via webhook for order:", orderId);
        } catch (emailError) {
          console.error("Failed to send invoice email via webhook:", emailError);
        }
      } else {
        console.log("Payment record not found for order:", orderId);
      }
    } else {
      console.log("Webhook event not handled:", event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const toggleAutoRenewal = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { autoRenewal } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (typeof autoRenewal !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Auto-renewal parameter must be a boolean"
      });
    }

    // Find user's latest successful payment
    const payment = await Payment.findOne({ 
      userId, 
      status: "success" 
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "No active subscription found" 
      });
    }

    payment.autoRenewal = autoRenewal;
    payment.renewalStatus = autoRenewal ? "scheduled" : "cancelled";
    
    await payment.save();

    return res.json({
      success: true,
      message: `Auto-renewal ${autoRenewal ? 'enabled' : 'disabled'} successfully`,
      autoRenewal: payment.autoRenewal,
      renewalStatus: payment.renewalStatus
    });

  } catch (err) {
    console.error("Toggle Auto-Renewal Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update auto-renewal settings"
    });
  }
};

const getAutoRenewalStatus = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find user's latest successful payment
    const payment = await Payment.findOne({ 
      userId, 
      status: "success" 
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: "No active subscription found" 
      });
    }

    return res.json({
      success: true,
      autoRenewal: payment.autoRenewal,
      renewalStatus: payment.renewalStatus,
      nextRenewalDate: payment.nextRenewalDate,
      expiryDate: payment.expiryDate,
      billingCycle: payment.billingCycle,
      planName: payment.planName
    });

  } catch (err) {
    console.error("Get Auto-Renewal Status Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get auto-renewal status"
    });
  }
};

const processAutoRenewals = async () => {
  try {
    console.log("Processing auto-renewals...");
    
    const now = new Date();
    const renewalThreshold = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now

    // Find subscriptions due for renewal
    const renewalsDue = await Payment.find({
      status: "success",
      autoRenewal: true,
      renewalStatus: "scheduled",
      expiryDate: { 
        $lte: renewalThreshold,
        $gte: now
      },
      renewalAttempts: { $lt: "$maxRenewalAttempts" }
    }).populate("userId").populate("planId");

    console.log(`Found ${renewalsDue.length} subscriptions due for renewal`);

    for (const payment of renewalsDue) {
      try {
        console.log(`Processing renewal for user: ${payment.userId._id}`);
        
        // Update status to processing
        payment.renewalStatus = "processing";
        await payment.save();

        // Create new order for renewal
        const orderId = `RENEW_${Date.now()}_${payment.userId._id}`;
        
        const orderPayload = {
          order_id: orderId,
          order_amount: payment.amount,
          order_currency: payment.currency,
          customer_details: {
            customer_id: payment.userId._id.toString(),
            customer_name: payment.userId.name || "Customer",
            customer_email: payment.userId.email || "customer@example.com",
            customer_phone: payment.userId.phone || "9999999999",
          },
          order_note: `Auto-renewal: ${payment.planName}, Billing: ${payment.billingCycle}`,
          order_meta: {
            return_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/result?order_id={order_id}`,
            notify_url: `${process.env.API_URL || "http://localhost:5000"}/api/payments/webhook`
          }
        };

        const response = await axios.post(CASHFREE_BASE_URL, orderPayload, {
          headers: {
            "x-client-id": process.env.CASHFREE_APP_ID,
            "x-client-secret": process.env.CASHFREE_SECRET_KEY,
            "x-api-version": "2022-01-01",
            "Content-Type": "application/json",
          },
        });

        // Create new payment record for renewal
        const newExpiryDate = calculateExpiryDate(payment.billingCycle);
        
        const renewalPayment = new Payment({
          userId: payment.userId._id,
          amount: payment.amount,
          currency: payment.currency,
          status: "pending",
          transactionId: orderId,
          expiryDate: newExpiryDate,
          planId: payment.planId._id,
          planName: payment.planName,
          billingCycle: payment.billingCycle,
          autoRenewal: true,
          renewalStatus: "pending",
          nextRenewalDate: newExpiryDate
        });

        await renewalPayment.save();

        // Update original payment
        payment.renewalAttempts += 1;
        payment.nextRenewalDate = newExpiryDate;
        payment.renewalStatus = "scheduled";
        await payment.save();

        console.log(`Renewal order created successfully for user: ${payment.userId._id}`);

      } catch (error) {
        console.error(`Renewal failed for user ${payment.userId._id}:`, error.message);
        
        // Update payment with failure
        payment.renewalAttempts += 1;
        if (payment.renewalAttempts >= payment.maxRenewalAttempts) {
          payment.renewalStatus = "failed";
          payment.autoRenewal = false;
          
          // Update user subscription status
          await User.findByIdAndUpdate(payment.userId._id, {
            subscriptionStatus: "expired"
          });
        } else {
          payment.renewalStatus = "scheduled";
        }
        await payment.save();

        // TODO: Send notification to user about failed renewal
      }
    }

    console.log("Auto-renewal processing completed");
    
  } catch (error) {
    console.error("Auto-renewal processing error:", error);
  }
};

const manualRenewalProcessing = async (req, res) => {
  try {
    console.log("Manual renewal processing triggered");
    await processAutoRenewals();
    
    return res.json({
      success: true,
      message: "Manual renewal processing completed"
    });
  } catch (error) {
    console.error("Manual renewal processing error:", error);
    return res.status(500).json({
      success: false,
      message: "Manual renewal processing failed"
    });
  }
};

// Update getUserProfile function to include all service limits:
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(userId).select('name email mobile plan planName billingCycle subscriptionStatus planExpiry maxAuditsPerMonth auditsUsed maxKeywordReportsPerMonth keywordReportsUsed maxBusinessNamesPerMonth businessNamesUsed maxKeywordChecksPerMonth keywordChecksUsed maxKeywordScrapesPerMonth keywordScrapesUsed createdAt');

    if (!user) {
      return res.status(404).json({ 
        success: false,  
        message: "User not found" 
      });
    }

    // Get latest payment for auto-renewal info
    const latestPayment = await Payment.findOne({ 
      userId, 
      status: "success" 
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      name: user.name,
      email: user.email,
      mobile: user.phone,
      planId: user.plan,
      planName: user.planName,
      billingCycle: user.billingCycle,
      subscriptionStatus: (user.planName === "Free Tier" || user.plan === "free") ? "active" : user.subscriptionStatus,
      planExpiry: user.planExpiry,
      maxAuditsPerMonth: user.maxAuditsPerMonth || 0,
      auditsUsed: user.auditsUsed || 0,
      maxKeywordReportsPerMonth: user.maxKeywordReportsPerMonth || 0,
      keywordReportsUsed: user.keywordReportsUsed || 0,
      maxBusinessNamesPerMonth: user.maxBusinessNamesPerMonth || 0,
      businessNamesUsed: user.businessNamesUsed || 0,
      maxKeywordChecksPerMonth: user.maxKeywordChecksPerMonth || 0,
      keywordChecksUsed: user.keywordChecksUsed || 0,
      maxKeywordScrapesPerMonth: user.maxKeywordScrapesPerMonth || 0,
      keywordScrapesUsed: user.keywordScrapesUsed || 0,
      memberSince: user.createdAt,
      // Auto-renewal info from payment
      autoRenewal: latestPayment?.autoRenewal || false,
      renewalStatus: latestPayment?.renewalStatus || "inactive",
      nextRenewalDate: latestPayment?.nextRenewalDate || null
    });

  } catch (err) {
    console.error("Get User Profile Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get user profile"
    });
  }
};

const getBillingHistory = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const payments = await Payment.find({ 
      userId, 
      status: { $in: ["success", "failed", "pending"] } 
    })
    .populate('planId')
    .sort({ createdAt: -1 })
    .limit(20)
    .select('transactionId amount currency status planName billingCycle createdAt expiryDate');

    return res.json({
      success: true,
      payments
    });

  } catch (err) {
    console.error("Get Billing History Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get billing history"
    });
  }
};

// --- jsPDF helpers and generators ---

/**
 * Check if we need a new page and add one if necessary
 */
const checkPageBreak = (doc, currentY, requiredSpace = 100) => {
  const bottomLimit = doc.internal.pageSize.height - 50;
  if (currentY + requiredSpace > bottomLimit) {
    doc.addPage();
    return 50;
  }
  return currentY;
};

/**
 * Format currency for PDF display without symbols
 */
const formatCurrencyForPDF = (amount, currency) => {
  // Use Western numbering system for consistent display
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${currency} ${formattedAmount}`;
};

/**
 * Display features in two columns
 */
const displayFeaturesInTwoColumns = (doc, features, startX, startY, columnWidth, lineHeight) => {
  let currentY = startY;
  const middleX = startX + columnWidth;
  
  // Split features into two columns
  const midIndex = Math.ceil(features.length / 2);
  const leftColumnFeatures = features.slice(0, midIndex);
  const rightColumnFeatures = features.slice(midIndex);
  
  // Find the maximum length between both columns to determine total height needed
  const maxFeatures = Math.max(leftColumnFeatures.length, rightColumnFeatures.length);
  
  // Draw features in two columns
  for (let i = 0; i < maxFeatures; i++) {
    // Check if we need a new page
    currentY = checkPageBreak(doc, currentY, lineHeight);
    
    // Left column feature
    if (i < leftColumnFeatures.length) {
      doc.setTextColor(30, 41, 59) // darkText
         .setFontSize(9)
         .setFont("helvetica", "normal")
         .text(`• ${leftColumnFeatures[i]}`, startX, currentY);
    }
    
    // Right column feature
    if (i < rightColumnFeatures.length) {
      doc.setTextColor(30, 41, 59) // darkText
         .setFontSize(9)
         .setFont("helvetica", "normal")
         .text(`• ${rightColumnFeatures[i]}`, middleX, currentY);
    }
    
    currentY += lineHeight;
  }
  
  return currentY;
};

// Replace only generateInvoicePDFContent with this function
const generateInvoicePDFContent = (doc, user, payment, plan) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const { netAmount, taxAmount, totalAmount } = calculateTaxAndNetAmount(payment.amount);

  // Colors
  const primaryColor = [5, 150, 105];
  const darkText = [30, 41, 59];
  const mediumText = [71, 85, 105];
  const lightText = [100, 116, 139];
  const borderColor = [226, 232, 240];
  const headerBg = [248, 250, 252];
  const white = [255, 255, 255];

  // Page/layout
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 50;
  const startX = margin;
  const endX = pageWidth - margin;
  const contentWidth = endX - startX;

  let currentY = margin;

  // Header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 120, 'F');

  // Company name and tagline (left)
  doc.setTextColor(white[0], white[1], white[2])
     .setFontSize(16)
     .setFont("helvetica", "bold")
     .text('RANKSEO', startX, 30);

  doc.setTextColor(248, 250, 252)
     .setFontSize(8)
     .setFont("helvetica", "normal")
     .text('Professional SEO Tools & Analytics Platform', startX, 46);

  // Company details (left)
  let companyDetailY = 64;
  doc.setTextColor(226, 232, 240)
     .setFontSize(7)
     .text('Cybomb Technologies Pvt Ltd.', startX, companyDetailY);

  doc.text('GSTIN: 33AANCC2184M1ZC', startX, companyDetailY + 9);

  const addressLines = doc.splitTextToSize(
    'Prime Plaza No.54/1, 1st street, Sripuram colony, St. Thomas Mount, Chennai, Tamil Nadu - 600 016, India',
    contentWidth * 0.5 // limit address width
  );
  doc.text(addressLines, startX, companyDetailY + 18);

  // INVOICE badge (right) — anchor to endX
  const badgeX = endX;
  doc.setTextColor(white[0], white[1], white[2])
     .setFontSize(12)
     .setFont("helvetica", "bold")
     .text('INVOICE', badgeX, 40, { align: 'right' })
     .setFontSize(10)
     .text(`#${payment.transactionId}`, badgeX, 56, { align: 'right' });

  // Start content below header
  currentY = 140;

  // BILL TO (left)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
     .setFontSize(11)
     .setFont("helvetica", "bold")
     .text('BILL TO:', startX, currentY);

  doc.setTextColor(darkText[0], darkText[1], darkText[2])
     .setFontSize(10)
     .setFont("helvetica", "bold")
     .text(user.name || 'Customer Name', startX, currentY + 18);

  doc.setTextColor(mediumText[0], mediumText[1], mediumText[2])
     .setFontSize(9)
     .setFont("helvetica", "normal")
     .text(user.email || 'customer@example.com', startX, currentY + 34);

  if (user.phone) {
    doc.text(user.phone, startX, currentY + 50);
  }

  // Invoice Details Card (right). keep it entirely to the right without overlapping.
  const detailsCardWidth = Math.min(260, contentWidth * 0.45);
  const detailsCardX = endX - detailsCardWidth;
  const detailsCardHeight = 100;

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
     .setFillColor(headerBg[0], headerBg[1], headerBg[2])
     .roundedRect(detailsCardX, currentY - 8, detailsCardWidth, detailsCardHeight, 6, 6, 'FD');

  let detailY = currentY + 6;

  const addDetailRow = (label, value, isBold = false) => {
    doc.setTextColor(mediumText[0], mediumText[1], mediumText[2])
       .setFontSize(8)
       .setFont("helvetica", "normal")
       .text(label, detailsCardX + 10, detailY);

    const textColor = isBold ? primaryColor : darkText;
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
       .setFontSize(8)
       .setFont("helvetica", isBold ? "bold" : "normal")
       .text(value, detailsCardX + detailsCardWidth - 10, detailY, { align: 'right' });

    detailY += 14;
  };

  addDetailRow('Invoice Date:', formatDate(payment.createdAt));
  addDetailRow('Due Date:', formatDate(payment.createdAt));
  addDetailRow('Status:', (payment.status || '').toUpperCase(), true);
  addDetailRow('Billing Cycle:', (payment.billingCycle || '').charAt(0).toUpperCase() + (payment.billingCycle || '').slice(1));
  const serviceStart = new Date(payment.createdAt);
  const serviceEnd = new Date(payment.expiryDate);
  addDetailRow('Service Period:', `${formatShortDate(serviceStart)} to ${formatShortDate(serviceEnd)}`);

  // Move currentY down beneath card and bill to area
  currentY += Math.max(detailsCardHeight, 90) + 18;

  // ITEMS TABLE
  currentY = checkPageBreak(doc, currentY, 220);
  const tableTop = currentY;

  // Table header background
  const headerHeight = 28;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
     .rect(startX, tableTop, contentWidth, headerHeight, 'F');

  // Column widths computed from contentWidth (responsive)
  const colDescW = Math.round(contentWidth * 0.58);
  const colQtyW = Math.round(contentWidth * 0.08);
  const colPriceW = Math.round(contentWidth * 0.17);
  const colAmountW = contentWidth - (colDescW + colQtyW + colPriceW);

  // Column X positions
  const colDescX = startX + 10;
  const colQtyX = startX + colDescW + 10;
  const colPriceX = colQtyX + colQtyW + colPriceW - 6; // align right inside column
  const colAmountX = startX + contentWidth - 10;

  // Header text — vertically center inside headerHeight
  const headerTextY = tableTop + headerHeight / 2 + 5;
  doc.setTextColor(white[0], white[1], white[2])
     .setFontSize(10)
     .setFont("helvetica", "bold")
     .text('DESCRIPTION', colDescX, headerTextY)
     .text('QTY', startX + colDescW + (colQtyW / 2), headerTextY, { align: 'center' })
     .text('PRICE', colPriceX, headerTextY, { align: 'right' })
     .text('AMOUNT', colAmountX, headerTextY, { align: 'right' });

  // Item row (single row)
  const itemRowY = tableTop + headerHeight;
  const itemHeight = 56;

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
     .setFillColor(white[0], white[1], white[2])
     .rect(startX, itemRowY, contentWidth, itemHeight, 'FD');

  const itemDescription = `${payment.planName} Subscription`;
  const itemDetails = `${(payment.billingCycle || '').charAt(0).toUpperCase() + (payment.billingCycle || '').slice(1)} billing cycle with full feature access`;

  // description text lines wrapping within desc column width
  const descTextWidth = colDescW - 20;
  doc.setTextColor(darkText[0], darkText[1], darkText[2])
     .setFontSize(11)
     .setFont("helvetica", "bold");
  doc.text(doc.splitTextToSize(itemDescription, descTextWidth), colDescX, itemRowY + 16);

  doc.setTextColor(mediumText[0], mediumText[1], mediumText[2])
     .setFontSize(9)
     .setFont("helvetica", "normal");
  doc.text(doc.splitTextToSize(itemDetails, descTextWidth), colDescX, itemRowY + 34);

  // Qty, Price and Amount — vertically centered in item row
  const itemCenterY = itemRowY + itemHeight / 2 + 3;
  doc.setTextColor(darkText[0], darkText[1], darkText[2])
     .setFontSize(10)
     .setFont("helvetica", "normal")
     .text('1', startX + colDescW + (colQtyW / 2), itemCenterY, { align: 'center' });

  const priceDisplay = formatCurrencyForPDF(netAmount, payment.currency);
  doc.text(priceDisplay, colPriceX, itemCenterY, { align: 'right' });
  doc.text(priceDisplay, colAmountX, itemCenterY, { align: 'right' });

  currentY = itemRowY + itemHeight + 24;

  // TOTALS SECTION (right aligned)
  currentY = checkPageBreak(doc, currentY, 140);
  const totalsWidth = Math.min(260, contentWidth * 0.45);
  const totalsX = endX - totalsWidth;
  const totalsHeight = 88;

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
     .setFillColor(white[0], white[1], white[2])
     .rect(totalsX, currentY, totalsWidth, totalsHeight, 'FD');

  let totalY = currentY + 14;

  const addTotalLine = (label, amount, isMain = false) => {
    const currencyDisplay = formatCurrencyForPDF(amount, payment.currency);

    doc.setTextColor(mediumText[0], mediumText[1], mediumText[2])
       .setFontSize(isMain ? 10 : 9)
       .setFont("helvetica", isMain ? "bold" : "normal")
       .text(label, totalsX + 12, totalY);

    const textColor = isMain ? primaryColor : darkText;
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
       .setFontSize(isMain ? 12 : 10)
       .setFont("helvetica", isMain ? "bold" : "normal")
       .text(currencyDisplay, totalsX + totalsWidth - 12, totalY, { align: 'right' });

    totalY += isMain ? 22 : 16;
  };

  addTotalLine('Subtotal:', netAmount);
  addTotalLine('GST (18%):', taxAmount);

  // separator
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
     .setLineWidth(0.5)
     .line(totalsX + 10, totalY - 8, totalsX + totalsWidth - 10, totalY - 8);
  totalY += 8;

  addTotalLine('TOTAL PAID', totalAmount, true);

  // Fix alignment: match the right alignment of TOTAL PAID amount
  doc.setTextColor(mediumText[0], mediumText[1], mediumText[2])
    .setFontSize(8)
    .setFont("helvetica", "normal")
    .text(
      'Paid via Credit Card / Online Payment',
      totalsX + totalsWidth - 12,   // same right-edge position as amounts
      totalY + 10,                  // add more spacing below TOTAL PAID
      { align: 'right' }
    );

  currentY += totalsHeight + 26;

  // PLAN FEATURES - DYNAMIC FROM PLAN - IN TWO COLUMNS
  currentY = checkPageBreak(doc, currentY, 120);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
     .setFontSize(12)
     .setFont("helvetica", "bold")
     .text('PLAN FEATURES', startX, currentY);

  // Get dynamic features from plan
  const features = getPlanFeatures(plan || payment.planId);
  
  const featuresStartY = currentY + 18;
  const columnWidth = contentWidth / 2;
  const lineHeight = 14;

  // Display features in two columns
  currentY = displayFeaturesInTwoColumns(doc, features, startX, featuresStartY, columnWidth, lineHeight);

  currentY += 18;

  // FOOTER
  currentY = checkPageBreak(doc, currentY, 80);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
     .setFontSize(11)
     .setFont("helvetica", "bold")
     .text('Thank You for Choosing RankSEO!', pageWidth / 2, currentY, { align: 'center' });

  doc.setTextColor(mediumText[0], mediumText[1], mediumText[2])
     .setFontSize(9)
     .setFont("helvetica", "normal")
     .text('Need assistance? Contact our support team:', pageWidth / 2, currentY + 18, { align: 'center' });

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
     .setFontSize(9)
     .setFont("helvetica", "bold")
     .text('info@rankseo.in • +91 9715092104', pageWidth / 2, currentY + 34, { align: 'center' });

  // Legal text bottom
  const legalY = pageHeight - 40;
  doc.setTextColor(lightText[0], lightText[1], lightText[2])
     .setFontSize(7)
     .setFont("helvetica", "normal")
     .text('This is an electronically generated invoice and does not require a physical signature.', pageWidth / 2, legalY, { align: 'center' });

  doc.text(`Invoice ID: ${payment.transactionId} • Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, legalY + 12, { align: 'center' });
};


/**
 * Generate PDF buffer for email attachment using jsPDF
 */
const generateInvoicePDFBuffer = async (user, payment, plan = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // Set document metadata
      doc.setProperties({
        Title: `Invoice - ${payment.transactionId}`,
        Author: 'RankSEO',
        Subject: 'Subscription Invoice',
        Keywords: 'invoice, receipt, subscription, seo',
        Creator: 'RankSEO Billing System'
      });

      // Set default font
      doc.setFont("helvetica");

      // If plan is not provided, fetch it
      let planData = plan;
      if (!planData && payment.planId) {
        try {
          planData = await PricingPlan.findById(payment.planId);
        } catch (error) {
          console.error("Error fetching plan for PDF:", error);
          // Continue with basic features if plan fetch fails
        }
      }

      // Generate content with plan data
      generateInvoicePDFContent(doc, user, payment, planData);
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      resolve(pdfBuffer);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF and pipe to HTTP response using jsPDF
 */
const generateInvoicePDF = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch Payment and User Data
    const payment = await Payment.findOne({ 
      transactionId, 
      userId,
      status: "success"
    }).populate('planId');

    if (!payment) {
      return res.status(404).json({ message: "Invoice not found or payment unsuccessful" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Setup PDF Document using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    // Set document metadata
    doc.setProperties({
      Title: `Invoice - ${transactionId}`,
      Author: 'RankSEO',
      Subject: 'Subscription Invoice',
      Keywords: 'invoice, receipt, subscription, seo',
      Creator: 'RankSEO Billing System'
    });

    // Set default font
    doc.setFont("helvetica");

    const filename = `RankSEO_Invoice_${payment.planName.replace(/\s/g, '_')}_${transactionId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Generate content with plan data
    const plan = await PricingPlan.findById(payment.planId);
    generateInvoicePDFContent(doc, user, payment, plan);

    // Send PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Generate Invoice PDF Error:", err?.message || err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate invoice PDF"
      });
    }
  }
};


module.exports = { 
  createOrder, 
  verifyPayment, 
  getPaymentStatus, 
  handlePaymentWebhook,
  getPricingPlans,
  toggleAutoRenewal,
  getAutoRenewalStatus,
  processAutoRenewals,
  manualRenewalProcessing,
  getBillingHistory,
  getUserProfile,
  generateInvoicePDF
};