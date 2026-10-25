
import "dotenv/config";

import express from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { prisma } from "./lib/db.js";

const app = express();

const frontendUrl =
  process.env.CLIENT_URL || "http://localhost:3000";

const allowedOrigins = [
  "http://localhost:3000",
  frontendUrl,
].filter(Boolean);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Better Auth handler must come before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/api/me", async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    return res.json(session);
  } catch (error) {
    next(error);
  }
});

app.get("/device", (req, res) => {
  const userCode = req.query.user_code;

  const destination = new URL("/device", frontendUrl);

  if (typeof userCode === "string") {
    destination.searchParams.set("user_code", userCode);
  }

  return res.redirect(destination.toString());
});


app.get("/api/cli/me", async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing authentication token",
      });
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        error: "Missing authentication token",
      });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    return res.json(session.user);
  } catch (error) {
    next(error);
  }
});


app.get("/", (_req, res) => {
  res.status(200).send("Pulse API is running");
});

const port = process.env.PORT || 3004;

app.listen(port, "0.0.0.0", () => {
  console.log(`Pulse API listening on port ${port}`);
});
