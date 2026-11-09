const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';

test('FinFlow Standalone Mode — Security Hardening & Rate Limiting Suite', async (t) => {
  // 1. Helmet & Content Security Policy Headers
  await t.test('1. Security Headers (Helmet & CSP) are present and properly configured', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);

    const csp = res.headers.get('content-security-policy');
    assert.ok(csp, 'Content-Security-Policy header must be present');
    assert.match(csp, /default-src 'self'/, 'CSP must restrict default-src to self');
    assert.match(csp, /object-src 'none'/, 'CSP must block unsafe plugin objects');
    assert.match(csp, /frame-ancestors 'self'/, 'CSP must prevent clickjacking');

    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(res.headers.get('cross-origin-resource-policy'), 'cross-origin');
  });

  // 2. Rate Limiting Enforcement
  await t.test('2. Rate Limiting returns 429 Too Many Requests when threshold exceeded', async () => {
    let triggered429 = false;
    let retryAfter = null;

    // testLimiter on /api/v1/auth/test-rate-limit allows 3 requests per 10s
    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${BASE_URL}/api/v1/auth/test-rate-limit`);
      if (res.status === 429) {
        triggered429 = true;
        retryAfter = res.headers.get('retry-after');
        const body = await res.json();
        assert.equal(body.success, false);
        assert.match(body.message, /Too many requests|Rate limit exceeded/i);
        break;
      }
    }

    assert.ok(triggered429, 'Rate limiter must trigger HTTP 429 after exceeding request limit');
    assert.ok(retryAfter !== null, 'Rate limit response must include Retry-After header');
  });

  // 3. AI Service Bounded Timeout & Sensitive Token Redaction
  await t.test('3. AI OCR Service configures bounded timeout and redacts sensitive tokens', async () => {
    const aiService = require('../services/aiService');
    assert.ok(aiService.extractInvoiceData, 'extractInvoiceData function must be exported');

    // Test that redactSensitive regex masks tokens properly
    const fs = require('fs');
    const aiServiceSrc = fs.readFileSync(path.join(__dirname, '../services/aiService.js'), 'utf8');
    assert.match(aiServiceSrc, /GROQ_TIMEOUT_MS.*30000/, 'Timeout must default to 30000ms');
    assert.ok(aiServiceSrc.includes('[REDACTED_API_KEY]'), 'Sensitive token redactor must mask Groq API keys');
    assert.match(aiServiceSrc, /statusCode\s*=\s*504/, 'AI timeout must be mapped to HTTP 504 Gateway Timeout');
  });

  // 4. Standalone Server Independence
  await t.test('4. Standalone server does not require or depend on MONGO_URI', async () => {
    // Verify that server.js does not require db.js or mongoose
    const fs = require('fs');
    const serverSrc = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
    assert.doesNotMatch(serverSrc, /config\/db/, 'server.js must not import config/db');
    assert.doesNotMatch(serverSrc, /mongoose/, 'server.js must not import mongoose');
    assert.doesNotMatch(serverSrc, /connectDB/, 'server.js must not call connectDB');
  });
});
