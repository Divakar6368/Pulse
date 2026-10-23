import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../../../lib/token.js";
import { prisma } from "../../../lib/db.js";
import { AIService } from "../../ai/google-service.js";
import { ChatService } from "../../../service/chat.service.js";
import { isCancel, text } from "@clack/prompts";
import chalk from "chalk";
import boxen from "boxen";
import { marked } from "marked";

const aiService=new AIService()
const chatService=new ChatService()

export async function getUserFromToken() {
    const token=await getStoredToken();
    if(!token.access_token){
        throw new Error("Not authenticated. Please run 'pulse login' first");
    }
    const spinner=yoctoSpinner({text:"Authenticating..."});
    spinner.start()

    const user=await prisma.user.findFirst({
        where:{
            sessions:{
                some:{token:token.access_token},
            }
        }
    })
    if(!user){
        spinner.error("User not found")
        throw new Error("User not found.Please login again")
    }
    spinner.success(`Welcome back, ${user.name}!`)
    return user;
}


export async function getAIResponse(conversationId) {
    const spinner = yoctoSpinner({ 
        text: "AI is thinking...", 
        color: "cyan" 
    }).start();

    const dbMessages=await chatService.getMessages(conversationId)
    const aiMessages=chatService.formatMessageForAI(dbMessages)

    let fullResponse=""

    let isFirstChunk=true;

    try {
        const result=await aiService.sendMessage(aiMessages,(chunk)=>{
             if (isFirstChunk) {
                spinner.stop();
                console.log("\n");
                const header = chalk.green.bold("🤖 Assistant:");
                console.log(header);
                console.log(chalk.gray("─".repeat(60)));
                isFirstChunk = false;
            }
            fullResponse += chunk;
        })

        console.log("\n");
        const renderedMarkdown = marked.parse(fullResponse);
        console.log(renderedMarkdown);
        console.log(chalk.gray("─".repeat(60)));
        console.log("\n");

        return result.content;

    } catch (error) {
        spinner.error("Failed to get AI response");
        throw error;
    }
}

export async function saveMessage(conversationId,role,content) {
    return await chatService.addMessage(conversationId,role,content)
}

export async function updateConversationTitle(conversationId, userInput, messageCount) {
  if (messageCount === 1) {
    const title = userInput.slice(0, 50) + (userInput.length > 50 ? "..." : "");
    await chatService.updateTitle(conversationId, title);
  }
}


export async function initConversation(userId,conversationId=null,mode="chat") {
    const spinner=yoctoSpinner({text:"Loading conversation..."}).start()

    const conversation=await chatService.getOrCreateConversation(
        userId,
        conversationId,
        mode
    )

    spinner.success("Conversation Loaded")

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


export function displayMessages(messages) {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "👤 You",
        titleAlignment: "left",
      });
      console.log(userBox);
    } else {
      // Render markdown for assistant messages
      const renderedContent = marked.parse(msg.content);
      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 Assistant",
        titleAlignment: "left",
      });
      console.log(assistantBox);
    }
  });
}


export async function chatLoop(conversation) {
     const helpBox = boxen(
    `${chalk.gray('• Type your message and press Enter')}\n${chalk.gray('• Markdown formatting is supported in responses')}\n${chalk.gray('• Type "exit" to end conversation')}\n${chalk.gray('• Press Ctrl+C to quit anytime')}`,
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
    const userInput=await text({
        message:chalk.blue("Your message"),
        placeholder:"Type your message...",
        validate(value){
            if(!value || value.trim().length===0){
                return "Message cannot be empty"
            }
        }
    })

    if(isCancel(userInput)){
        const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "yellow",
        });
        console.log(exitBox);
        process.exit(0);
    }

    if(userInput.toLowerCase()==="exit"){
        const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }

    await saveMessage(conversation.id , "user" , userInput);

    const messages = await chatService.getMessages(conversation.id)

    const aiResponse = await getAIResponse(conversation.id)

    await saveMessage(conversation.id , "assistant" , aiResponse)

    await updateConversationTitle(conversation.id , userInput , messages.length)

  }

}