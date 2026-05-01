import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { WorkspaceService } from "./workspace.service";
import { AppError } from "../../middleware/errorHandler";

const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  logoUrl: z.string().url().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().url().optional(),
});

export class WorkspaceController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaces = await WorkspaceService.list(req.user!.id);
      res.json({ data: workspaces, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createWorkspaceSchema.parse(req.body);
      const workspace = await WorkspaceService.create(req.user!.id, data);
      res.json({ data: workspace, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const workspace = await WorkspaceService.get(req.params.slug as string);
      res.json({ data: workspace, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateWorkspaceSchema.parse(req.body);
      const workspace = await WorkspaceService.update(req.params.slug as string, data);
      res.json({ data: workspace, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await WorkspaceService.delete(req.params.slug as string);
      res.json({ data: null, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }
}
