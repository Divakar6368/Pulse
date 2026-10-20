import { prisma } from "../lib/db.js"


export class ChatService{

    async createConversation(userId,mode="chat",title=null){
        return prisma.conversation.create({
            data:{
                userId,
                mode,
                title:title || `New ${mode} conversation`
            }
        })
    }

    async getOrCreateConversation(userId,conversationId=null,mode="chat"){
        if(conversationId){
            const conversation=await prisma.conversation.findFirst({
                where:{
                    id:conversationId,
                    userId
                },
                include:{
                    messages:{
                        orderBy:{
                            createdAt:"asc"
                        }
                    }
                }

            })
            if(conversation) return conversation;
        }
        
        return await this.createConversation(userId,mode);
    }

    // user messages add to convo like {role:user ,message:"jhfdks"}
     async addMessage(conversationId, role, content) {
    // Convert content to JSON string if it's an object
    const contentStr = typeof content === "string" 
      ? content 
      : JSON.stringify(content);

    return await prisma.message.create({
      data: {
        conversationId,
        role,
        content: contentStr,
      },
    });
  }


    async getMessages(conversationId){
        const messages=await prisma.message.findMany({
            where:{conversationId},
            orderBy:{createdAt:"asc"}
        })

        return messages.map((msg)=>({
            ...msg,
            content:this.parseContent(msg.content)
        }))
    }

    async getUserConversation(userId){
        return prisma.conversation.findMany({
            where:{userId},
            orderBy:{updatedAt:"desc"},
            include:{
                messages:{
                    take:1,
                    orderBy:{createdAt:"desc"}
                }
            }
        })
    }


    async deleteConversation(conversationId,userId){
        return await prisma.conversation.deleteMany({
            where:{
                id:conversationId,
                userId
            }
        })
    }

    async updateTitle(conversationId,title){
        return await prisma.conversation.update({
            where:{id:conversationId},
            data:{title}
        })
    }

    parseContent(content){
        try {
            return JSON.parse(content)
        } catch (error) {
            return content;
        }
    }

    formatMessageForAI(messages){
        return messages.map((msg)=>({
            role:msg.role,
            content:typeof msg.content==="string" ?  msg.content : JSON.stringify(msg.content)
        }))
    }

}