import { randomBytes } from "crypto";
import express from "express";
import { Argon2id } from "oslo/password";
import { db, lucia } from "../lib/auth";
import { authMiddleware, currentUser } from "../middleware/auth";
import { createUser, getUser } from "../actions/user";
import randomstring from "randomstring";
import { sendEmail, sendVerificationEmail } from "../lib/email-service";

// Generate OTP
function generateOTP() {
  return randomstring.generate({
    length: 6,
    charset: "numeric",
  });
}

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
    console.log("isValidPassword", isValidPassword,user,user.emailVerified);
    if (isValidPassword) {
      console.log(user);
      if (!user.emailVerified) {
        // send email verification mail
        let optVerification = await db.otp.findFirst({
          where: {
            email: user.username || user.email!,
          },
        });

        const otp = generateOTP();
        if (optVerification) {
          optVerification = await db.otp.upsert({
            where: { id: optVerification.id },
            update: {
              expires: new Date(Date.now() + 1000 * 60 * 5),
              otp,
            },
            create: {
              expires: new Date(Date.now() + 1000 * 60 * 5),
              otp,
              email: user.username || user.email!,
            },
          });
        }
        // send email
        sendEmail({
          to: user.username || user.email!,
          subject: "Email Verification",
          message: `Your OTP is ${otp} to verify your email. will expire 5 mins`,
        });
        return res
          .status(403)
          .json({ message: "Email not verified, mail has been sent" });
      }
      const sessionId = randomBytes(12).toString("hex");
      const session = await lucia.createSession(user.id, {}, { sessionId });
      const sessionCookie = lucia.createSessionCookie(session.id);
      // res.cookie("hellooo", "hiiiiii");
      // res.setHeader("Set-Cookie", sessionCookie.serialize());
      res.appendHeader("Set-Cookie", sessionCookie.serialize());
      console.log(res.getHeaders());
      return res.status(201).json({ session: session, user: user });
    } else {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error: any) {
    console.log(error.message);
    return error(500, "Internal server error");
  }
});

authRouter.post("/verifyEmail", async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("VERIFY EMAIL", email, otp);
    if (!email || !otp) {
      return res.status(400).json({ message: "Invalid email or otp" });
    }
    const optVerification = await db.otp.findUnique({
      where: {
        email,
        otp,
      },
    });
    if (!optVerification) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    db.otp.delete({
      where: {
        email,
        otp,
      },
    });
    if (optVerification.expires < new Date()) {
      return res.status(401).json({ message: "OTP expired" });
    }
    const user = await db.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });
    const sessionId = randomBytes(12).toString("hex");
    const session = await lucia.createSession(user.id, {}, { sessionId });
    const sessionCookie = lucia.createSessionCookie(session.id);
    // res.cookie("hellooo", "hiiiiii");
    // res.setHeader("Set-Cookie", sessionCookie.serialize());
    res.appendHeader("Set-Cookie", sessionCookie.serialize());
    console.log(res.getHeaders());
    return res
      .status(201)
      .json({ session: session, user: user, message: "Email verified" });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/forgotPassword", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("FORGOT PASSWORD", email);
    if (!email) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const user = await db.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // let optVerification = await db.otp.findFirst({
    //   where: {
    //     email,
    //   },
    // });
    const otp = generateOTP();
    const expires = new Date(Date.now() + 1000 * 60 * 5);

    const optVerification = await db.otp.upsert({
      where: { email }, // Use email as a unique identifier for simplicity
      update: {
        otp,
        expires,
        verifiedAt: null,
      },
      create: {
        email,
        otp,
        expires,
      },
    });

    // send email
    sendEmail({
      to: email,
      subject: "Reset Password",
      message: `Your OTP is ${otp} to reset your password. will expire 5 mins`,
    });
    return res.status(200).json({ message: "Mail has been sent" });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/verifyForgotPassword", async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("VERIFY FORGOT PASSWORD", email, otp);
    if (!email || !otp) {
      return res.status(400).json({ message: "Invalid email or otp" });
    }
    let optVerification = await db.otp.findUnique({
      where: {
        email,
        otp,
      },
    });
    if (!optVerification) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    optVerification = await db.otp.update({
      where: {
        email,
        otp,
      },
      data: {
        verifiedAt: new Date(),
      },
    });
    if (optVerification.expires < new Date()) {
      return res.status(401).json({ message: "OTP expired" });
    }
    return res.status(200).json({ message: "OTP verified" });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/resetPassword", async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    console.log("RESET PASSWORD", email, otp, password);
    if (!email || !otp || !password) {
      return res
        .status(400)
        .json({ message: "Invalid email, otp or password" });
    }
    const optVerification = await db.otp.findUnique({
      where: {
        email,
        otp,
      },
    });
    if (!optVerification) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    db.otp.delete({
      where: {
        email,
        otp,
      },
    });
    if (!optVerification.verifiedAt) {
      return res.status(401).json({ message: "OTP not verified" });
    }
    const hashedPassword = await new Argon2id().hash(password);
    const user = await db.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });
    return res
      .status(201)
      .json({ user, message: "Password reset successfully" });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/changePassword", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    console.log("CHANGE PASSWORD", oldPassword, newPassword);
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Invalid old password or new password" });
    }
    const user = await db.user.findUnique({
      where: { id: res.locals.user.id },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isValidPassword = await new Argon2id().verify(
      user.password!,
      oldPassword
    );
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid old password" });
    }
    const hashedPassword = await new Argon2id().hash(newPassword);
    await db.user.update({
      where: { id: res.locals.user.id },
      data: {
        password: hashedPassword,
      },
    });
    return res.status(201).json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/signup", async (req, res) => {
  // console.log("signup");
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

    // if (isEmail(username) && !isEmail(username, ["psnacet.edu.in"])) {
    //   return res.status(400).json({ message: "Invalid username" });
    // }

    const user =
      (await getUser(username)) ||
      (await createUser(username, hashedPassword, "STUDENT"));

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
    res.status(200).json({ message: "Logged out" });
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
  console.log("currentUser", req.headers);

  try {
    return res.json({ user: await currentUser(req) });
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default authRouter;
