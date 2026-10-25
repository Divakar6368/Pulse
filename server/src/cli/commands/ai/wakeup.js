import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken, requireAuth } from "../../../lib/token.js";
import { select } from "@clack/prompts";
import { URL } from "../auth/login.js";

const wakeUpAction = async () => {
  const token = await requireAuth();
  if (!token?.access_token) {
    console.log(chalk.red("Not Authenticated.Please login"));
    return;
  }

  const spinner = yoctoSpinner({ text: "Fetching user information..." });
  spinner.start();

  const serverUrl = URL.replace(/\/+$/, "");

  const response = await fetch(`${serverUrl}/api/cli/me`, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  if (!response.ok) {
    spinner.stop();

    if (response.status === 401) {
      console.log(chalk.red("Session invalid or expired. Please login again."));
    } else {
      console.log(chalk.red(`Failed to fetch user: HTTP ${response.status}`));
    }

    return;
  }

  const user = await response.json();
  if (!user?.id) {
    spinner.stop();
    console.log(chalk.red("User not found."));
    return;
  }

  spinner.stop();
  console.log(chalk.green(`Welcome back, ${user.name}!\n`));

  const choice = await select({
    message: "Select an Option:",
    options: [
      {
        value: "chat",
        label: "Chat",
        hint: "Simple chat with AI",
      },
      {
        value: "tool",
        label: "Tool Calling",
        hint: "Chat with tools.(Google Search,Code Execution)",
      },
      {
        value: "agent",
        label: "Agentic Mode",
        hint: "Advanced AI agent.",
      },
    ],
  });

  switch (choice) {
    case "chat":
      const { startChat } = await import("../../chat/chat-with-ai.js");
      await startChat("chat");
      break;
    case "tool":
      const { startToolChat } = await import("../../chat/chat-with-aitool.js");

      await startToolChat();
      break;
    case "agent":
      const { startAgentChat } =
        await import("../../chat/chat-with-aiAgent.js");
      await startAgentChat();
      break;
  }
};

export const wakeUp = new Command("wakeup")
  .description("Wake up the AI.")
  .action(wakeUpAction);
