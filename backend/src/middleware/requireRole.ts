import { Request, Response, NextFunction } from "express";
import { WorkspaceRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "./errorHandler";

export const requireRole = (minRole: WorkspaceRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug as string;
      if (!slug) return next(new AppError(400, "Workspace slug is required", "VALIDATION_ERROR"));

      const workspace = await prisma.workspace.findUnique({
        where: { slug },
      });

      if (!workspace) {
        return next(new AppError(404, "Workspace not found", "NOT_FOUND"));
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: req.user!.id,
          },
        },
      });

      if (!member) {
        return next(new AppError(403, "Not a member of this workspace", "FORBIDDEN"));
      }

      if (minRole === "ADMIN" && member.role !== "ADMIN") {
        return next(new AppError(403, "Admin access required", "FORBIDDEN"));
      }

      req.workspaceMember = member;
      req.workspace = workspace;
      next();
    } catch (error) {
      next(error);
    }
  };
};
