import express from "express";

import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import { Server } from "http";
import { appRouter } from "./trpc/router";
import authRouter from "./routers/auth";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middleware/auth";
import { User, verifyRequestOrigin } from "lucia";
import { lookup } from "dns";
import { hostname } from "os";
import { promisify } from "util";
// import bodyParser from "body-parser";

const lookupAsync = promisify(lookup);

const getIp = async () => {
  try {
    const { address } = await lookupAsync(hostname());
    console.log("addr: " + address);
    return address;
  } catch (err) {
    console.error(err);
    return "";
  }
};
const ip = await getIp();

const app = express();
app.use(cookieParser());
app.use(express.json());

const origin = [
  // USEFUL to add production origins here
  "exp://localhost:8081",
  "http://localhost:5173",
  "http://localhost:3001",
  "http://localhost:8081",
];

app.use(
  cors({
    origin: async (incomingOrigin, callback) => {
      console.log("CORS", incomingOrigin);
      if (
        (incomingOrigin &&
          (process.env.NODE_ENV == "development"
            ? incomingOrigin.includes("://localhost:") ||
              incomingOrigin.includes(`://${ip}:`)
            : origin.includes(incomingOrigin))) ||
        !incomingOrigin
      ) {
        console.log("Allowed by CORS");
        callback(null, true);
      } else {
        console.log("Not allowed by CORS");
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// alternate to cors
// app.use((req, res, next) => {
//   if (req.method === "GET") {
//     return next();
//   }
//   const originHeader = req.headers.origin ?? null;
//   const hostHeader = req.headers.host ?? null;
//   console.log(originHeader, hostHeader);
//   console.log(verifyRequestOrigin(originHeader!, [hostHeader!, ...origin]));
//   if (
//     !originHeader ||
//     !hostHeader ||
//     !verifyRequestOrigin(originHeader, [hostHeader, ...origin])
//   ) {
//     return res.status(403).json({ message: "Not allowed by CORS" }).end();
//   }
//   return next();
// });

// Create tRPC server
const trpcServer = createExpressMiddleware({
  router: appRouter,
});
// Apply the tRPC routes on the express app

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.get("/hello", (req, res) => {
  res.send("Hello World");
});

app.use("/api/auth", authRouter);
// app.use(authMiddleware);
app.use("/trpc", trpcServer);

// Create an HTTP server and pass the express app to it
const httpServer = new Server(app);
// Listen on port 3000
httpServer.listen(process.env.PORT || 3000, () => {
  console.log("Server started on http://localhost:3000", httpServer.address());
});

// Export type router type signature, this is used by the client.
export type AppRouter = typeof appRouter;
export type AuthUser = User;
