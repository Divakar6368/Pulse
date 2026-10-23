import { confirm, intro, isCancel, outro } from "@clack/prompts";
import { clearStoredToken, getStoredToken } from "../../../lib/token.js";
import chalk from "chalk";
import { Command } from "commander";
import dotenv from "dotenv";



dotenv.config();

export async function logoutAction() {
  intro(chalk.bold("👋Logout"));

  const token=await getStoredToken();
  if(!token){
    console.log(chalk.yellow("You're not logged in.Please LogIn First"))
    process.exit(0);
  }
  const shouldLogout=await confirm({
    message:"Are you sure , do you want to logout?",
    initialValue:false
  })

  if(isCancel(shouldLogout) || !shouldLogout){
    cancel("Logout Cancelled")
    process.exit(0)
  }

  const cleared=await clearStoredToken();
  if(cleared){
    outro(chalk.green("✅ Successfully logged out!"))
  }
  else{
    console.log(chalk.yellow("❌ Could not clear token file."))
  }
}



export const logout = new Command("logout")
  .description("Logout and Clear stored credentials")
  .action(logoutAction)