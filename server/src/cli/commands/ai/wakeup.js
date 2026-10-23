import chalk from "chalk"
import { Command } from "commander"
import yoctoSpinner from "yocto-spinner"
import { getStoredToken } from "../../../lib/token.js"
import { select } from "@clack/prompts"
import { prisma } from "../../../lib/db.js"
import { startChat } from "../../chat/chat-with-ai.js"
import { startToolChat } from "../../chat/chat-with-aitool.js"
import { startAgentChat } from "../../chat/chat-with-aiAgent.js"


const wakeUpAction=async ()=>{
    const token=await getStoredToken()
    if(!token?.access_token){
        console.log(chalk.red("Not Authenticated.Please login"))
        return;
    }

    const spinner=yoctoSpinner({text:"Fetching user information..."})
    spinner.start()

    const user=await prisma.user.findFirst({
        where:{
        sessions:{
            some:{
            token:token.access_token,
            }
        }
        },
        select:{
        id:true,
        name:true,
        email:true,
        image:true
        }
    })

    if(!user){
        console.log(chalk.red("User not Found."))
        return;
    }

    spinner.stop()
    console.log(chalk.green(`Welcome back, ${user.name}!\n`))

    const choice=await select({
        message:"Select an Option:",
        options:[
            {
                value:"chat",
                label:"Chat",
                hint:"Simple chat with AI"
            },
            {
                value:"tool",
                label:"Tool Calling",
                hint:"Chat with tools.(Google Search,Code Execution)"
            },
            {
                value:"agent",
                label:"Agentic Mode",
                hint:"Advanced AI agent."
            }
        ]
    })

    switch(choice){
        case "chat":
            await startChat("chat");
            break;
        case "tool":
            await startToolChat();
            break;
        case "agent":
            await startAgentChat();
            break;
    }
}


export const wakeUp=new Command("wakeup")
.description("Wake up the AI.")
.action(wakeUpAction)