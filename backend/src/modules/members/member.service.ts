import { WorkspaceRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";

export class MemberService {
  static async list(workspaceId: string) {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });
    return members;
  }

  static async invite(workspaceId: string, email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(404, "User not found with this email", "NOT_FOUND");

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (existing) throw new AppError(409, "User is already a member", "CONFLICT");

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: "MEMBER",
      },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    return member;
  }

  static async changeRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    const member = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
    return member;
  }

  static async remove(workspaceId: string, userId: string) {
    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }
}
