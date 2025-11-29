// server.js
import express from "express";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import cors from "cors";
dotenv.config();

const app = express();
app.use(express.json());


const allowedOrigins = [
  "http://localhost:8000",
];

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl, Postman, etc.
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true; // accepte toutes tes préviews Vercel
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      console.log("CORS Origin reçu:", origin);
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.log("Origin NON autorisée:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// Neon connection
if (!process.env.NEON_DATABASE_URL) {
  console.error("Missing NEON_DATABASE_URL in .env");
  process.exit(1);
}
const sql = neon(process.env.NEON_DATABASE_URL);

// Test route (no DB)
app.get("/api/ping", (req, res) => {
  console.log("Ping route set up");

  res.json({ ok: true, message: "OK" });
});

// Route querying your Neon table
app.get("/api/survey-results", async (req, res) => {
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
