// src/server/trpc/index.ts
import { initTRPC, TRPCError, inferAsyncReturnType } from "@trpc/server";
import { Request, Response } from "express";

import { z } from "zod";
import { db, lucia } from "../lib/auth";
import { Prisma } from "@prisma/client";

// Create context for tRPC
export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}) {
  console.log(req.url, "authCookie", req.headers.cookie);

  const auth = req.headers.authorization;
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? auth ?? "");

  let session = null;
  let user = null;

  if (sessionId) {
    try {
      const validated = await lucia.validateSession(sessionId);
      session = validated.session;
      user = validated.user;

      // If session is fresh, refresh the session cookie
      if (session && session.fresh) {
        res.setHeader(
          "Set-Cookie",
          lucia.createSessionCookie(session.id).serialize()
        );
      }
    } catch (error) {
      console.error("Session validation failed:", error);
    }
  }

  // If no session, clear the session cookie
  if (!session) {
    res.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
  }

  return {
    req,
    res,
    session,
    user,
    bearer: auth?.startsWith("Bearer ") ? auth.slice(7) : null,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Middleware for authentication
export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not authenticated",
    });
  }
  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
    },
  });
});

// Middleware for admin authorization
export const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user?.id) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User not authenticated",
    });
  }

  // Fetch user role from the database
  const user = await db.user.findUnique({
    where: { id: ctx.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access only" });
  }
  return next();
});
// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
export const adminProcedure = t.procedure
  .use(authMiddleware)
  .use(adminMiddleware);
