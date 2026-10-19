import {config} from "../../config/google.config.js"
import {google} from "@ai-sdk/google"
import {streamText} from "ai"
import chalk from "chalk" 


export class AIServices{
    constructor(){
        if(!config.googleApiKey){
            throw new Error("Google_API_KEY is not present in env.")
        }
        this.model=google(config.model,{
            apiKey:config.googleApiKey
        })
    }

    // send message in chunk like sendMessage(messages,(chunk)=>{
    // console.log(chunk})

    async sendMessage(messages,onChunk,tools=undefined,onToolCall=null){
        try {
            const streamConfig={
                model:this.model,
                messages:messages
            }

            const result=streamText(streamConfig)

            let fullResponse=""
            
            for await (const chunk of result.textStream){
                fullResponse+=chunk;
                if(onChunk){
                    // callback()
                    onChunk(chunk)
                }
            }

            const fullResult=result;

            /**
             * {
                    textStream: AsyncIterable,  // Streaming text chunks
                    text: Promise,              // Complete generated text
                    finishReason: Promise,      // Generation kyu finish hui
                    usage: Promise,             // Token usage information
                    response: Promise,          // Response metadata
                    request: { ... },           // Request information
                    more properties...
                    }
             */
            
            return{
                content:fullResponse,
                finishResponse:fullResult.finishReason,
                usage:fullResult.usage
            }

        } catch (error) {
            console.error(chalk.red("AI Service Error:"),error.message)
            throw error;
        }
    }

    // Send message in a single go

    async getMessage(messages,tools=undefined){
        let fullResponse=""
        await this.sendMessage(messages,(chunk)=>{
            fullResponse+=chunk;
        })
        return fullResponse;
    }
}