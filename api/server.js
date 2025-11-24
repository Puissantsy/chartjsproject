// server.js
import express from "express";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config();

const app = express();
app.use(express.json());

// Neon connection
if (!process.env.NEON_DATABASE_URL) {
  console.error("Missing NEON_DATABASE_URL in .env");
  process.exit(1);
}
const sql = neon(process.env.NEON_DATABASE_URL);

// Simple auth middleware (Bearer token)
const requireAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (token !== process.env.API_TOKEN) {
    return res.status(403).json({ error: "Invalid API token" });
  }

  next();
};

// Test route (no DB) just to check auth works
app.get("/api/ping", requireAuth, (req, res) => {
  res.json({ ok: true, message: "Auth works 🎉" });
});

// Protected route querying your Neon table
app.get("/api/survey-results", requireAuth, async (req, res) => {
  try {
    // optional ?limit=50
    const limit = Number(req.query.limit) || 10;

    const rows = await sql`
      SELECT
        *
      FROM public.survey_results
      LIMIT ${limit};
    `;

    res.json({ count: rows.length, data: rows });
  } catch (err) {
    console.error("Error querying survey_results:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
