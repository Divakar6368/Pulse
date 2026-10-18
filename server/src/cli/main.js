#!/usr/bin/env node

import dotenv from "dotenv"
import chalk from "chalk" //to add colours 
import figlet from "figlet" //to add banners 

import {Command} from "commander" //to create a command
import { login} from "./commands/auth/login.js"
import { logout } from "./commands/auth/logout.js"
import { whoami } from "./commands/auth/whoami.js"


dotenv.config()

async function main() {
    
    console.log(
        chalk.greenBright(
            figlet.textSync("Pulse CLI",{
                font:"Standard",
                horizontalLayout:"default"
            })
        )
    )
    console.log(chalk.magenta("A Cli Based AI application.\n"))

    const program=new Command("pulse")
    program.version("0.0.1")
    .description("Pulse is a Cli based application")
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami)

    program.action(()=>{
        program.help();
    })
    await program.parseAsync(process.argv);
}

main().catch((error)=>{
    console.log(chalk.red("Error running Pulse Cli:"),error);
    process.exit(1);
})