// Cache busting utility - Force Vercel to rebuild
// Update this timestamp to force a fresh deployment
const CACHE_BUST_TIMESTAMP = Date.now();
const DEPLOYMENT_ID = Math.random().toString(36).substring(7);

console.log(`🚀 CACHE BUST: ${CACHE_BUST_TIMESTAMP} - Deployment ID: ${DEPLOYMENT_ID}`);

// Export for use in other files if needed
module.exports = {
  CACHE_BUST_TIMESTAMP,
  DEPLOYMENT_ID
};
