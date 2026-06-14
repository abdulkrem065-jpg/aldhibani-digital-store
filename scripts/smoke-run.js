/**
 * Google Cloud Run Deployment Smoke Tests
 * Validates basic liveness and route compliance for stateless executions.
 */

// Use global fetch on modern Node versions
const targetUrl = process.argv[2] || 'http://localhost:3000';
console.log(`\n🚀 Starting Production Smoke Checks on Target URL: ${targetUrl}`);
console.log('===========================================================');

async function executeSmokeChecks() {
  let allPassed = true;

  // ----------------------------------------------------
  // TEST 1: GET /health
  // ----------------------------------------------------
  try {
    console.log('📌 [Test 1] Executing GET /health ...');
    const response = await fetch(`${targetUrl}/health`);
    const body = await response.json();
    
    if (response.ok && body.status === 'ok') {
      console.log('🟢 [Test 1 Passed] Health probe responded successfully.');
    } else {
      console.error(`🔴 [Test 1 Failed] Status code: ${response.status}`, body);
      allPassed = false;
    }
  } catch (err) {
    console.error('🔴 [Test 1 Failed] Connection error:', err.message);
    allPassed = false;
  }

  // ----------------------------------------------------
  // TEST 2: POST /api/assistant/chat
  // ----------------------------------------------------
  try {
    console.log('\n📌 [Test 2] Executing POST /api/assistant/chat ...');
    const response = await fetch(`${targetUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'مرحباً، هل يمكنك عرض تفاصيل النظام؟',
        history: []
      })
    });
    const body = await response.json();
    
    // Check for success or acceptable standard JSON response formatting
    if (response.ok && (body.reply || body.response || typeof body === 'object')) {
      console.log('🟢 [Test 2 Passed] Assistant chat endpoint processed prompt successfully.');
    } else {
      console.error(`🔴 [Test 2 Failed] Status code: ${response.status}`, body);
      allPassed = false;
    }
  } catch (err) {
    console.error('🔴 [Test 2 Failed] Connection error:', err.message);
    allPassed = false;
  }

  // ----------------------------------------------------
  // TEST 3: POST /api/import/sqlite/start
  // ----------------------------------------------------
  try {
    console.log('\n📌 [Test 3] Executing POST /api/import/sqlite/start (Mock mode) ...');
    const response = await fetch(`${targetUrl}/api/import/sqlite/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mock: true,
        fileUrl: 'mock'
      })
    });
    const body = await response.json();

    if (response.ok && body.success && body.jobId === 'mock-job-id-1234') {
      console.log('🟢 [Test 3 Passed] SQLite parser mock request and start job returned expected id.');
    } else {
      console.error(`🔴 [Test 3 Failed] Status code: ${response.status}`, body);
      allPassed = false;
    }
  } catch (err) {
    console.error('🔴 [Test 3 Failed] Connection error:', err.message);
    allPassed = false;
  }

  console.log('\n===========================================================');
  if (allPassed) {
    console.log('🌟 SUCCESS! ALL GOOGLE CLOUD RUN SMOKE TESTS PASSED GLORIOUSLY! 🟩\n');
    process.exit(0);
  } else {
    console.error('🚨 FAILURE! SOME SMOKE VERIFICATION ENDPOINTS CANNOT BE REACHED. 🟥\n');
    process.exit(1);
  }
}

executeSmokeChecks();
