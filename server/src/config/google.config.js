import dotenv from "dotenv";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

dotenv.config();

const configPath = path.join(os.homedir(), ".pulse", "config.json");

let savedConfig = {};

try {
  savedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch {
  // Configuration has not been created yet.
}

export const config = {
  googleApiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || savedConfig.googleApiKey,

  model: process.env.ORBITAL_MODEL || savedConfig.model || "gemini-2.5-flash",
};
