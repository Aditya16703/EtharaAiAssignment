import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./modules/auth/auth.routes";
import { workspaceRoutes } from "./modules/workspaces/workspace.routes";
import { memberRoutes } from "./modules/members/member.routes";
import { issueRoutes } from "./modules/issues/issue.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { env } from "./config/env";

export const app = express();

app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: env.NODE_ENV === "production"
    ? (env.CORS_ORIGIN ?? "").split(",").map(s => s.trim())
    : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
  credentials: true,
}));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "production" ? 300 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later.", code: "RATE_LIMITED" },
});
app.use("/api", globalLimiter);

// ── Auth rate limiter (stricter) ──────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later.", code: "AUTH_RATE_LIMITED" },
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:slug/members", memberRoutes);
app.use("/api/workspaces/:slug/issues", issueRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── 404 & SPA Routing ───────────────────────────────────────────────────────────
import path from "path";

if (env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "public")));
  app.get("/:path*", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found", code: "NOT_FOUND" });
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);
