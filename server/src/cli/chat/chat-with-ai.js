import chalk from "chalk";
import boxen from "boxen"
import { text,isCancel,cancel,intro,outro } from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import {marked} from "marked"
import {markedTerminal} from "marked-terminal"
import { chatLoop, getUserFromToken, initConversation } from "./utils/chataiutils.js";


marked.use(
  markedTerminal({
    // Styling options for terminal output
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  })
);



export async function startChat(mode="chat",conversationId=null) {
    try {
        intro(
            boxen(chalk.bold.cyan("Pulse AI Chat"),{
                padding:1,
                borderStyle:"double",
                borderColor:"green"
            })
        )

        const user=await getUserFromToken()
        const conversation=await initConversation(user.id,conversationId,mode)
        await chatLoop(conversation);

        outro(chalk.green("🫂 Thanks For Chatting"))
    } catch (error) {
        const errorBox = boxen(chalk.red(`❌ Error: ${error.message}`), {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "red",
        });
        console.log(errorBox);
        process.exit(1);
    }
}