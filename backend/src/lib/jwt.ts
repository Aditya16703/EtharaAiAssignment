import jwt from "jsonwebtoken";
import { env } from "../config/env";

import crypto from "crypto";

export const signAccessToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] });
};

export const signRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { 
    expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    jwtid: crypto.randomUUID(),
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; exp?: number };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; exp?: number };
};
