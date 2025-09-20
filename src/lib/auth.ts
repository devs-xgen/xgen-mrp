import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Portal to roles mapping
const PORTAL_ROLES = {
  ADMIN_PORTAL: ["ADMIN", "DEVELOPER", "SUPER_ADMIN"],
  WORKER_PORTAL: ["WORKER"],
  INSPECTOR_PORTAL: ["INSPECTOR"],
  DELIVERY_PORTAL: ["DELIVERY"],
  SUPERADMIN_PORTAL: ["SUPER_ADMIN"],
};

// Hardcoded developer credentials
const DEVELOPER_CREDENTIALS = {
  email: "dev@xgen-mrp.local",
  password: "dev123!@#",
  role: "DEVELOPER",
  name: "Developer Account",
};

// Login pages for different portals
const PORTAL_LOGIN_PAGES = {
  ADMIN_PORTAL: "/admin/login",
  WORKER_PORTAL: "/worker/login",
  INSPECTOR_PORTAL: "/inspector/login",
  DELIVERY_PORTAL: "/delivery/login",
  SUPERADMIN_PORTAL: "/superadmin/login",
};

// Simple in-memory store for login attempts (use Redis in production)
const loginAttempts = new Map<
  string,
  { count: number; lastAttempt: number; blockedUntil?: number }
>();

// Rate limiting configuration for login attempts
const LOGIN_RATE_LIMIT = {
  maxAttempts: 10, // allow more attempts before blocking
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 15 * 60 * 1000, // 15 minutes block (reduced from 30)
};

// Check if account is currently blocked (without incrementing)
function isLoginBlocked(email: string): {
  blocked: boolean;
  blockedUntil?: Date;
} {
  const now = Date.now();
  const attempts = loginAttempts.get(email);
  if (attempts?.blockedUntil && now < attempts.blockedUntil) {
    return { blocked: true, blockedUntil: new Date(attempts.blockedUntil) };
  }
  return { blocked: false };
}

// Record a failed login attempt and return limit status
function registerFailedLoginAttempt(email: string): {
  allowed: boolean;
  attemptsLeft?: number;
  blockedUntil?: Date;
} {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (!attempts) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return { allowed: true, attemptsLeft: LOGIN_RATE_LIMIT.maxAttempts - 1 };
  }

  // Reset window if expired
  if (now - attempts.lastAttempt > LOGIN_RATE_LIMIT.windowMs) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return { allowed: true, attemptsLeft: LOGIN_RATE_LIMIT.maxAttempts - 1 };
  }

  attempts.count++;
  attempts.lastAttempt = now;

  if (attempts.count >= LOGIN_RATE_LIMIT.maxAttempts) {
    attempts.blockedUntil = now + LOGIN_RATE_LIMIT.blockDurationMs;
    console.warn(
      `🚨 Account blocked due to excessive login attempts: ${email}`
    );
    return { allowed: false, blockedUntil: new Date(attempts.blockedUntil) };
  }

  return {
    allowed: true,
    attemptsLeft: LOGIN_RATE_LIMIT.maxAttempts - attempts.count,
  };
}

// Clear successful login attempts
function clearLoginAttempts(email: string) {
  loginAttempts.delete(email);
}

