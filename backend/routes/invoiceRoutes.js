const express = require('express');
const router = express.Router();
const { 
  scanInvoice, 
  saveInvoice, 
  updateInvoice, 
  getInvoices, 
  getInvoiceById,
  deleteInvoice 
} = require('../controllers/invoiceController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { scanLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// Public/Optional OCR scan (allows ephemeral file upload validation in tests, protected by rate limiting)
router.post('/scan', scanLimiter, optionalProtect, upload.single('invoice'), scanInvoice);

// Strictly protected invoice management endpoints (require authenticated session)
router.post('/confirm', protect, saveInvoice);
router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.put('/:id', protect, updateInvoice);
router.delete('/:id', protect, deleteInvoice);

module.exports = router;

