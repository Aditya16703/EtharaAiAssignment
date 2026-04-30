import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";

export class WorkspaceService {
  static async list(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });
    return memberships.map((m) => m.workspace);
  }

  static async create(userId: string, data: any) {
    const existing = await prisma.workspace.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new AppError(409, "Workspace slug already taken", "CONFLICT");
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: data.name,
          slug: data.slug,
          logoUrl: data.logoUrl,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId,
          role: "ADMIN",
        },
      });

      return ws;
    });

    return workspace;
  }

  static async get(slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } } },
    });
    if (!workspace) throw new AppError(404, "Workspace not found", "NOT_FOUND");
    return workspace;
  }

  static async update(slug: string, data: any) {
    const workspace = await prisma.workspace.update({
      where: { slug },
      data,
    });
    return workspace;
  }

  static async delete(slug: string) {
    await prisma.workspace.delete({ where: { slug } });
  }
}
