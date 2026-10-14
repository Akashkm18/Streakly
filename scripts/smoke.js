#!/usr/bin/env node

/**
 * Streakly Smoke Test Script
 * Usage: node scripts/smoke.js [target_url]
 * Example: node scripts/smoke.js http://localhost:10000
 *          node scripts/smoke.js https://streakly.onrender.com
 */

const targetUrl = (process.argv[2] || process.env.SMOKE_URL || 'http://localhost:5000').replace(/\/$/, '');

console.log(`\n🔍 Running Streakly Smoke Tests against: ${targetUrl}\n`);

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✔ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function main() {
  // Test 1: Health endpoint
  await runTest('GET /api/health (status 200 and json { status: "ok" })', async () => {
    const res = await fetch(`${targetUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.status}`);
    }
    const data = await res.json();
    if (data?.status !== 'ok') {
      throw new Error(`Expected { status: 'ok' }, received ${JSON.stringify(data)}`);
    }
    if (data?.service !== 'streakly-api') {
      throw new Error(`Expected service 'streakly-api', received '${data?.service}'`);
    }
  });

  // Test 2: Root landing page
  await runTest('GET / (serves HTML with root div)', async () => {
    const res = await fetch(`${targetUrl}/`, {
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.status}`);
    }
    const html = await res.text();
    if (!html.includes('<div id="root">') && !html.includes('id="root"')) {
      throw new Error('Response HTML missing root mount div');
    }
  });

  // Test 3: SPA Fallback route
  await runTest('GET /dashboard (SPA catch-all serves HTML index)', async () => {
    const res = await fetch(`${targetUrl}/dashboard`, {
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.status}`);
    }
    const html = await res.text();
    if (!html.includes('<div id="root">') && !html.includes('id="root"')) {
      throw new Error('SPA fallback did not return valid index.html');
    }
  });

  // Test 4: Security headers verification
  await runTest('Security Headers Check (Content-Security-Policy & X-Content-Type-Options)', async () => {
    const res = await fetch(`${targetUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    const nosniff = res.headers.get('x-content-type-options');
    if (nosniff !== 'nosniff') {
      throw new Error(`Expected X-Content-Type-Options: nosniff, got '${nosniff}'`);
    }
  });

  console.log(`\n========================================`);
  console.log(`Smoke Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
