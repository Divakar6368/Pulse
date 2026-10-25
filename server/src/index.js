
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

/* ---------- CLI authentication helper ---------- */

async function getCliSession(req) {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        return null;
    }

    const token = authorization.slice(7).trim();

    if (!token) {
        return null;
    }

    const session = await prisma.session.findUnique({
        where: { token },
        select: {
            userId: true,
            expiresAt: true,
        },
    });

    if (!session || session.expiresAt <= new Date()) {
        return null;
    }

    return session;
}

/* ---------- Create conversation ---------- */

app.post("/api/cli/conversations", async (req, res, next) => {
    try {
        const session = await getCliSession(req);

        if (!session) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        const mode = req.body?.mode || "chat";
        const allowedModes = ["chat", "tool", "agent"];

        if (!allowedModes.includes(mode)) {
            return res.status(400).json({ error: "Invalid conversation mode" });
        }

        const conversation = await prisma.conversation.create({
            data: {
                userId: session.userId,
                mode,
                title: req.body?.title || `New ${mode} conversation`,
            },
        });

        return res.status(201).json(conversation);
    } catch (error) {
        next(error);
    }
});

/* ---------- List current user's conversations ---------- */

app.get("/api/cli/conversations", async (req, res, next) => {
    try {
        const session = await getCliSession(req);

        if (!session) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        const conversations = await prisma.conversation.findMany({
            where: { userId: session.userId },
            orderBy: { updatedAt: "desc" },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        return res.json(conversations);
    } catch (error) {
        next(error);
    }
});

/* ---------- Get one conversation with messages ---------- */

app.get("/api/cli/conversations/:id", async (req, res, next) => {
    try {
        const session = await getCliSession(req);

        if (!session) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                userId: session.userId,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        return res.json(conversation);
    } catch (error) {
        next(error);
    }
});

/* ---------- Get messages ---------- */

app.get("/api/cli/conversations/:id/messages", async (req, res, next) => {
    try {
        const session = await getCliSession(req);

        if (!session) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                userId: session.userId,
            },
            select: { id: true },
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: "asc" },
        });

        return res.json(messages);
    } catch (error) {
        next(error);
    }
});

/* ---------- Add message ---------- */

app.post("/api/cli/conversations/:id/messages", async (req, res, next) => {
    try {
        const session = await getCliSession(req);

        if (!session) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        const { role, content } = req.body ?? {};

        if (!["user", "assistant", "system"].includes(role)) {
            return res.status(400).json({ error: "Invalid message role" });
        }

        if (content === undefined || content === null) {
            return res.status(400).json({ error: "Message content is required" });
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                userId: session.userId,
            },
            select: { id: true },
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const contentStr =
            typeof content === "string" ? content : JSON.stringify(content);

        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role,
                content: contentStr,
            },
        });

        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
        });

        return res.status(201).json(message);
    } catch (error) {
        next(error);
    }
});

/* ---------- Update conversation title ---------- */

app.patch("/api/cli/conversations/:id", async (req, res, next) => {
    try {
        const session = await getCliSession(req);

        if (!session) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        const { title } = req.body ?? {};

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ error: "A valid title is required" });
        }

        const result = await prisma.conversation.updateMany({
            where: {
                id: req.params.id,
                userId: session.userId,
            },
            data: { title: title.trim() },
        });

        if (result.count === 0) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                userId: session.userId,
            },
        });

        return res.json(conversation);
    } catch (error) {
        next(error);
    }
});

/* ---------- Delete conversation ---------- */

app.delete("/api/cli/conversations/:id", async (req, res, next) => {
    try {
        const session = await getCliSession(req);

        if (!session) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        const result = await prisma.conversation.deleteMany({
            where: {
                id: req.params.id,
                userId: session.userId,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Related messages are deleted by the database cascade.
        return res.json({ success: true });
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
