import express from "express";
import { lucia } from "../lib/auth";
import { User } from "lucia";

// export const authMiddleware = async (
//   req: express.Request,
//   res: express.Response,
//   next: express.NextFunction,
// ) => {
//   const auth = req.headers["authorization"];
//   console.log(req.url,"authCookie");
//   const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
//   console.log(sessionId);
//   if (!sessionId) {
//     console.log("no session id");
//     res.locals.session = null;
//     res.locals.user = null;
//     res.locals.bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
//     next();
//     return;
//   }

//   const { session, user } = await lucia.validateSession(sessionId);
//   console.log(session);
//   console.log(user);
//   if (session && session.fresh) {
//     console.log("fresh session");
//     res.setHeader(
//       "set-cookie",
//       lucia.createSessionCookie(session.id).serialize(),
//     );
//   }

//   if (!session) {
//     res.setHeader("set-cookie", lucia.createBlankSessionCookie().serialize());
//   }

//   res.locals.session = session;
//   res.locals.user = user;
//   res.locals.bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
//   next();
// };

export const authMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log(req.url, "authCookie", req.headers.cookie);
  const auth = req.headers.authorization;
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? auth ?? "");
  // If the session ID is not present, the user is not logged in.
  if (!sessionId) {
    res.locals.user = null;
    res.locals.session = null;
    res.locals.bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    return res.status(401).json({ message: "Unauthenticated" });
  }
  // If the session ID is present, the user is logged in.
  const { session, user } = await lucia.validateSession(sessionId);
  // If the session is fresh, a new session cookie is created and sent to the client.
  if (session && session.fresh) {
    res.appendHeader(
      "Set-Cookie",
      lucia.createSessionCookie(session.id).serialize()
    );
  }
  // If the session is not fresh, the session cookie is updated with the new expiry time.
  if (!session) {
    res.appendHeader(
      "Set-Cookie",
      lucia.createBlankSessionCookie().serialize()
    );
  }

  res.locals.session = session;
  res.locals.user = user;
  res.locals.bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  return next();
};

// utility functions
export const currentUser = async (
  req: express.Request
): Promise<User | null> => {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
  if (!sessionId) {
    console.log("Session not found");
    return null;
  }
  const { user } = await lucia.validateSession(sessionId);
  return user;
};
