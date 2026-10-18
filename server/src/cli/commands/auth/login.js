import { cancel, confirm, intro, isCancel, outro, select } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";

import chalk from "chalk";
import { Command, program } from "commander";
import fs from "node:fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod/v4";
import dotenv from "dotenv";

import { prisma } from "../../../lib/db.js";
import { clearStoredToken, getStoredToken, isTokenExpired, requireAuth, storeToken } from "../../../lib/token.js";
import { pollForToken } from "../utils/polling.js";

dotenv.config();



export const URL = "http://localhost:3004";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction() {
  const options = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
  });
  const serverUrl = options.serverUrl || URL;
  const clientId = options.clientId || CLIENT_ID;

  intro(chalk.bold("🔏Auth CLI Login."));

  const existingToken = getStoredToken();
  const expired = isTokenExpired();

  if (existingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already loggedIn. Do You want to login Again?",
      initialValue: false,
    });
    // User choose No OR Cancel the command
    if (isCancel(shouldReAuth) || !shouldReAuth) {
      cancel("Login Cancelled..");
      process.exit(0);
    }
  }

  const authClient = createAuthClient({
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  const spinner = yoctoSpinner({ text: "Requesting device authorization..." });
  spinner.start();

  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });
    spinner.stop();

    if (error || !data) {
      logger.error(
        `Failed to request device authorization: ${error.error_description}`,
      );
      process.exit(1);
    }

    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      expires_in,
      interval,
    } = data;

    console.log(chalk.cyan("Device authorization is required."));

    console.log(
      `Please visit ${chalk.underline.blue(verification_uri || verification_uri_complete)} `,
    );

    console.log(`Enter Code ${chalk.bold.green(user_code)}`);

    const shouldOpen = await confirm({
      message: "Open Browser automatically",
      initialValue: true,
    });

    if (!isCancel(shouldOpen) && shouldOpen) {
      const urlToOpen = verification_uri_complete || verification_uri;
      await open(urlToOpen);
    }

    console.log(
      chalk.gray(
        `Waiting for authorization (expires in ${Math.floor(
          expires_in / 60,
        )} minutes)....`,
      ),
    );

    const token = await pollForToken(
      authClient,
      device_code,
      clientId,
      interval,
    );

    if(token){
      const saved=await storeToken(token)
      if (!saved) {
        console.log(
          chalk.yellow("\n⚠️  Warning: Could not save authentication token.")
        );
        console.log(
          chalk.yellow("You may need to login again on next use.")
        );
      }

      outro(chalk.green("Login successfull!"))

      console.log(chalk.gray(`\n Token Saved to: ${TOKEN_FILE}`))
      console.log(chalk.gray("You can now use Pulse Commands without logging-in again.\n "))

    }
     
  } catch (error) {
    spinner.stop();
    console.error(chalk.red("\nLogin failed:"), error.message);
    process.exit(1);
  }
}


export const login = new Command("login")
  .description("Login to Better-Auth")
  .option("--server-url <url>", "The Better Auth server URL", URL)
  .option("--client-id <id>", "The OAuth client ID", CLIENT_ID)
  .action(loginAction)



