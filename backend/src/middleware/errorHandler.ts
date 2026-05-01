import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      data: null,
      error: err.code || "ERROR",
      message: err.message,
    });
  }

  if (err.name === "ZodError" || err.constructor?.name === "ZodError") {
    return res.status(400).json({
      data: null,
      error: "VALIDATION_ERROR",
      message: err.errors?.[0]?.message || "Validation failed",
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    data: null,
    error: "INTERNAL_ERROR",
    message: "Something went wrong",
  });
};
