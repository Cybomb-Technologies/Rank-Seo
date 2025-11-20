// jobs/resetUsage.js
const cron = require('node-cron');
const User = require('./models/User');

// Run on the first day of every month at 00:00
cron.schedule('0 0 1 * *', async () => {
  try {
    const result = await User.updateMany(
      {},
      { 
        $set: { 
          auditsUsed: 0,
          keywordReportsUsed: 0,
          businessNamesUsed: 0,
          keywordChecksUsed: 0,
          keywordScrapesUsed: 0,
          lastUsageReset: new Date()
        }
      }
    );
    console.log(`✅ Monthly usage reset completed for ${result.modifiedCount} users`);
  } catch (error) {
    console.error('❌ Error resetting monthly usage:', error);
  }
});

module.exports = cron;