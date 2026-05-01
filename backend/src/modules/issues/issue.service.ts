import { IssueStatus, Priority } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";

export class IssueService {
  static async list(workspaceId: string, query: any) {
    const where: any = { workspaceId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.overdue === "true") {
      where.dueDate = { lt: new Date() };
      where.status = { not: "DONE" };
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return issues;
  }

  static async create(workspaceId: string, reporterId: string, data: any) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new AppError(404, "Workspace not found", "NOT_FOUND");

    const issue = await prisma.$transaction(async (tx) => {
      const count = await tx.issue.count({ where: { workspaceId } });
      const prefix = workspace.slug.toUpperCase().slice(0, 3);
      const identifier = `${prefix}-${count + 1}`;

      if (data.assigneeId) {
        const isMember = await tx.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId, userId: data.assigneeId } }
        });
        if (!isMember) throw new AppError(400, "Assignee must be a member of the workspace", "VALIDATION_ERROR");
      }

      return await tx.issue.create({
        data: {
          identifier,
          workspaceId,
          reporterId,
          title: data.title,
          description: data.description,
          priority: data.priority || "MEDIUM",
          assigneeId: data.assigneeId,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
      });
    });

    return issue;
  }

  static async get(workspaceId: string, id: string) {
    const issue = await prisma.issue.findFirst({
      where: { id, workspaceId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    if (!issue) throw new AppError(404, "Issue not found", "NOT_FOUND");
    return issue;
  }

  static async update(workspaceId: string, id: string, data: any) {
    const issue = await prisma.issue.update({
      where: { id, workspaceId },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
    return issue;
  }

  static async updateStatus(workspaceId: string, id: string, status: IssueStatus) {
    const issue = await prisma.issue.update({
      where: { id, workspaceId },
      data: { status },
    });
    return issue;
  }

  static async updateAssignee(workspaceId: string, id: string, assigneeId: string | null) {
    if (assigneeId) {
      const isMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: assigneeId } }
      });
      if (!isMember) throw new AppError(400, "Assignee must be a member of the workspace", "VALIDATION_ERROR");
    }

    const issue = await prisma.issue.update({
      where: { id, workspaceId },
      data: { assigneeId },
    });
    return issue;
  }

  static async delete(workspaceId: string, id: string) {
    await prisma.issue.delete({
      where: { id, workspaceId },
    });
  }
}
