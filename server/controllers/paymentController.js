// server/controllers/paymentController.js
const axios = require("axios");
const PricingPlan = require("../models/PricingPlan");
const User = require("../models/User");
const Payment = require("../models/Payment");
const PDFDocument = require("pdfkit");
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

// ensure finalCurrency is string 'INR' or 'USD' — not 1/0
if (currency === "INR") {
  amount = Math.round(basePrice * EXCHANGE_RATE);
  finalCurrency = "INR";
} else {
  amount = basePrice;
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
      // Auto-renewal fields
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

// ✅ Toggle Auto-Renewal
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

// ✅ Get Auto-Renewal Status
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

// ✅ Process Auto-Renewal (Cron Job)
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

// ✅ Manual Renewal Processing (for testing)
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

// ✅ Get User Profile Data (for usage) - ENHANCED
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(userId).select('name email mobile planName billingCycle subscriptionStatus planExpiry maxAuditsPerMonth auditsUsed createdAt');

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
      planName: user.planName,
      billingCycle: user.billingCycle,
      subscriptionStatus: user.subscriptionStatus,
      planExpiry: user.planExpiry,
      maxAuditsPerMonth: user.maxAuditsPerMonth || 0,
      maxTrackedKeywords: user.maxTrackedKeywords || 0,
      auditsUsed: user.auditsUsed || 0,
      
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

// ✅ Get Billing History
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

const generateInvoicePDF = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // 1. Fetch Payment and User Data
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

    // 2. Setup PDF Document
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `Invoice - ${transactionId}`,
        Author: 'RankSEO',
        Subject: 'Subscription Invoice',
        Keywords: 'invoice, receipt, subscription, seo',
        Creator: 'RankSEO Billing System',
        CreationDate: new Date()
      }
    });

    const filename = `RankSEO_Invoice_${payment.planName.replace(/\s/g, '_')}_${transactionId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

   const formatCurrency = (amount, currency) => {
  // Fallback currency formatting if symbols don't work
  const symbol = currency === 'INR' ? 'INR' : 'USD';
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${symbol} ${formattedAmount}`;
};
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

    // Professional Color Scheme
    const primaryColor = '#2563eb';
    const secondaryColor = '#059669';
    const darkText = '#1e293b';
    const mediumText = '#475569';
    const lightText = '#64748b';
    const borderColor = '#e2e8f0';
    const headerBg = '#f8fafc';
    const successColor = '#059669';

    // Layout Constants
    const startX = 50;
    const endX = 545;
    const contentWidth = endX - startX;

    let currentY = 0;

    // 3. MODERN HEADER
    doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

    // Company Info
    doc.fillColor('#ffffff')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('RANKSEO', startX, 40);

    doc.fillColor('#f8fafc')
       .fontSize(9)
       .font('Helvetica')
       .text('Professional SEO Tools & Analytics Platform', startX, 62);

    // INVOICE Badge - fixed width + right aligned
    const invoiceBoxWidth = 180;
    const invoiceBoxX = endX - invoiceBoxWidth;
    const invoiceText = `INVOICE\n#${transactionId.substring(0, 15)}...`;

    doc.fillColor('#ffffff')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(invoiceText, invoiceBoxX, 40, {
         width: invoiceBoxWidth - 20,
         align: 'right',
         lineGap: 2
       });

    currentY = 120;

    // 4. BILLING INFORMATION SECTION
    // Bill To Section
    doc.fillColor(primaryColor)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('BILL TO:', startX, currentY);

    doc.fillColor(darkText)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(user.name || 'Customer Name', startX, currentY + 15);

    doc.fillColor(mediumText)
       .fontSize(9)
       .font('Helvetica')
       .text(user.email || 'customer@example.com', startX, currentY + 30);

    if (user.phone) {
      doc.text(user.phone, startX, currentY + 45);
    }

    // Invoice Details Card
    const detailsCardWidth = 240;
    const detailsCardX = endX - detailsCardWidth;
    
    doc.save()
       .lineWidth(0.8)
       .roundedRect(detailsCardX, currentY, detailsCardWidth, 90, 5)
       .fillAndStroke(headerBg, borderColor)
       .restore();

    let detailY = currentY + 14;
    const detailLabelWidth = 80;

    const addDetailRow = (label, value, isBold = false) => {
      doc.fillColor(mediumText)
         .fontSize(8)
         .font('Helvetica')
         .text(label, detailsCardX + 10, detailY, { width: detailLabelWidth });

      doc.fillColor(isBold ? primaryColor : darkText)
         .fontSize(8)
         .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
         .text(value, detailsCardX + detailLabelWidth + 10, detailY, { 
           width: detailsCardWidth - detailLabelWidth - 20,
           align: 'right' 
         });
      
      detailY += 12;
    };

    addDetailRow('Invoice Date:', formatDate(payment.createdAt));
    addDetailRow('Due Date:', formatDate(payment.createdAt));
    addDetailRow('Status:', payment.status.toUpperCase(), true);
    addDetailRow('Billing Cycle:', payment.billingCycle.charAt(0).toUpperCase() + payment.billingCycle.slice(1));
    
    const serviceStart = new Date(payment.createdAt);
    const serviceEnd = new Date(payment.expiryDate);
    addDetailRow('Service Period:', `${formatShortDate(serviceStart)} to ${formatShortDate(serviceEnd)}`);

    currentY += 110;

    // 5. ITEMS TABLE with Fixed Alignment
    const tableTop = currentY;

    // Table Header Background
    doc.rect(startX, tableTop, contentWidth, 25)
       .fill(primaryColor);

    // Column positions based on endX so they line up perfectly
    const amountColWidth = 85;
    const priceColWidth = 80;
    const qtyColWidth = 40;
    const tablePaddingX = 10;
    const gap = 10;

    const colAmountX = endX - tablePaddingX - amountColWidth;
    const colPriceX = colAmountX - gap - priceColWidth;
    const colQtyX = colPriceX - gap - qtyColWidth;
    const colDescX = startX + tablePaddingX;
    const descColWidth = colQtyX - colDescX - gap;

    // Header Text
    doc.fillColor('#ffffff')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('DESCRIPTION', colDescX, tableTop + 7, { width: descColWidth })
       .text('QTY', colQtyX, tableTop + 7, { width: qtyColWidth, align: 'center' })
       .text('PRICE', colPriceX, tableTop + 7, { width: priceColWidth, align: 'right' })
       .text('AMOUNT', colAmountX, tableTop + 7, { width: amountColWidth, align: 'right' });

    // Item Row
    const itemRowY = tableTop + 25;
    const itemHeight = 42;

    doc.save()
       .lineWidth(0.8)
       .rect(startX, itemRowY, contentWidth, itemHeight)
       .fillAndStroke('#ffffff', borderColor)
       .restore();

    const itemDescription = `${payment.planName} Subscription`;
    const itemDetails = `${payment.billingCycle.charAt(0).toUpperCase() + payment.billingCycle.slice(1)} billing cycle with full feature access`;

    doc.fillColor(darkText)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(itemDescription, colDescX, itemRowY + 6, { width: descColWidth });

    doc.fillColor(mediumText)
       .fontSize(9)
       .font('Helvetica')
       .text(itemDetails, colDescX, itemRowY + 20, { width: descColWidth });

    // Fixed numeric alignment using same X+width
    // FIXED: Using the formatCurrency function to ensure currency symbols display correctly
    const formattedPrice = formatCurrency(payment.amount, payment.currency);
    const formattedAmount = formatCurrency(payment.amount, payment.currency);

    doc.fillColor(darkText)
       .fontSize(10)
       .font('Helvetica')
       .text('1', colQtyX, itemRowY + 14, { width: qtyColWidth, align: 'center' })
       .text(formattedPrice, colPriceX, itemRowY + 14, { width: priceColWidth, align: 'right' })
       .text(formattedAmount, colAmountX, itemRowY + 14, { width: amountColWidth, align: 'right' });

    currentY = itemRowY + itemHeight + 30;

    // 6. TOTALS SECTION with Proper Alignment
    const totalsWidth = 220;
    const totalsX = endX - totalsWidth;

    doc.save()
       .lineWidth(0.8)
       .rect(totalsX, currentY, totalsWidth, 105)
       .fillAndStroke('#ffffff', borderColor)
       .restore();

    let totalY = currentY + 15;

    const addTotalLine = (label, value, isMain = false) => {
      const labelWidth = 110;
      
      doc.fillColor(mediumText)
         .fontSize(isMain ? 11 : 9)
         .font(isMain ? 'Helvetica-Bold' : 'Helvetica')
         .text(label, totalsX + 10, totalY, { width: labelWidth });

      doc.fillColor(isMain ? primaryColor : darkText)
         .fontSize(isMain ? 12 : 10)
         .font(isMain ? 'Helvetica-Bold' : 'Helvetica')
         .text(value, totalsX + labelWidth + 5, totalY, { 
           width: totalsWidth - labelWidth - 15,
           align: 'right' 
         });
      
      totalY += isMain ? 22 : 16;
    };

    // Calculate amounts
    const subtotal = payment.amount;
    const subtotalFormatted = formatCurrency(subtotal, payment.currency);
    const taxFormatted = formatCurrency(0, payment.currency);
    const totalFormatted = formatCurrency(payment.amount, payment.currency);

    addTotalLine('Subtotal:', subtotalFormatted);
    addTotalLine('Tax (18%):', taxFormatted);

    // Separator
    totalY += 4;
    doc.moveTo(totalsX + 10, totalY)
       .lineTo(totalsX + totalsWidth - 10, totalY)
       .strokeColor(borderColor)
       .lineWidth(0.8)
       .stroke();
    
    totalY += 10;

    // Total
    addTotalLine('TOTAL PAID', totalFormatted, true);

    doc.fillColor(mediumText)
       .fontSize(8)
       .font('Helvetica')
       .text('Paid via Credit Card / Online Payment', totalsX + 10, totalY + 4, {
         width: totalsWidth - 20,
         align: 'right'
       });

    currentY += 125;

    // 7. PLAN FEATURES SECTION
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('PLAN FEATURES', startX, currentY);

    currentY += 20;

    const features = [
      `• ${payment.planId?.maxAuditsPerMonth || 20} Website Audits per month`,
      `• ${payment.planId?.maxTrackedKeywords || 200} Keyword Tracking`,
      `• ${payment.billingCycle.charAt(0).toUpperCase() + payment.billingCycle.slice(1)} Billing`,
      `• Priority Email & Chat Support`,
    ];

    const columnWidth = contentWidth / 2;
    const featuresPerColumn = Math.ceil(features.length / 2);

    features.forEach((feature, index) => {
      const column = Math.floor(index / featuresPerColumn);
      const row = index % featuresPerColumn;
      
      const xPos = startX + (column * columnWidth);
      const yPos = currentY + (row * 16);
      
      doc.fillColor(darkText)
         .fontSize(9)
         .font('Helvetica')
         .text(feature, xPos, yPos, { width: columnWidth - 10 });
    });

    currentY += (featuresPerColumn * 16) + 30;

    // 8. FOOTER - Single page footer
    const footerY = Math.min(currentY, 700);

    doc.fillColor(primaryColor)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(
         'Thank You for Choosing RankSEO!',
         startX,
         footerY,
         { width: contentWidth, align: 'center' }
       );

    doc.fillColor(mediumText)
       .fontSize(9)
       .font('Helvetica')
       .text(
         'Need assistance? Contact our support team:',
         startX,
         footerY + 20,
         { width: contentWidth, align: 'center' }
       );

    doc.fillColor(primaryColor)
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(
         'info@rankseo.com • +91 9715092104',
         startX,
         footerY + 35,
         { width: contentWidth, align: 'center' }
       );

    // Legal text at the very bottom
    const legalY = doc.page.height - 40;
    doc.fillColor(lightText)
       .fontSize(7)
       .font('Helvetica')
       .text(
         'This is an electronically generated invoice and does not require a physical signature.',
         startX,
         legalY,
         { align: 'center', width: contentWidth }
       );

    doc.text(
      `Invoice ID: ${transactionId} • Generated on ${new Date().toLocaleDateString()}`,
      startX,
      legalY + 12,
      { align: 'center', width: contentWidth }
    );

    doc.end();

  } catch (err) {
    console.error("Generate Invoice PDF Error:", err.message);
    
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