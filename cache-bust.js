// Cache busting utility - Force Vercel to rebuild
// Update this timestamp to force a fresh deployment
// 🔥 FORCE REBUILD AFTER DATABASE MIGRATION - 2025-01-03
const CACHE_BUST_TIMESTAMP = Date.now();
const DEPLOYMENT_ID = Math.random().toString(36).substring(7);
const FORCE_REBUILD_FLAG = 'DATABASE_MIGRATION_COMPLETE_20250103';

console.log(`🚀 CACHE BUST: ${CACHE_BUST_TIMESTAMP} - Deployment ID: ${DEPLOYMENT_ID}`);
console.log(`🔥 FORCE REBUILD: ${FORCE_REBUILD_FLAG}`);

// Export for use in other files if needed
module.exports = {
  CACHE_BUST_TIMESTAMP,
  DEPLOYMENT_ID,
  FORCE_REBUILD_FLAG,
  databaseMigrationComplete: true
};
