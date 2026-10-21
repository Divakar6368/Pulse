import chalk from "chalk";
import boxen from "boxen"
import { text,isCancel,cancel,intro,outro, box, multiselect } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import {marked} from "marked"
import {markedTerminal} from "marked-terminal"
import { AIService } from "../ai/google-service.js";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../../lib/token.js";
import {prisma} from "../../lib/db.js"

import {availableTools,getEnabledToolNames,getEnabledTools,enableTools,resetTools} from "../../config/tool.config.js"
import { displayMessages, getUserFromToken ,updateConversationTitle,saveMessage} from "./utils/chataiutils.js";


async function selectTools() {
    const toolOptions=availableTools.map(tool=>({
        value:tool.id,
        label:tool.description,
        hint:tool.description
    }))

    const selectedTools=await multiselect({
        message: chalk.cyan(
      "Select tools to enable (Space to select, Enter to confirm):"
    ),
    options: toolOptions,
    required: false,
    })

    if (isCancel(selectedTools)) {
        cancel(chalk.yellow("Tool selection cancelled"));
        process.exit(0);
    }

    enableTools(selectTools);

    if(selectTools.length===0){
        console.log(
         chalk.yellow("\n⚠️  No tools selected. AI will work without tools.\n")
        );
    }
    else{
      const toolsBox = boxen(
      chalk.green(
        `✅ Enabled tools:\n${selectedTools
          .map((id) => {
            const tool = availableTools.find((t) => t.id === id);
            return `  • ${tool.name}`;
          })
          .join("\n")}`
      ),
      {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🛠️  Active Tools",
        titleAlignment: "center",
      }
    );
    console.log(toolsBox);
    }

    return selectTools.length > 0;
}


export async function startToolChat(conversationId=null) {
    try {
        intro(
            boxen(chalk.bold.cyan("🛠️ Pulse AI - Tool Calling Mode"),{
                padding: 1,
                borderStyle: "double",
                borderColor: "cyan",
            })
        )

        const user=await getUserFromToken();
        await selectTools();
        const conversation=await initConversation(user.id,conversationId,"tool")
        await chatLoop(conversation)

        resetTools()

        outro(chalk.green("✨Thanks for using tools"))
        

    } catch (error) {
      const errorBox = boxen(chalk.red(`❌ Error: ${error.message}`), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "red",
      });
        console.log(errorBox);
        resetTools();
        process.exit(1);
    } 
}

export async function initConversation(userId,conversationId=null,mode="tool") {
    const spinner=yoctoSpinner({text:"Loading conversation..."}).start()

    const conversation=await chatService.getOrCreateConversation(
        userId,
        conversationId,
        mode
    )
    spinner.success("Conversation Loaded")

    const enabledToolNames = getEnabledToolNames();
    const toolsDisplay =
    enabledToolNames.length > 0
      ? `\n${chalk.gray("Active Tools:")} ${enabledToolNames.join(", ")}`
      : `\n${chalk.gray("No tools enabled")}`;



    const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Mode: " + conversation.mode)}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💬 Chat Session",
      titleAlignment: "center",
    }
  );

  console.log(conversationInfo)

  if(conversation.messages?.length>0){
    console.log(chalk.yellow("📜 Previous messages:\n"));
    displayMessages(conversation.messages);
  }

   return conversation
}


async function chatLoop(conversation) {
    const enabledToolNames=getEnabledToolNames()
     const helpBox = boxen(
    `${chalk.gray("• Type your message and press Enter")}\n${chalk.gray(
      "• AI has access to:"
    )} ${
      enabledToolNames.length > 0 ? enabledToolNames.join(", ") : "No tools"
    }\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray(
      "• Press Ctrl+C to quit anytime"
    )}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true,
    }
  );

  console.log(helpBox)

  while(true){
    const userInput = await text({
      message: chalk.blue("💬 Your message"),
      placeholder: "Type your message...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty";
        }
      },
    });

     if (isCancel(userInput)) {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      process.exit(0);
    }

    if (userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }

     const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { left: 2, top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 You",
      titleAlignment: "left",
    });
    console.log(userBox);

     await saveMessage(conversation.id, "user", userInput);

    const messages = await chatService.getMessages(conversation.id);

    const aiResponse = await getAIResponse(conversation.id);

    await saveMessage(conversation.id, "assistant", aiResponse);

    await updateConversationTitle(conversation.id, userInput, messages.length);

  }
}







