const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();

// Trust reverse proxy (e.g. Nginx, Cloudflare, Vite proxy) for accurate IP rate limiting
app.set("trust proxy", 1);

// ==============================
// SECURITY HEADERS (Helmet & CSP)
// ==============================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          process.env.CLIENT_URL || "http://localhost:5173",
        ],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// ==============================
// MIDDLEWARE
// ==============================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

//  ROUTES
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/invoices", invoiceRoutes);

// ROOT ROUTE
app.get("/", (req, res) => {
  res.send("AI Invoice Extraction API is running...");
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File too large. Maximum size allowed is 10MB.",
    });
  }
  if (err.message && err.message.includes("Images and PDFs only")) {
    return res.status(400).json({
      success: false,
      message: "Invalid file format. Only JPEG, PNG, WEBP, and PDF files are allowed.",
    });
  }
  console.error("Unhandled error:", err.message);
  res.status(err.statusCode || err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// SERVER START
const PORT = process.env.PORT || 5000;

const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running in standalone mode (no database) on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();