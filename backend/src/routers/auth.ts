import { randomBytes } from "crypto";
import express from "express";
import { Argon2id } from "oslo/password";
import { db, lucia } from "../lib/auth";
import { authMiddleware, currentUser } from "../middleware/auth";

const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("LOGIN", username, password);
    if (!username || !password) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const user = await getUser(username);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isValidPassword = await new Argon2id().verify(
      user.password!,
      password
    );
    if (isValidPassword) {
      const sessionId = randomBytes(12).toString("hex");
      const session = await lucia.createSession(user.id, {}, { sessionId });
      const sessionCookie = lucia.createSessionCookie(session.id);
      // res.cookie("hellooo", "hiiiiii");
      // res.setHeader("Set-Cookie", sessionCookie.serialize());
      res.appendHeader("Set-Cookie", sessionCookie.serialize());
      console.log(res.getHeaders());
      return res.status(201).json({ session: session.id, user: user.id });
    } else {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error: any) {
    console.log(error.message);
    return error(500, "Internal server error");
  }
});

authRouter.post("/signup", async (req, res) => {
  console.log("signup");
  try {
    const body = req.body;

    const { username, password } = body;
    console.log(username, password);
    if (!username || !password) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    if (await getUser(username)) {
      console.log("Username already exists");
      return res.status(400).json({ message: "Username already exists" });
    }
    const hashedPassword = await new Argon2id().hash(password);

    if (isEmail(username) && !isEmail(username, ["psnacet.edu.in"])) {
      return res.status(400).json({ message: "Invalid username" });
    }

    const user =
      (await getUser(username)) || isEmail(username)
        ? await db.user.create({
            data: {
              email: username,
              password: hashedPassword,
            },
          })
        : null;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log(user);
    const sessionId = randomBytes(12).toString("hex");
    const session = await lucia.createSession(
      user.id,
      {},
      {
        sessionId,
      }
    );
    console.log(session);
    // res.cookie.test.value = "testing";
    const sessionCookie = lucia.createSessionCookie(session.id);
    console.log(sessionCookie);
    // res.setHeader("set-cookie", sessionCookie.serialize());
    res.appendHeader("Set-Cookie", sessionCookie.serialize());
    res.status(200);
    console.log(res.getHeaders());
    return res.json({ session: session.id, user: user.id });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/logout", authMiddleware, async (req, res) => {
  console.log("logout");
  console.log(res.locals.session, res.locals.user);
  try {
    if (!res.locals.session) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    await lucia.invalidateSession(res.locals.session.id);
    res.appendHeader(
      "Set-Cookie",
      lucia.createBlankSessionCookie().serialize()
    );
    res.json({ message: "Logged out" });
  } catch (err: any) {
    console.log(err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.get("/profile", authMiddleware, async (req, res) => {
  console.log("profile");
  console.log(res.locals.user);
  try {
    if (!res.locals.user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    res.json({ user: res.locals.user });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.get("/currentUser", async (req, res) => {
  console.log("currentUser");
  try {
    return res.json({ user: await currentUser(req) });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default authRouter;

export async function getUser(username: string) {
  return (
    (await db.user.findUnique({
      where: {
        email: username,
      },
    })) ||
    (await db.user.findFirst({
      where: {
        student: {
          regNo: username,
        },
      },
    }))
  );
}

export function isEmail(username: string, domains?: string[]): boolean {
  // regex for email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (emailRegex.test(username)) {
    if (domains) {
      const domain = username.split("@")[1];
      return domains.includes(domain);
    }
    return true;
  }
  return false;
}
