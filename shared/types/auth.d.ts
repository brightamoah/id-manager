import type { User as DbUser } from "~~/shared/types";

declare module "#auth-utils" {
  interface User extends Omit<DbUser, "createdAt" | "updatedAt"> {}

  interface SecureSessionData {
    accessToken?: string;
    refreshToken?: string;
    twoFactorVerified?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }

  interface UserSession {
    user: User;
    secure?: SecureSessionData;
    expiresAt: Date;
    loggedInAt: Date;

  }
}

export { };
