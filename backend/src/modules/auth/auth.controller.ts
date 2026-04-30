import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { AppError } from "../../middleware/errorHandler";
import { env } from "../../config/env";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await AuthService.register(data);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: env.COOKIE_DOMAIN,
      });

      res.json({ data: { user, accessToken }, error: null, message: "ok" });
    } catch (e) {
      if (e instanceof z.ZodError) return next(new AppError(400, (e as any).errors[0].message, "VALIDATION_ERROR"));
      next(e);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await AuthService.login(data);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: env.COOKIE_DOMAIN,
      });

      res.json({ data: { user, accessToken }, error: null, message: "ok" });
    } catch (e) {
      if (e instanceof z.ZodError) return next(new AppError(400, (e as any).errors[0].message, "VALIDATION_ERROR"));
      next(e);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const oldRefreshToken = req.cookies.refreshToken;
      if (!oldRefreshToken) {
        throw new AppError(401, "No refresh token provided", "UNAUTHORIZED");
      }

      const { user, accessToken, refreshToken } = await AuthService.refresh(oldRefreshToken);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: env.COOKIE_DOMAIN,
      });

      res.json({ data: { user, accessToken }, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const oldRefreshToken = req.cookies.refreshToken;
      if (oldRefreshToken) {
        await AuthService.logout(oldRefreshToken);
      }

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        domain: env.COOKIE_DOMAIN,
      });

      res.json({ data: null, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const { passwordHash: _, ...userWithoutPassword } = req.user!;
      res.json({ data: { user: userWithoutPassword }, error: null, message: "ok" });
    } catch (e) {
      next(e);
    }
  }
}
