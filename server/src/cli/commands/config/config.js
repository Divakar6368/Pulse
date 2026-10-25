
import {
  cancel,
  intro,
  isCancel,
  outro,
  password,
} from "@clack/prompts";
import chalk from "chalk";
import { Command } from "commander";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".pulse");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export async function configAction() {
  intro(chalk.bold("⚙️ Pulse Configuration"));

  const apiKey = await password({
    message: "Enter your Google Gemini API key:",
    validate(value) {
      if (!value?.trim()) return "API key cannot be empty.";
    },
  });

  if (isCancel(apiKey)) {
    cancel("Configuration cancelled.");
    return;
  }

  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    let existingConfig = {};
    try {
      existingConfig = JSON.parse(
        await fs.readFile(CONFIG_FILE, "utf8"),
      );
    } catch {
      // No existing config file yet.
    }

    await fs.writeFile(
      CONFIG_FILE,
      JSON.stringify(
        {
          ...existingConfig,
          googleApiKey: apiKey.trim(),
        },
        null,
        2,
      ),
      { encoding: "utf8", mode: 0o600 },
    );

    outro(chalk.green("Google API key saved successfully."));
    console.log(chalk.gray(`Config location: ${CONFIG_FILE}`));
    console.log(chalk.gray("You can now run Pulse from any folder."));
  } catch (error) {
    console.error(
      chalk.red("Could not save configuration:"),
      error.message,
    );
    process.exitCode = 1;
  }
}

export const config = new Command("config")
  .description("Configure your Google Gemini API key")
  .action(configAction);
