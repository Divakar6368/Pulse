import chalk from "chalk";

import { requireAuth } from "../../../lib/token.js";
import { Command } from "commander";
import { URL } from "./login.js";

export async function whoamiAction(options) {
  const token=await requireAuth();
  if(!token?.access_token){
    console.log("No access token found.Please login");
    process.exit(1);
  }

 
const serverUrl = (options.serverUrl || URL).replace(/\/+$/, "");

const response = await fetch(`${serverUrl}/api/cli/me`, {
  headers: {
    Authorization: `Bearer ${token.access_token}`,
  },
});

if (!response.ok) {
  console.log(
    chalk.red(
      response.status === 401
        ? "Session invalid or expired. Please login again."
        : `Failed to fetch user: HTTP ${response.status}`
    )
  );
  return;
}

const user = await response.json();


  console.log(
    chalk.bold.greenBright(`\n 👤User: ${user.name}
  📩 Email: ${user.email}
  🪪  ID: ${user.id}
      `)
  )

}


  export const whoami = new Command("whoami")
  .description("Show current authenticated user")
  .option("--server-url <url>", "The Better Auth server URL", URL)
  .action(whoamiAction)
