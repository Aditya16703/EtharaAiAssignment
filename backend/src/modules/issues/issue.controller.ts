import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { IssueService } from "./issue.service";
import { AppError } from "../../middleware/errorHandler";
import { IssueStatus, Priority } from "@prisma/client";

const createIssueSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"]).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"]).optional(),
  dueDate: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]),
});

const updateAssigneeSchema = z.object({
  assigneeId: z.string().nullable(),
});

export class IssueController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const issues = await IssueService.list(req.workspace!.id, req.query);
      res.json({ data: issues, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createIssueSchema.parse(req.body);
      const issue = await IssueService.create(req.workspace!.id, req.user!.id, data);
      res.json({ data: issue, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const issue = await IssueService.get(req.workspace!.id, req.params.id as string);
      res.json({ data: issue, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateIssueSchema.parse(req.body);
      const issue = await IssueService.update(req.workspace!.id, req.params.id as string, data);
      res.json({ data: issue, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateStatusSchema.parse(req.body);
      
      // Authorization logic for status change
      if (req.workspaceMember!.role !== "ADMIN") {
        const issue = await IssueService.get(req.workspace!.id, req.params.id as string);
        if (issue.assigneeId !== req.user!.id) {
          throw new AppError(403, "Only the assignee or ADMIN can change status", "FORBIDDEN");
        }
      }

      const issue = await IssueService.updateStatus(req.workspace!.id, req.params.id as string, data.status as IssueStatus);
      res.json({ data: issue, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async updateAssignee(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateAssigneeSchema.parse(req.body);
      const issue = await IssueService.updateAssignee(req.workspace!.id, req.params.id as string, data.assigneeId);
      res.json({ data: issue, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await IssueService.delete(req.workspace!.id, req.params.id as string);
      res.json({ data: null, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }
}
