import {config} from "../../config/google.config.js"
import {google} from "@ai-sdk/google"
import {streamText} from "ai"
import chalk from "chalk" 


export class AIService{
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

            if(tools && Object.keys(tools).length>0){
                streamConfig.tools=tools;
                streamConfig.maxSteps=5;

                console.log(chalk.gray(`[Debug] Tools enabled : ${Object.keys(tools).join(",")}`))
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


            const toolCalls=[]
            const toolResults=[]


            if(fullResult.steps && Array.isArray(fullResult.steps)){
                for(const step of fullResult.steps){
                    if(step.toolCalls && step.toolCalls.length>0){
                        for(const toolCall of step.toolCalls){
                            toolCalls.push(toolCall);
                            if(onToolCall){
                                onToolCall(toolCall)
                            }
                        }
                    }
                    if(step.toolResults && step.toolResults.length>0){
                        toolResults.push(...step.toolResults)
                    }
                }
            }

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
                usage:fullResult.usage,
                toolCalls,
                toolResults,
                steps:fullResult.steps
            }

        } catch (error) {
            console.error(chalk.red("AI Service Error:"),error.message)
            throw error;
        }
    }

    // Send message in a single go

    async getMessage(messages,tools=undefined){
        let fullResponse=""
        const result=await this.sendMessage(messages,(chunk)=>{
            fullResponse+=chunk;
        },tools)
        return result.content;
    }
}