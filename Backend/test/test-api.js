/**
 * Express REST API Endpoint Test Runner
 * Run via: node --env-file=.env test/test-api.js
 */

const http = require('http');
const app = require('../server');

let server;
const PORT = 3001; // Use test port 3001 to avoid conflicts

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      'x-user-id': '00000000-0000-0000-0000-000000000000', // Dev test user ID for middleware
      ...headers
    };

    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runApiTests() {
  console.log('====================================================');
  console.log('       PLATES EXPRESS REST API TEST RUNNER');
  console.log('====================================================\n');

  server = app.listen(PORT);
  let passed = 0;
  let failed = 0;

  try {
    // 1. Health Check
    console.log('1️⃣ GET /api/health');
    const health = await makeRequest('GET', '/api/health');
    if (health.status === 200 && health.body.status === 'ok') {
      console.log('   ✅ PASSED (200 OK)');
      passed++;
    } else {
      console.log('   ❌ FAILED', health);
      failed++;
    }

    // 2. GET /api/restaurants
    console.log('\n2️⃣ GET /api/restaurants');
    const restaurants = await makeRequest('GET', '/api/restaurants');
    if (restaurants.status === 200 && Array.isArray(restaurants.body.restaurants)) {
      console.log(`   ✅ PASSED (200 OK - ${restaurants.body.restaurants.length} restaurants returned)`);
      passed++;
    } else {
      console.log('   ❌ FAILED', restaurants);
      failed++;
    }

    // 3. GET /api/friends
    console.log('\n3️⃣ GET /api/friends');
    const friends = await makeRequest('GET', '/api/friends');
    if (friends.status === 200 && Array.isArray(friends.body.friends)) {
      console.log('   ✅ PASSED (200 OK)');
      passed++;
    } else {
      console.log('   ❌ FAILED', friends);
      failed++;
    }

    // 4. GET /api/billing/summary
    console.log('\n4️⃣ GET /api/billing/summary');
    const summary = await makeRequest('GET', '/api/billing/summary');
    if (summary.status === 200 && summary.body.totalOwed !== undefined) {
      console.log('   ✅ PASSED (200 OK - Balance:', summary.body, ')');
      passed++;
    } else {
      console.log('   ❌ FAILED', summary);
      failed++;
    }

    // 5. GET /api/billing/friend/:friendId
    console.log('\n5️⃣ GET /api/billing/friend/00000000-0000-0000-0000-000000000001 (Friend Bills List)');
    const friendBills = await makeRequest('GET', '/api/billing/friend/00000000-0000-0000-0000-000000000001');
    if (friendBills.status === 200 && Array.isArray(friendBills.body.bills)) {
      console.log(`   ✅ PASSED (200 OK - ${friendBills.body.count} bills with friend)`);
      passed++;
    } else {
      console.log('   ❌ FAILED', friendBills);
      failed++;
    }

    // 6. GET /api/billing/debts/:debtId (Single Bill Details)
    console.log('\n6️⃣ GET /api/billing/debts/00000000-0000-0000-0000-000000000000 (Single Bill Details)');
    const billDetails = await makeRequest('GET', '/api/billing/debts/00000000-0000-0000-0000-000000000000');
    // Expecting 404 or 200 since the test UUID won't exist in DB yet
    if (billDetails.status === 404 || billDetails.status === 200) {
      console.log(`   ✅ PASSED (${billDetails.status} expected response format)`);
      passed++;
    } else {
      console.log('   ❌ FAILED', billDetails);
      failed++;
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`   SUMMARY: ${passed} Passed | ${failed} Failed`);
    console.log('====================================================\n');
  }
}

runApiTests();
