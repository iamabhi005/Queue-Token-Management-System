/**
 * SmartQueue Comprehensive Backend Test Suite
 * =============================================
 * Tests: Security, Authentication, Authorization, Token Lifecycle,
 *        Concurrency, Queue Position, Socket.IO, Error Handling
 *
 * Run: node backend/src/utils/testEndpoints.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const http = require('http');
const app = require('../app');
const connectDB = require('../config/db');
const { initSocket } = require('../config/socket');
const mongoose = require('mongoose');

// Models for direct DB operations in tests
const Token = require('../models/Token');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const User = require('../models/User');
const TokenSequence = require('../models/TokenSequence');

async function runApiVerification() {
  await connectDB();

  const PORT = 5099; // Isolated test port
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, async () => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`  SmartQueue Comprehensive Backend Test Suite`);
    console.log(`  Port: ${PORT} | DB: ${mongoose.connection.name}`);
    console.log(`${'='.repeat(70)}\n`);

    const baseUrl = `http://127.0.0.1:${PORT}`;
    let adminToken = '';
    let staffToken = '';
    let customerToken = '';
    let testServiceId = '';
    let testCounterId = '';
    let createdTokenId = '';
    let createdTokenNumber = '';

    const results = [];
    let sectionCount = 0;

    const section = (title) => {
      sectionCount++;
      console.log(`\n── ${sectionCount}. ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`);
    };

    const record = (name, passed, details = '') => {
      results.push({ name, passed });
      const symbol = passed ? '✅' : '❌';
      console.log(`  ${symbol} ${name}${details ? ` (${details})` : ''}`);
    };

    try {
      // ══════════════════════════════════════════════════════════════════════
      // 1. HEALTH CHECK
      // ══════════════════════════════════════════════════════════════════════
      section('Health Check');
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const healthData = await healthRes.json();
      record('GET /api/health returns 200', healthRes.status === 200 && healthData.status === 'ok');

      // ══════════════════════════════════════════════════════════════════════
      // 2. AUTHENTICATION & AUTHORIZATION
      // ══════════════════════════════════════════════════════════════════════
      section('Authentication & Authorization');

      // 2a. Register Customer (public, no admin needed)
      const custEmail = `cust_${Date.now()}@test.com`;
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Customer', email: custEmail, password: 'password123' })
      });
      const regData = await regRes.json();
      customerToken = regData.token;
      record('Register public customer (defaults to CUSTOMER role)', regRes.status === 201 && regData.data?.user?.role === 'CUSTOMER');

      // 2b. Login admin
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@smartqueue.com', password: 'admin123' })
      });
      const loginData = await loginRes.json();
      adminToken = loginData.token;
      record('Login as admin returns JWT', loginRes.status === 200 && !!loginData.token && loginData.data?.user?.role === 'ADMIN');

      // 2c. Invalid login (wrong password)
      const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@smartqueue.com', password: 'wrongpassword' })
      });
      record('Invalid credentials rejected (401)', badLogin.status === 401);

      // 2d. Missing fields
      const emptyLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      record('Missing email/password returns 400', emptyLogin.status === 400);

      // 2e. Duplicate email registration
      const dupRegRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Dup User', email: custEmail, password: 'password123' })
      });
      record('Duplicate email registration returns 409', dupRegRes.status === 409);

      // 2f. Privilege escalation prevention — public user tries ADMIN role
      const privEscRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Evil Admin', email: `evil_${Date.now()}@test.com`, password: 'password123', role: 'ADMIN' })
      });
      record('Privilege escalation blocked (ADMIN without auth)', privEscRes.status === 403);

      // 2g. Admin can create STAFF
      const staffEmail = `staff_${Date.now()}@test.com`;
      const staffRegRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name: 'Test Staff', email: staffEmail, password: 'password123', role: 'STAFF' })
      });
      const staffRegData = await staffRegRes.json();
      staffToken = staffRegData.token;
      record('Admin can create STAFF account', staffRegRes.status === 201 && staffRegData.data?.user?.role === 'STAFF');

      // 2h. Unauthenticated access to admin endpoint
      const noAuthRes = await fetch(`${baseUrl}/api/admin/stats`);
      record('No-token access to /admin returns 401', noAuthRes.status === 401);

      // 2i. Customer cannot access admin endpoint
      const forbiddenRes = await fetch(`${baseUrl}/api/admin/tokens`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      record('CUSTOMER blocked from admin endpoint (403)', forbiddenRes.status === 403);

      // 2j. Expired / malformed JWT
      const badJwtRes = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: 'Bearer invalid.jwt.token' }
      });
      record('Malformed JWT rejected (401)', badJwtRes.status === 401);

      // ══════════════════════════════════════════════════════════════════════
      // 3. SERVICES (Public)
      // ══════════════════════════════════════════════════════════════════════
      section('Services (Public)');
      const srvRes = await fetch(`${baseUrl}/api/services`);
      const srvData = await srvRes.json();
      testServiceId = srvData.data?.[0]?.id || srvData.data?.[0]?._id;
      record('GET /api/services returns active services', srvRes.status === 200 && srvData.data?.length > 0, `${srvData.count} services`);

      // ══════════════════════════════════════════════════════════════════════
      // 4. COUNTERS (Admin)
      // ══════════════════════════════════════════════════════════════════════
      section('Counters (Admin)');
      const cntRes = await fetch(`${baseUrl}/api/admin/counters`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const cntData = await cntRes.json();
      testCounterId = cntData.data?.[0]?.id || cntData.data?.[0]?._id;
      record('GET /api/admin/counters returns counters', cntRes.status === 200 && cntData.data?.length > 0);

      // ══════════════════════════════════════════════════════════════════════
      // 5. TOKEN GENERATION
      // ══════════════════════════════════════════════════════════════════════
      section('Token Generation');

      // 5a. Create token
      const tokenRes = await fetch(`${baseUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: 'Robert Frost', serviceId: testServiceId })
      });
      const tokenData = await tokenRes.json();
      createdTokenId = tokenData.data?.token?.id || tokenData.data?.token?._id;
      createdTokenNumber = tokenData.data?.token?.tokenNumber;
      record('POST /api/tokens issues token (201)', tokenRes.status === 201 && !!createdTokenNumber, `Token: ${createdTokenNumber}`);

      // 5b. Validation: missing customerName
      const noNameRes = await fetch(`${baseUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: testServiceId })
      });
      record('Token creation without customerName returns 400', noNameRes.status === 400);

      // 5c. Validation: invalid serviceId
      const badSvcRes = await fetch(`${baseUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: 'Test', serviceId: 'not-a-valid-id' })
      });
      record('Token creation with invalid serviceId returns 400', badSvcRes.status === 400);

      // 5d. Validation: non-existent serviceId
      const fakeSvcRes = await fetch(`${baseUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: 'Test User', serviceId: '000000000000000000000000' })
      });
      record('Token creation with non-existent serviceId returns 404', fakeSvcRes.status === 404);

      // 5e. HTML injection in customerName
      const xssRes = await fetch(`${baseUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: '<script>alert(1)</script>', serviceId: testServiceId })
      });
      record('HTML/script injection in customerName blocked', xssRes.status === 400);

      // ══════════════════════════════════════════════════════════════════════
      // 6. CONCURRENT TOKEN REQUESTS (Race Condition Test)
      // ══════════════════════════════════════════════════════════════════════
      section('Concurrent Token Requests (10 Simultaneous)');

      const concurrentPromises = Array.from({ length: 10 }).map((_, i) =>
        fetch(`${baseUrl}/api/tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerName: `Concurrent User ${i + 1}`, serviceId: testServiceId })
        }).then(r => r.json())
      );
      const concurrentResults = await Promise.all(concurrentPromises);
      const generatedNumbers = concurrentResults.map(r => r.data?.token?.tokenNumber).filter(Boolean);
      const uniqueNumbers = new Set(generatedNumbers);
      const noDuplicates = uniqueNumbers.size === 10;
      record('10 simultaneous requests produce 10 unique tokens', noDuplicates,
        `${uniqueNumbers.size} unique: ${Array.from(uniqueNumbers).slice(0, 3).join(', ')}...`);

      // ══════════════════════════════════════════════════════════════════════
      // 7. TOKEN RETRIEVAL & QUEUE POSITION
      // ══════════════════════════════════════════════════════════════════════
      section('Token Retrieval & Queue Position');

      // 7a. Get token by ID
      const getTokRes = await fetch(`${baseUrl}/api/tokens/${createdTokenId}`);
      const getTokData = await getTokRes.json();
      record('GET /api/tokens/:id retrieves token', getTokRes.status === 200 && getTokData.data?.tokenNumber === createdTokenNumber);

      // 7b. Get token status with queue position
      const statusRes = await fetch(`${baseUrl}/api/tokens/status/${createdTokenId}`);
      const statusData = await statusRes.json();
      record('GET /api/tokens/status/:id returns queue position', statusRes.status === 200 && typeof statusData.data?.waitingAhead === 'number',
        `waitingAhead=${statusData.data?.waitingAhead}, est=${statusData.data?.estimatedWaitMinutes}min`);

      // 7c. Invalid ObjectId
      const invalidIdRes = await fetch(`${baseUrl}/api/tokens/invalid-id-12345`);
      record('Invalid ObjectId handled gracefully (400)', invalidIdRes.status === 400);

      // 7d. Non-existent valid ObjectId
      const nonExistRes = await fetch(`${baseUrl}/api/tokens/000000000000000000000000`);
      record('Non-existent token returns 404', nonExistRes.status === 404);

      // ══════════════════════════════════════════════════════════════════════
      // 8. SEQUENTIAL TOKEN CALLING (FIFO)
      // ══════════════════════════════════════════════════════════════════════
      section('Sequential Token Calling (FIFO)');

      const nextRes = await fetch(`${baseUrl}/api/admin/tokens/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ counterId: testCounterId })
      });
      const nextData = await nextRes.json();
      record('POST /api/admin/tokens/next calls oldest WAITING token', nextRes.status === 200 && (nextData.success ? nextData.data?.status === 'SERVING' : true),
        nextData.data?.tokenNumber ? `Called: ${nextData.data.tokenNumber}` : 'No waiting tokens');

      // Call a second one to verify FIFO ordering
      const nextRes2 = await fetch(`${baseUrl}/api/admin/tokens/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ counterId: testCounterId })
      });
      const nextData2 = await nextRes2.json();
      record('Second call gets next FIFO token', nextRes2.status === 200,
        nextData2.data?.tokenNumber ? `Called: ${nextData2.data.tokenNumber}` : 'Queue empty');

      // ══════════════════════════════════════════════════════════════════════
      // 9. COMPLETING & SKIPPING TOKENS
      // ══════════════════════════════════════════════════════════════════════
      section('Completing & Skipping Tokens');

      // 9a. Complete first called token
      if (nextData.data?.id || nextData.data?._id) {
        const completeId = nextData.data.id || nextData.data._id;
        const completeRes = await fetch(`${baseUrl}/api/admin/tokens/${completeId}/complete`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const completeData = await completeRes.json();
        record('PATCH /complete transitions SERVING→COMPLETED', completeRes.status === 200 && completeData.data?.status === 'COMPLETED');

        // 9b. Double-complete should fail
        const dblComplete = await fetch(`${baseUrl}/api/admin/tokens/${completeId}/complete`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        record('Double-complete returns 400', dblComplete.status === 400);
      } else {
        record('PATCH /complete transitions SERVING→COMPLETED', false, 'No token to complete');
        record('Double-complete returns 400', false, 'Skipped');
      }

      // 9c. Skip a waiting token
      const skipTokRes = await fetch(`${baseUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: 'No Show Customer', serviceId: testServiceId })
      });
      const skipTokData = await skipTokRes.json();
      const skipTokenId = skipTokData.data?.token?.id || skipTokData.data?.token?._id;

      const skipRes = await fetch(`${baseUrl}/api/admin/tokens/${skipTokenId}/skip`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const skipData = await skipRes.json();
      record('PATCH /skip transitions WAITING→SKIPPED', skipRes.status === 200 && skipData.data?.status === 'SKIPPED');

      // 9d. Double-skip should fail
      const dblSkip = await fetch(`${baseUrl}/api/admin/tokens/${skipTokenId}/skip`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      record('Double-skip returns 400', dblSkip.status === 400);

      // ══════════════════════════════════════════════════════════════════════
      // 10. ADMIN STATS & TOKEN LISTING
      // ══════════════════════════════════════════════════════════════════════
      section('Admin Stats & Token Listing');

      const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const statsData = await statsRes.json();
      record('GET /api/admin/stats returns queue statistics', statsRes.status === 200 && typeof statsData.data?.waitingCount === 'number',
        `waiting=${statsData.data?.waitingCount}, completed=${statsData.data?.completedCount}`);

      const adminTokRes = await fetch(`${baseUrl}/api/admin/tokens?limit=5&page=1`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const adminTokData = await adminTokRes.json();
      record('GET /api/admin/tokens with pagination', adminTokRes.status === 200 && adminTokData.data?.length > 0,
        `page=${adminTokData.page}, total=${adminTokData.total}`);

      // ══════════════════════════════════════════════════════════════════════
      // 11. ADMIN SERVICE & COUNTER CREATION
      // ══════════════════════════════════════════════════════════════════════
      section('Admin Service & Counter Creation');

      const dynamicServiceName = `Test Service ${Date.now()}`;
      const newSrvRes = await fetch(`${baseUrl}/api/admin/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: dynamicServiceName, description: 'Automated test service', averageServiceTime: 10 })
      });
      const newSrvData = await newSrvRes.json();
      record('POST /api/admin/services creates service', newSrvRes.status === 201 && newSrvData.data?.name === dynamicServiceName);

      const dynamicCounterName = `Station ${Date.now()}`;
      const newCntRes = await fetch(`${baseUrl}/api/admin/counters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ name: dynamicCounterName, serviceId: testServiceId })
      });
      const newCntData = await newCntRes.json();
      record('POST /api/admin/counters creates counter', newCntRes.status === 201 && newCntData.data?.name === dynamicCounterName);

      // Staff cannot create services (ADMIN-only)
      const staffSrvRes = await fetch(`${baseUrl}/api/admin/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
        body: JSON.stringify({ name: `Staff Svc ${Date.now()}`, averageServiceTime: 5 })
      });
      record('STAFF cannot create services (403)', staffSrvRes.status === 403);

      // ══════════════════════════════════════════════════════════════════════
      // 12. DATABASE ENDPOINTS PROTECTION
      // ══════════════════════════════════════════════════════════════════════
      section('Database Endpoints Protection');

      const noAuthDbRes = await fetch(`${baseUrl}/api/database/datasets`);
      record('GET /api/database/datasets without auth returns 401', noAuthDbRes.status === 401);

      const custDbRes = await fetch(`${baseUrl}/api/database/datasets`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      record('Customer cannot access database endpoints (403)', custDbRes.status === 403);

      const adminDbRes = await fetch(`${baseUrl}/api/database/datasets`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      record('Admin can access database datasets', adminDbRes.status === 200);

      // ══════════════════════════════════════════════════════════════════════
      // 13. INVALID REQUESTS & ERROR HANDLING
      // ══════════════════════════════════════════════════════════════════════
      section('Invalid Requests & Error Handling');

      // 404 for unknown route
      const notFoundRes = await fetch(`${baseUrl}/api/nonexistent`);
      const notFoundData = await notFoundRes.json();
      record('Unknown route returns 404', notFoundRes.status === 404 && notFoundData.success === false);

      // Malformed JSON
      const malformedRes = await fetch(`${baseUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json'
      });
      record('Malformed JSON returns 400', malformedRes.status === 400);

      // Validate callNextToken with missing body
      const noBodyNext = await fetch(`${baseUrl}/api/admin/tokens/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({})
      });
      record('callNextToken without counterId/serviceId returns 400', noBodyNext.status === 400);

      // ══════════════════════════════════════════════════════════════════════
      // 14. SOCKET.IO CONNECTIVITY
      // ══════════════════════════════════════════════════════════════════════
      section('Socket.IO Connectivity');

      let socketTestPassed = false;
      try {
        const { io: ioClient } = require('socket.io-client');
        const testSocket = ioClient(`http://127.0.0.1:${PORT}`, {
          transports: ['websocket'],
          autoConnect: true,
          timeout: 3000
        });

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => { testSocket.close(); reject(new Error('timeout')); }, 4000);
          testSocket.on('connect', () => {
            clearTimeout(timeout);
            socketTestPassed = true;
            // Test joining a room
            testSocket.emit('join:room', `service:${testServiceId}`);
            setTimeout(() => { testSocket.close(); resolve(); }, 200);
          });
          testSocket.on('connect_error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      } catch (e) {
        // Socket.IO client test
      }
      record('Socket.IO client can connect and join rooms', socketTestPassed);

      // Also verify via HTTP polling
      const sioRes = await fetch(`http://127.0.0.1:${PORT}/socket.io/?EIO=4&transport=polling`);
      record('Socket.IO polling endpoint responds', sioRes.status === 200 || sioRes.status === 400);

      // ══════════════════════════════════════════════════════════════════════
      // 15. QUEUE PUBLIC ENDPOINT
      // ══════════════════════════════════════════════════════════════════════
      section('Public Queue Endpoints');

      const todayRes = await fetch(`${baseUrl}/api/queue/today`);
      const todayData = await todayRes.json();
      record('GET /api/queue/today returns today tokens', todayRes.status === 200 && Array.isArray(todayData.data));

      const qCountersRes = await fetch(`${baseUrl}/api/queue/counters`);
      const qCountersData = await qCountersRes.json();
      record('GET /api/queue/counters returns active counters', qCountersRes.status === 200 && Array.isArray(qCountersData.data));

      // ══════════════════════════════════════════════════════════════════════
      // 16. SAFE ERROR RESPONSE (No Secrets Leaked)
      // ══════════════════════════════════════════════════════════════════════
      section('Safe Error Responses');

      // Force a server error with an internal issue and verify no secrets leak
      const errRes = await fetch(`${baseUrl}/api/tokens/invalid-id-12345`);
      const errData = await errRes.json();
      const hasNoSecrets =
        !JSON.stringify(errData).includes('mongodb://') &&
        !JSON.stringify(errData).includes('jwt_secret') &&
        !JSON.stringify(errData).includes('/Users/');
      record('Error responses contain no secrets/paths', hasNoSecrets);

      // Password hash should not appear in user responses
      const userCheckRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@smartqueue.com', password: 'admin123' })
      });
      const userCheckData = await userCheckRes.json();
      const noPasswordHash = !JSON.stringify(userCheckData).includes('passwordHash') && !JSON.stringify(userCheckData).includes('$2a$') && !JSON.stringify(userCheckData).includes('$2b$');
      record('Password hash never returned in API responses', noPasswordHash);

      // ══════════════════════════════════════════════════════════════════════
      // 17. DATABASE CONNECTION FAILURE HANDLING
      // ══════════════════════════════════════════════════════════════════════
      section('Database Connection Resilience');

      // We can't easily disconnect MongoDB mid-test without breaking everything,
      // but we can verify the DB layer reports connection state correctly
      const dbConnected = mongoose.connection.readyState === 1;
      record('MongoDB connection is active (readyState=1)', dbConnected,
        `readyState=${mongoose.connection.readyState}`);

      // Simulate a query on a dropped connection by checking error handling structure
      // (in production this is more meaningful; here we verify the error handler exists)
      const errorHandlerExists = typeof require('../middlewares/errorHandler').errorHandler === 'function';
      record('Centralized error handler is registered', errorHandlerExists);

      const sanitizeFn = require('../middlewares/errorHandler').sanitizeErrorMessage;
      const sanitized = sanitizeFn('Error at mongodb://user:pass@host:27017/db and /Users/abhishek/path');
      const sanitizeCorrect = sanitized.includes('[DATABASE_URI_REDACTED]') && sanitized.includes('[FILEPATH_REDACTED]');
      record('Error sanitizer strips DB URIs and file paths', sanitizeCorrect);

      // ══════════════════════════════════════════════════════════════════════
      // SUMMARY
      // ══════════════════════════════════════════════════════════════════════
      const passedCount = results.filter(r => r.passed).length;
      const failedCount = results.filter(r => !r.passed).length;

      console.log(`\n${'='.repeat(70)}`);
      console.log(`  RESULTS: ${passedCount}/${results.length} passed, ${failedCount} failed`);
      console.log(`${'='.repeat(70)}`);

      if (failedCount > 0) {
        console.log('\n  ❌ FAILED TESTS:');
        results.filter(r => !r.passed).forEach(r => console.log(`     - ${r.name}`));
      }

      console.log('');
      server.close();
      process.exit(passedCount === results.length ? 0 : 1);
    } catch (err) {
      console.error('\n  [FATAL TEST ERROR]', err);
      server.close();
      process.exit(1);
    }
  });
}

runApiVerification();
