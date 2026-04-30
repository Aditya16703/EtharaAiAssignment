import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { MemberService } from "./member.service";
import { AppError } from "../../middleware/errorHandler";
import { WorkspaceRole } from "@prisma/client";

const inviteSchema = z.object({
  email: z.string().email(),
});

const changeRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export class MemberController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await MemberService.list(req.workspace!.id);
      res.json({ data: members, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const data = inviteSchema.parse(req.body);
      const member = await MemberService.invite(req.workspace!.id, data.email);
      res.json({ data: member, error: null, message: "ok" });
    } catch (e) {
      if (e instanceof z.ZodError) return next(new AppError(400, (e as any).errors[0].message, "VALIDATION_ERROR"));
      next(e);
    }
  }

  static async changeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const data = changeRoleSchema.parse(req.body);
      const member = await MemberService.changeRole(req.workspace!.id, req.params.userId as string, data.role as WorkspaceRole);
      res.json({ data: member, error: null, message: "ok" });
    } catch (e) {
      if (e instanceof z.ZodError) return next(new AppError(400, (e as any).errors[0].message, "VALIDATION_ERROR"));
      next(e);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await MemberService.remove(req.workspace!.id, req.params.userId as string);
      res.json({ data: null, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }
}
