import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.CORS_ORIGIN : "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

import { authRoutes } from "./modules/auth/auth.routes";
import { workspaceRoutes } from "./modules/workspaces/workspace.routes";
import { memberRoutes } from "./modules/members/member.routes";
import { issueRoutes } from "./modules/issues/issue.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:slug/members", memberRoutes);
app.use("/api/workspaces/:slug/issues", issueRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);
