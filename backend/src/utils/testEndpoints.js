require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const app = require('../app');
const connectDB = require('../config/db');

async function runApiVerification() {
  await connectDB();
  const PORT = 5099; // Isolated test port
  const server = app.listen(PORT, async () => {
    console.log(`\n======================================================`);
    console.log(`[SmartQueue] Running Comprehensive Backend Test Suite`);
    console.log(`======================================================\n`);

    const baseUrl = `http://127.0.0.1:${PORT}`;
    let adminToken = '';
    let customerToken = '';
    let testServiceId = '';
    let testCounterId = '';
    let createdTokenId = '';

    const results = [];
    const record = (name, passed, details = '') => {
      results.push({ name, passed });
      const symbol = passed ? '✅' : '❌';
      console.log(`${symbol} ${name} ${details ? `(${details})` : ''}`);
    };

    try {
      // 1. Health Check
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const healthData = await healthRes.json();
      record('GET /api/health', healthRes.status === 200 && healthData.status === 'ok');

      // 2. Auth - Register Customer
      const testEmail = `jane_${Date.now()}@example.com`;
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Customer',
          email: testEmail,
          password: 'password123',
          role: 'CUSTOMER'
        })
      });
      const regData = await regRes.json();
      customerToken = regData.token;
      record('POST /api/auth/register (Customer)', regRes.status === 201 && !!regData.token);

      // 3. Auth - Login Admin
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@smartqueue.com',
          password: 'admin123'
        })
      });
      const loginData = await loginRes.json();
      adminToken = loginData.token;
      record('POST /api/auth/login (Admin)', loginRes.status === 200 && loginData.data?.user?.role === 'ADMIN');

      // 4. Auth - Invalid Login (should fail with 401)
      const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@smartqueue.com', password: 'wrongpassword' })
      });
      record('POST /api/auth/login (Invalid credentials rejected)', badLogin.status === 401);

      // 5. Services - Public GET /api/services
      const srvRes = await fetch(`${baseUrl}/api/services`);
      const srvData = await srvRes.json();
      testServiceId = srvData.data[0].id || srvData.data[0]._id;
      record('GET /api/services', srvRes.status === 200 && srvData.data.length > 0, `Found ${srvData.count} services`);

      // 6. Admin Counters - GET /api/admin/counters
      const cntRes = await fetch(`${baseUrl}/api/admin/counters`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const cntData = await cntRes.json();
      testCounterId = cntData.data[0].id || cntData.data[0]._id;
      record('GET /api/admin/counters', cntRes.status === 200 && cntData.data.length > 0);

      // 7. Security - Customer accessing Admin endpoint (should fail with 403 Forbidden)
      const forbiddenRes = await fetch(`${baseUrl}/api/admin/counters`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      record('Security: Customer role blocked from admin endpoint (403)', forbiddenRes.status === 403);

      // 8. Security - Unauthenticated access to admin endpoint (should fail with 401)
      const noAuthRes = await fetch(`${baseUrl}/api/admin/stats`);
      record('Security: No token blocked from admin endpoint (401)', noAuthRes.status === 401);

      // 9. Tokens - POST /api/tokens (Customer Token Generation)
      const tokenRes = await fetch(`${baseUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Robert Frost',
          serviceId: testServiceId
        })
      });
      const tokenData = await tokenRes.json();
      createdTokenId = tokenData.data?.token?.id || tokenData.data?.token?._id;
      record('POST /api/tokens (Issue token)', tokenRes.status === 201 && !!tokenData.data?.token?.tokenNumber, `Token: ${tokenData.data?.token?.tokenNumber}`);

      // 10. Concurrency Safety - 10 Parallel Token Requests (Requirement 10)
      console.log('\n[Concurrency Test] Firing 10 simultaneous token requests to test sequence safety...');
      const concurrentPromises = Array.from({ length: 10 }).map((_, i) =>
        fetch(`${baseUrl}/api/tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: `Concurrent User ${i + 1}`,
            serviceId: testServiceId
          })
        }).then(r => r.json())
      );

      const concurrentResults = await Promise.all(concurrentPromises);
      const generatedNumbers = concurrentResults.map(r => r.data?.token?.tokenNumber);
      const uniqueNumbers = new Set(generatedNumbers);
      const noDuplicates = uniqueNumbers.size === 10;
      record('Requirement 10: Concurrency-safe atomic token generation', noDuplicates, `10 requests -> 10 unique tokens: ${Array.from(uniqueNumbers).slice(0, 3).join(', ')}...`);

      // 11. Tokens - GET /api/tokens/:id
      const getTokRes = await fetch(`${baseUrl}/api/tokens/${createdTokenId}`);
      const getTokData = await getTokRes.json();
      record('GET /api/tokens/:id', getTokRes.status === 200 && (getTokData.data?.id === createdTokenId || getTokData.data?._id === createdTokenId));

      // 12. Tokens - GET /api/tokens/status/:id
      const statusRes = await fetch(`${baseUrl}/api/tokens/status/${createdTokenId}`);
      const statusData = await statusRes.json();
      record('GET /api/tokens/status/:id', statusRes.status === 200 && typeof statusData.data?.waitingAhead === 'number');

      // 13. Admin - GET /api/admin/tokens
      const adminTokRes = await fetch(`${baseUrl}/api/admin/tokens`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const adminTokData = await adminTokRes.json();
      record('GET /api/admin/tokens', adminTokRes.status === 200 && adminTokData.data.length > 0);

      // 14. Admin - GET /api/admin/stats
      const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const statsData = await statsRes.json();
      record('GET /api/admin/stats', statsRes.status === 200 && typeof statsData.data?.waitingCount === 'number');

      // 15. Admin - POST /api/admin/tokens/next
      const nextRes = await fetch(`${baseUrl}/api/admin/tokens/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ counterId: testCounterId })
      });
      const nextData = await nextRes.json();
      record('POST /api/admin/tokens/next (Call next token)', nextRes.status === 200 && (nextData.success ? !!nextData.data?.tokenNumber : true));

      // 16. Admin - PATCH /api/admin/tokens/:id/complete
      const completeRes = await fetch(`${baseUrl}/api/admin/tokens/${createdTokenId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const completeData = await completeRes.json();
      record('PATCH /api/admin/tokens/:id/complete', completeRes.status === 200 && completeData.data?.status === 'COMPLETED');

      // 17. Admin - PATCH /api/admin/tokens/:id/skip
      // Issue one token to skip
      const tokToSkipRes = await fetch(`${baseUrl}/api/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: 'No Show Customer', serviceId: testServiceId })
      });
      const tokToSkipData = await tokToSkipRes.json();
      const skipTokenId = tokToSkipData.data?.token?.id || tokToSkipData.data?.token?._id;

      const skipRes = await fetch(`${baseUrl}/api/admin/tokens/${skipTokenId}/skip`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const skipData = await skipRes.json();
      record('PATCH /api/admin/tokens/:id/skip', skipRes.status === 200 && skipData.data?.status === 'SKIPPED');

      // 18. Admin - POST /api/admin/services
      const dynamicServiceName = `Special Verification ${Date.now()}`;
      const newSrvRes = await fetch(`${baseUrl}/api/admin/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: dynamicServiceName,
          description: 'Document verification and biometric capture',
          averageServiceTime: 18
        })
      });
      const newSrvData = await newSrvRes.json();
      record('POST /api/admin/services (Create service)', newSrvRes.status === 201 && (newSrvData.data?.name === dynamicServiceName));

      // 19. Admin - POST /api/admin/counters
      const dynamicCounterName = `Station ${Date.now()}`;
      const newCntRes = await fetch(`${baseUrl}/api/admin/counters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: dynamicCounterName,
          serviceId: testServiceId
        })
      });
      const newCntData = await newCntRes.json();
      record('POST /api/admin/counters (Create counter)', newCntRes.status === 201 && (newCntData.data?.name === dynamicCounterName));

      // 20. Error Handling - Invalid MongoDB ObjectId (Requirement 11)
      const invalidIdRes = await fetch(`${baseUrl}/api/tokens/invalid-id-12345`);
      const invalidIdData = await invalidIdRes.json();
      record('Requirement 11: Invalid ObjectId handled gracefully (400)', invalidIdRes.status === 400 && invalidIdData.success === false, invalidIdData.message);

      // Summary
      const passedCount = results.filter(r => r.passed).length;
      console.log(`\n======================================================`);
      console.log(`[Results] Passed ${passedCount}/${results.length} tests successfully!`);
      console.log(`======================================================\n`);

      server.close();
      process.exit(passedCount === results.length ? 0 : 1);
    } catch (err) {
      console.error('[Test Error]', err);
      server.close();
      process.exit(1);
    }
  });
}

runApiVerification();
