import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client.js";
import { fileURLToPath } from "node:url";
import path from "node:path";


const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Load the server package's .env file, regardless of the current folder.
dotenv.config({
  path: path.resolve(currentDir, "../../.env"),
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Configure it in the Pulse server environment."
  );
}

const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });