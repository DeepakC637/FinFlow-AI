const { extractInvoiceData } = require('../services/aiService');

// @desc    Process invoice image with AI (Ephemeral OCR Compute)
// @route   POST /api/v1/invoices/scan
// @access  Public / Ephemeral
const scanInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const extractedData = await extractInvoiceData(req.file.path, req.file.mimetype);

    // Ephemeral compute only — operates without database persistence
    return res.status(200).json({
      success: true,
      data: extractedData,
      tempFilePath: req.file.path
    });
  } catch (error) {
    console.error("Scan Error:", error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Confirm and save invoice (Disabled: Database Removed)
// @route   POST /api/v1/invoices/confirm
// @access  Private
const saveInvoice = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Invoice persistence is unavailable: persistent database storage has been removed. You can export invoices directly to PDF or JSON.'
  });
};

// @desc    Update an existing invoice (Disabled: Database Removed)
// @route   PUT /api/v1/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Invoice update is unavailable: persistent database storage has been removed.'
  });
};

// @desc    Get all invoices for authenticated user (Disabled: Database Removed)
// @route   GET /api/v1/invoices
// @access  Private
const getInvoices = async (req, res) => {
  return res.status(503).json({
    success: false,
    data: [],
    message: 'Invoice listing is unavailable: persistent database storage has been removed.'
  });
};

// @desc    Get single invoice by ID (Disabled: Database Removed)
// @route   GET /api/v1/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Invoice retrieval is unavailable: persistent database storage has been removed.'
  });
};

// @desc    Delete an invoice (Disabled: Database Removed)
// @route   DELETE /api/v1/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  return res.status(503).json({
    success: false,
    message: 'Invoice deletion is unavailable: persistent database storage has been removed.'
  });
};

module.exports = {
  scanInvoice,
  saveInvoice,
  updateInvoice,
  getInvoices,
  getInvoiceById,
  deleteInvoice
};