// Extend the User and Session types
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    portal: string;
    lastLoginAt?: Date;
    status?: string;
  }

  interface Session {
    user: {
      [x: string]: any;
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      portal: string;
      lastLoginAt?: Date;
      status?: string;
    };
    sessionId?: string;
    expires: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    portal: string;
    sessionId?: string;
    iat?: number;
    exp?: number;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { type: "text" },
        password: { type: "password" },
        portal: { type: "text" }, // The portal user is trying to access
      },
      async authorize(credentials) {
        try {
          if (
            !credentials?.email ||
            !credentials?.password ||
            !credentials?.portal
          ) {
            throw new Error("Please provide all required fields");
          }

          // Check for hardcoded developer credentials first
          if (credentials.email === DEVELOPER_CREDENTIALS.email) {
            if (credentials.password === DEVELOPER_CREDENTIALS.password) {
              // Check if developer role is allowed in the requested portal
              const requestedPortal =
                credentials.portal.toUpperCase() + "_PORTAL";
              const allowedRoles =
                PORTAL_ROLES[requestedPortal as keyof typeof PORTAL_ROLES] ||
                [];

              if (!allowedRoles.includes(DEVELOPER_CREDENTIALS.role)) {
                throw new Error(
                  "You don't have permission to access this portal"
                );
              }

              console.info(
                `✅ Developer login: ${DEVELOPER_CREDENTIALS.email} via ${requestedPortal}`
              );

              // Get developer user from database
              const devUser = await prisma.user.findUnique({
                where: { email: DEVELOPER_CREDENTIALS.email },
                include: { profile: true },
              });

              if (!devUser) {
                throw new Error(
                  "Developer user not found in database. Please run the developer seed script."
                );
              }

              // Update last login time
              await prisma.user.update({
                where: { id: devUser.id },
                data: { lastLoginAt: new Date() },
              });

              return {
                id: devUser.id,
                email: DEVELOPER_CREDENTIALS.email,
                role: DEVELOPER_CREDENTIALS.role,
                name: DEVELOPER_CREDENTIALS.name,
                portal: requestedPortal,
                lastLoginAt: new Date(),
                status: "ACTIVE",
              };
            } else {
              throw new Error("Invalid email or password");
            }
          }

          // Early block check (do not increment attempts here)
          const blockCheck = isLoginBlocked(credentials.email);
          if (blockCheck.blocked) {
            const blockedUntil = blockCheck.blockedUntil;
            const blockedMessage = blockedUntil
              ? `Account temporarily blocked until ${blockedUntil.toLocaleTimeString()}`
              : "Too many login attempts. Please try again later.";
            throw new Error(blockedMessage);
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              profile: true,
            },
          });

          if (!user) {
            const rl = registerFailedLoginAttempt(credentials.email);
            if (!rl.allowed) {
              const blockedMessage = rl.blockedUntil
                ? `Account temporarily blocked until ${rl.blockedUntil.toLocaleTimeString()}`
                : "Too many login attempts. Please try again later.";
              throw new Error(blockedMessage);
            }
            throw new Error("Invalid email or password");
          }

          // Check user status
          if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
            throw new Error(
              `Account is ${user.status.toLowerCase()}. Please contact administrator.`
            );
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            const rl = registerFailedLoginAttempt(credentials.email);
            if (!rl.allowed) {
              const blockedMessage = rl.blockedUntil
                ? `Account temporarily blocked until ${rl.blockedUntil.toLocaleTimeString()}`
                : "Too many login attempts. Please try again later.";
              throw new Error(blockedMessage);
            }
            throw new Error("Invalid email or password");
          }

          // Check if user role is allowed in the requested portal
          // Convert portal to match the format in PORTAL_ROLES
          const requestedPortal = credentials.portal.toUpperCase() + "_PORTAL";
          const allowedRoles =
            PORTAL_ROLES[requestedPortal as keyof typeof PORTAL_ROLES] || [];

          if (!allowedRoles.includes(user.role)) {
            throw new Error("You don't have permission to access this portal");
          }

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Clear login attempts on successful login
          clearLoginAttempts(credentials.email);

          // Log successful login
          console.info(
            `✅ Successful login: ${user.email} (${user.role}) via ${requestedPortal}`
          );

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.profile?.firstName
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : user.email.split("@")[0],
            portal: requestedPortal,
            lastLoginAt: user.lastLoginAt,
            status: user.status,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("An error occurred during login");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.portal = user.portal;
        token.sessionId = `${user.id}_${Date.now()}`;
      }

      // Token validation
      if (token.exp && Date.now() / 1000 > token.exp) {
        console.warn("JWT token expired");
        // Return minimal token to force re-authentication
        return { id: "", role: "", portal: "" };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.portal = token.portal as string;
        session.sessionId = token.sessionId as string;

        // Add session metadata for security
        if (process.env.NODE_ENV === "development") {
          session.user.sessionInfo = {
            iat: token.iat,
            exp: token.exp,
            sessionId: token.sessionId,
          };
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Ensure redirects stay within the application
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (reduced from 30 days for better security)
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    error: "/admin/login",
    signIn: "/admin/login",
  },
  events: {
    async signIn(message) {
      console.info("🔐 Sign in event:", {
        user: message.user.email,
        account: message.account?.provider,
        isNewUser: message.isNewUser,
      });
    },
    async signOut(message) {
      console.info("🚪 Sign out event:", {
        session: message.session?.user?.email,
        token: message.token?.email,
      });
    },
    async session(message) {
      // Log session access in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.debug("📱 Session accessed:", {
          user: message.session.user?.email,
          sessionId: message.session.sessionId,
        });
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
