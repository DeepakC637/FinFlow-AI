const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';

test('FinFlow Standalone Mode — Integration Test Suite (No Database)', async (t) => {
  // 1. Base Health Check
  await t.test('1. API Health Check responds with 200', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /AI Invoice Extraction API is running/i);
  });

  // 2. File Upload Validation: Missing File
  await t.test('2. Ephemeral OCR File Upload: Missing file rejected with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/invoices/scan`, {
      method: 'POST',
      body: new FormData() // Empty form data
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /No file uploaded/i);
  });

  // 3. File Upload Validation: Invalid File Type
  await t.test('3. Ephemeral OCR File Upload: Non-image/PDF rejected with 400', async () => {
    const formData = new FormData();
    const fakeFile = new Blob(['malicious executable content'], { type: 'application/x-msdownload' });
    formData.append('invoice', fakeFile, 'virus.exe');

    const res = await fetch(`${BASE_URL}/api/v1/invoices/scan`, {
      method: 'POST',
      body: formData
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /Only JPEG, PNG, WEBP, and PDF files are allowed/i);
  });

  // 4. File Upload Validation: File Size Exceeding 10MB
  await t.test('4. Ephemeral OCR File Upload: File > 10MB rejected with 413', async () => {
    const formData = new FormData();
    // Create an 11MB buffer blob
    const largeBuffer = new Uint8Array(11 * 1024 * 1024);
    const largeBlob = new Blob([largeBuffer], { type: 'image/jpeg' });
    formData.append('invoice', largeBlob, 'large_receipt.jpg');

    const res = await fetch(`${BASE_URL}/api/v1/invoices/scan`, {
      method: 'POST',
      body: formData
    });
    assert.equal(res.status, 413);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /File too large/i);
  });

  // 5. Safe Logout Clears Cookies
  await t.test('5. Logout safely clears session cookie and returns 200', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/logout`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.message, 'Logged out successfully');

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Set-Cookie header must be present on logout');
    assert.match(setCookie, /token=/i);
    // Verifies expiry is in the past (epoch 1970)
    assert.match(setCookie, /Expires=Thu, 01 Jan 1970/i);
  });
});
