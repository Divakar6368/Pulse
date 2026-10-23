
import "dotenv/config";

import express from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth.js";

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

app.get("/", (_req, res) => {
  res.status(200).send("Pulse API is running");
});

const port = process.env.PORT || 3004;

app.listen(port, "0.0.0.0", () => {
  console.log(`Pulse API listening on port ${port}`);
});
