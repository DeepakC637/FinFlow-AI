const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_signing_tokens';

test('FinFlow Standalone Mode — Database-Dependent Features Disabled Honest Reporting', async (t) => {
  // Generate a mock JWT to test fail-closed behavior on protected endpoints
  const mockToken = jwt.sign({ id: 'mock_user_123', role: 'User' }, JWT_SECRET, { expiresIn: '1h' });
  const mockCookie = `token=${mockToken}`;

  // 1. User Registration Returns 503
  await t.test('1. User Registration returns honest 503 Service Unavailable', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test QA',
        email: 'test@finflow.com',
        password: 'Password123!'
      })
    });
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /database storage has been removed/i);
  });

  // 2. User Login Returns 503
  await t.test('2. User Login returns honest 503 Service Unavailable', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@finflow.com',
        password: 'Password123!'
      })
    });
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /database storage has been removed/i);
  });

  // 3. User Profile Protected Endpoint Fails Closed
  await t.test('3. Profile GET /me returns 401 without token, 503 with token', async () => {
    // Unauthenticated request
    const unauthRes = await fetch(`${BASE_URL}/api/v1/auth/me`);
    assert.equal(unauthRes.status, 401);
    const unauthData = await unauthRes.json();
    assert.equal(unauthData.success, false);

    // Request with token fails closed because user database does not exist
    const tokenRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Cookie: mockCookie }
    });
    assert.equal(tokenRes.status, 503);
    const tokenData = await tokenRes.json();
    assert.equal(tokenData.success, false);
    assert.match(tokenData.message, /database has been removed/i);
  });

  // 4. Profile Update Protected Endpoint Fails Closed
  await t.test('4. Profile PUT /profile returns 401 without token, 503 with token', async () => {
    const unauthRes = await fetch(`${BASE_URL}/api/v1/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' })
    });
    assert.equal(unauthRes.status, 401);

    const tokenRes = await fetch(`${BASE_URL}/api/v1/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: mockCookie 
      },
      body: JSON.stringify({ name: 'New Name' })
    });
    assert.equal(tokenRes.status, 503);
    const tokenData = await tokenRes.json();
    assert.equal(tokenData.success, false);
    assert.match(tokenData.message, /database has been removed/i);
  });

  // 5. Invoice Confirm/Save Returns 401 without token, 503 with token
  await t.test('5. Invoice POST /confirm returns 401 without token, 503 with token', async () => {
    const unauthRes = await fetch(`${BASE_URL}/api/v1/invoices/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorName: 'Vendor X', totalAmount: 500 })
    });
    assert.equal(unauthRes.status, 401);

    const tokenRes = await fetch(`${BASE_URL}/api/v1/invoices/confirm`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: mockCookie 
      },
      body: JSON.stringify({ vendorName: 'Vendor X', totalAmount: 500 })
    });
    assert.equal(tokenRes.status, 503);
    const tokenData = await tokenRes.json();
    assert.equal(tokenData.success, false);
    assert.match(tokenData.message, /database/i);
  });

  // 6. Invoice List Returns 401 without token, 503 with token
  await t.test('6. Invoice GET / returns 401 without token, 503 with token', async () => {
    const unauthRes = await fetch(`${BASE_URL}/api/v1/invoices`);
    assert.equal(unauthRes.status, 401);

    const tokenRes = await fetch(`${BASE_URL}/api/v1/invoices`, {
      headers: { Cookie: mockCookie }
    });
    assert.equal(tokenRes.status, 503);
    const tokenData = await tokenRes.json();
    assert.equal(tokenData.success, false);
    assert.match(tokenData.message, /database/i);
  });

  // 7. Invoice Detail Returns 401 without token, 503 with token
  await t.test('7. Invoice GET /:id returns 401 without token, 503 with token', async () => {
    const unauthRes = await fetch(`${BASE_URL}/api/v1/invoices/inv_12345`);
    assert.equal(unauthRes.status, 401);

    const tokenRes = await fetch(`${BASE_URL}/api/v1/invoices/inv_12345`, {
      headers: { Cookie: mockCookie }
    });
    assert.equal(tokenRes.status, 503);
  });

  // 8. Invoice Update Returns 401 without token, 503 with token
  await t.test('8. Invoice PUT /:id returns 401 without token, 503 with token', async () => {
    const unauthRes = await fetch(`${BASE_URL}/api/v1/invoices/inv_12345`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Paid' })
    });
    assert.equal(unauthRes.status, 401);

    const tokenRes = await fetch(`${BASE_URL}/api/v1/invoices/inv_12345`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Cookie: mockCookie 
      },
      body: JSON.stringify({ status: 'Paid' })
    });
    assert.equal(tokenRes.status, 503);
  });

  // 9. Invoice Delete Returns 401 without token, 503 with token
  await t.test('9. Invoice DELETE /:id returns 401 without token, 503 with token', async () => {
    const unauthRes = await fetch(`${BASE_URL}/api/v1/invoices/inv_12345`, {
      method: 'DELETE'
    });
    assert.equal(unauthRes.status, 401);

    const tokenRes = await fetch(`${BASE_URL}/api/v1/invoices/inv_12345`, {
      method: 'DELETE',
      headers: { Cookie: mockCookie }
    });
    assert.equal(tokenRes.status, 503);
  });

  // 10. Fail-Closed Protection: Arbitrary claims cannot bypass storage absence
  await t.test('10. Fail-closed: Admin claims in JWT cannot bypass missing user store', async () => {
    const adminToken = jwt.sign({ id: 'fake_admin', role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await fetch(`${BASE_URL}/api/v1/invoices?all=true`, {
      headers: { Cookie: `token=${adminToken}` }
    });
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /database has been removed/i);
  });
});
