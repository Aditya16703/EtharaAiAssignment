import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

export class DashboardController {
  static async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const userWorkspaces = await prisma.workspaceMember.findMany({
        where: { userId: req.user!.id },
        select: { workspaceId: true },
      });
      const workspaceIds = userWorkspaces.map(m => m.workspaceId);

      const allIssues = await prisma.issue.findMany({
        where: { workspaceId: { in: workspaceIds } },
        select: { status: true, priority: true, dueDate: true },
      });

      const summary = {
        total: allIssues.length,
        byStatus: {
          TODO: 0, IN_PROGRESS: 0, DONE: 0, BACKLOG: 0, IN_REVIEW: 0, CANCELLED: 0
        },
        byPriority: {
          URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NO_PRIORITY: 0
        },
        overdueCount: 0,
      };

      const now = new Date();

      allIssues.forEach(issue => {
        summary.byStatus[issue.status]++;
        summary.byPriority[issue.priority]++;
        
        if (issue.dueDate && issue.dueDate < now && issue.status !== "DONE" && issue.status !== "CANCELLED") {
          summary.overdueCount++;
        }
      });

      res.json({ data: summary, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async myIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const issues = await prisma.issue.findMany({
        where: { assigneeId: req.user!.id, status: { not: "DONE" } },
        orderBy: { dueDate: "asc" },
        include: { workspace: { select: { slug: true, name: true } } },
      });
      res.json({ data: issues, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async overdue(req: Request, res: Response, next: NextFunction) {
    try {
      const userWorkspaces = await prisma.workspaceMember.findMany({
        where: { userId: req.user!.id },
        select: { workspaceId: true },
      });
      const workspaceIds = userWorkspaces.map(m => m.workspaceId);

      const issues = await prisma.issue.findMany({
        where: { 
          workspaceId: { in: workspaceIds },
          dueDate: { lt: new Date() },
          status: { notIn: ["DONE", "CANCELLED"] },
        },
        orderBy: { dueDate: "asc" },
        include: { 
          workspace: { select: { slug: true, name: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } }
        },
      });

      res.json({ data: issues, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }
}
