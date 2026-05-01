import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";

export class AuthService {
  static async register(data: any) {
    const email = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "Email already in use", "CONFLICT");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: data.name.trim(),
        passwordHash,
      },
    });

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    const decodedRefresh = verifyRefreshToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(decodedRefresh.exp! * 1000),
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  static async login(data: any) {
    const email = data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, "Invalid email or password", "UNAUTHORIZED");
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, "Invalid email or password", "UNAUTHORIZED");
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    const decodedRefresh = verifyRefreshToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(decodedRefresh.exp! * 1000),
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  static async refresh(oldRefreshToken: string) {
    let decoded;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch (e) {
      throw new AppError(401, "Invalid refresh token", "UNAUTHORIZED");
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });

    if (!tokenRecord) {
      throw new AppError(401, "Refresh token revoked", "UNAUTHORIZED");
    }

    // Token rotation: delete old, create new
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new AppError(401, "User no longer exists", "UNAUTHORIZED");
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    const newDecoded = verifyRefreshToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(newDecoded.exp! * 1000),
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  static async logout(oldRefreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: oldRefreshToken },
    });
  }
}
