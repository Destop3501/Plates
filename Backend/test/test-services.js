/**
 * Test Suite for Plates Backend Services
 * Run via: node --env-file=.env test/test-services.js
 */

const { 
  getFriendList, 
  getUserBalances, 
  getAllRestaurants, 
  getRestaurantWithMenu 
} = require('../services');

async function runBackendTests() {
  console.log('====================================================');
  console.log('   PLATES BACKEND & SUPABASE CONNECTION TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  // 1. TEST: Restaurants Service
  try {
    console.log('1️⃣ Testing Restaurants Module (Fetching Directory)...');
    const restaurants = await getAllRestaurants();
    console.log(`   ✅ SUCCESS: Fetched ${restaurants ? restaurants.length : 0} restaurants.`);
    passedCount++;
  } catch (err) {
    console.error(`   ❌ FAILED: ${err.message}`);
    failedCount++;
  }

  // 2. TEST: Friendships Service
  try {
    console.log('\n2️⃣ Testing Friends Module...');
    // Using a placeholder UUID to verify query structure & RLS
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const friends = await getFriendList(testUserId);
    console.log(`   ✅ SUCCESS: Friend query executed smoothly (${friends.length} friends returned).`);
    passedCount++;
  } catch (err) {
    console.error(`   ❌ FAILED: ${err.message}`);
    failedCount++;
  }

  // 3. TEST: Billing & Balances Service
  try {
    console.log('\n3️⃣ Testing Billing Module (Calculate Balances)...');
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const balances = await getUserBalances(testUserId);
    console.log(`   ✅ SUCCESS: Calculated balances successfully:`, balances);
    passedCount++;
  } catch (err) {
    console.error(`   ❌ FAILED: ${err.message}`);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`   SUMMARY: ${passedCount} Passed | ${failedCount} Failed`);
  console.log('====================================================\n');
}

runBackendTests();
