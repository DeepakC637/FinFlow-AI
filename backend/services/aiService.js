const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b";
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS) || 30000; // Configurable bounded timeout (default: 30s)

// Helper to redact API keys and sensitive tokens from log messages
const redactSensitive = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/gsk_[a-zA-Z0-9_-]+/g, "[REDACTED_API_KEY]")
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED_TOKEN]");
};

const PROMPT = `You are an expert financial invoice and receipt parsing system.
Analyze this receipt or bill image and extract the metadata into a valid JSON object.

Required JSON Structure:
{
  "vendorName": "Store or merchant name",
  "date": "YYYY-MM-DD",
  "category": "Office Supplies | Software & SaaS | Infrastructure | Travel & Transit | Utilities & Bills | Food & Meals | Hardware | Other",
  "items": [
    { "description": "item description", "quantity": 1, "price": 0.00, "total": 0.00 }
  ],
  "taxAmount": 0.00,
  "totalAmount": 0.00
}

Strict Rules:
- Return ONLY the raw JSON object. No explanation, no Markdown backticks, no extra text.
- date must be strictly in YYYY-MM-DD format (use null if not present).
- quantity must be an integer or float (default to 1 if not shown).
- price must be the float unit price.
- total must be the line item total float (quantity * price).
- taxAmount and totalAmount must be numeric floats. If missing, use 0.
- Standardize vendor names (e.g. "Blue Bottle Coffee", not "STORE 402 BLUE BOTTLE").
- Infer the most accurate category from the merchant type and line items.`;

/**
 * Extracts structured invoice data from an image/PDF file using Groq Vision.
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<object>} - Structured invoice JSON
 */
const extractInvoiceData = async (filePath, mimeType) => {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error("AI extraction is unconfigured: GROQ_API_KEY is missing from environment.");
    err.statusCode = 503;
    throw err;
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    timeout: GROQ_TIMEOUT_MS,
  });

  try {
    console.log(`[Groq OCR] Processing file: ${path.basename(filePath)} with model: ${GROQ_VISION_MODEL} (timeout: ${GROQ_TIMEOUT_MS}ms)`);

    let imageBase64;
    let imageMime;

    // Handle PDF documents
    if (mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf")) {
      try {
        const { fromPath } = require("pdf2pic");
        const convert = fromPath(filePath, {
          density: 200,
          saveFilename: "temp_invoice",
          savePath: path.dirname(filePath),
          format: "jpg",
          width: 1800,
          height: 2400,
        });
        const result = await convert(1);
        const jpgPath = result.path;
        imageBase64 = fs.readFileSync(jpgPath).toString("base64");
        imageMime = "image/jpeg";
        fs.unlink(jpgPath, () => {});
      } catch (pdfErr) {
        console.warn(`[Groq OCR] PDF conversion unavailable: ${pdfErr.message}`);
        const err = new Error("Direct PDF rasterization is not configured on this host. Please upload a high-resolution PNG, JPG, or WebP image.");
        err.statusCode = 400;
        throw err;
      }
    } else {
      // Read image file directly
      const fileBuffer = fs.readFileSync(filePath);
      if (fileBuffer.length < 100) {
        const err = new Error("Uploaded file is too small or corrupt to be a valid receipt image.");
        err.statusCode = 400;
        throw err;
      }
      imageBase64 = fileBuffer.toString("base64");
      imageMime = mimeType || "image/jpeg";
    }

    const response = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${imageMime};base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: PROMPT,
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0,
    });

    let raw = response.choices[0]?.message?.content?.trim() || "";

    // Strip markdown code fences if model enclosed JSON
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Extract JSON object
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Groq OCR] Non-JSON output received:", raw);
      const err = new Error("Could not extract structured financial information from this image. Please ensure the document is clear and readable.");
      err.statusCode = 422;
      throw err;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Sanitize and normalize fields to ensure compatibility with confirmation contract
    const sanitizedData = {
      vendorName: parsed.vendorName || "Unknown Vendor",
      date: parsed.date || new Date().toISOString().slice(0, 10),
      category: parsed.category || "Other",
      totalAmount: Number(parsed.totalAmount) || 0,
      taxAmount: Number(parsed.taxAmount) || 0,
      items: Array.isArray(parsed.items)
        ? parsed.items.map(item => ({
            description: item.description || "Line Item",
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            total: Number(item.total) || ((Number(item.quantity) || 1) * (Number(item.price) || 0)),
          }))
        : [],
    };

    console.log(`[Groq OCR] Extracted successfully: Vendor="${sanitizedData.vendorName}", Total=₹${sanitizedData.totalAmount}, Items=${sanitizedData.items.length}`);
    return sanitizedData;

  } catch (err) {
    // Structured error handling without leaking tokens, keys, or internal stack traces
    console.error(`[Groq OCR] Error: ${redactSensitive(err.message)}`);

    if (err.statusCode) {
      throw err;
    }

    const isTimeout =
      err.name === "APIConnectionTimeoutError" ||
      err.code === "ETIMEDOUT" ||
      err.name === "AbortError" ||
      (err.message && err.message.toLowerCase().includes("timeout"));

    const status = err.status || err.response?.status;
    let customError;

    if (isTimeout) {
      customError = new Error(
        "AI extraction timed out. The upstream OCR vision service took too long to respond. Please try again."
      );
      customError.statusCode = 504; // Gateway Timeout
    } else if (status === 401) {
      customError = new Error("AI provider authentication failed. Please check the Groq API key configuration.");
      customError.statusCode = 401;
    } else if (status === 429 || err.message?.includes("429") || err.message?.toLowerCase().includes("rate limit")) {
      customError = new Error("AI vision service rate limit reached. Please wait 30 seconds before retrying.");
      customError.statusCode = 429;
    } else if (status === 404 || err.message?.toLowerCase().includes("model_not_found")) {
      customError = new Error(`The configured AI vision model (${GROQ_VISION_MODEL}) is temporarily unavailable. Please try again.`);
      customError.statusCode = 503;
    } else if (status === 413) {
      customError = new Error("Document image exceeds the allowable size for the AI service. Please upload a smaller file.");
      customError.statusCode = 413;
    } else if (err.name === "SyntaxError") {
      customError = new Error("AI response could not be parsed as valid financial data. Please re-scan with a clearer image.");
      customError.statusCode = 422;
    } else {
      customError = new Error(redactSensitive(err.message) || "Failed to extract invoice data. Please try again.");
      customError.statusCode = status || 500;
    }

    throw customError;
  }
};

module.exports = { extractInvoiceData, GROQ_VISION_MODEL };
