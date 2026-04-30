import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { AppError } from "./errorHandler";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next(new AppError(401, "Missing or invalid token", "UNAUTHORIZED"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return next(new AppError(401, "User no longer exists", "UNAUTHORIZED"));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError(401, "Invalid or expired token", "UNAUTHORIZED"));
  }
};
