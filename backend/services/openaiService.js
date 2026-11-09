const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const PROMPT = `You are an expert invoice parsing system.
Look at this bill/receipt image and extract the data into a valid JSON object.

Required JSON Format:
{
  "vendorName": "Company or store name",
  "date": "YYYY-MM-DD",
  "items": [
    { "description": "item name", "quantity": 1, "price": 0.00 }
  ],
  "taxAmount": 0.00,
  "totalAmount": 0.00
}

Rules:
- Return ONLY valid JSON, no markdown, no explanation.
- date must be YYYY-MM-DD format, use null if not found.
- quantity must be a number (default 1 if not shown).
- price is the unit price as a float.
- taxAmount and totalAmount must be floats, use 0 if not found.
- Clean up vendor names (e.g., "McDonald's" not "MCDONALDS STORE #123").
- If a value is missing, use null.`;

/**
 * Extracts structured invoice data from an image/PDF file using Groq Vision.
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<object>} - Structured invoice JSON
 */
const extractInvoiceData = async (filePath, mimeType) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY missing in .env file. Get a free key at https://console.groq.com");
  }

  try {
    console.log(`[Groq] Processing file: ${path.basename(filePath)}`);

    let imageBase64;
    let imageMime;

    // Handle PDF — convert first page to JPEG using sharp or jimp
    if (mimeType === "application/pdf" || filePath.endsWith(".pdf")) {
      const { fromPath } = require("pdf2pic");
      const convert = fromPath(filePath, {
        density: 200,
        saveFilename: "temp_invoice",
        savePath: path.dirname(filePath),
        format: "jpg",
        width: 1800,
        height: 2400,
      });
      const result = await convert(1); // Convert page 1
      const jpgPath = result.path;
      imageBase64 = fs.readFileSync(jpgPath).toString("base64");
      imageMime = "image/jpeg";
      // Clean up temp jpg
      fs.unlink(jpgPath, () => {});
    } else {
      // Read image directly
      imageBase64 = fs.readFileSync(filePath).toString("base64");
      imageMime = mimeType || "image/jpeg";
    }

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
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

    let raw = response.choices[0].message.content.trim();

    // Strip markdown fences if present
    raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    // Extract JSON object in case there's surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON in Groq response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`[Groq] Extraction successful. Vendor: ${parsed.vendorName}`);
    return parsed;

  } catch (err) {
    console.error(`[Groq] Error:`, err.message);
    throw err;
  }
};

module.exports = { extractInvoiceData };