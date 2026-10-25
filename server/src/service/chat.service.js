import { URL } from "../cli/commands/auth/login.js";
import { getStoredToken } from "../lib/token.js";



export class ChatService{
    async request(endpoint, options = {}) {
    const token = await getStoredToken();

    if (!token?.access_token) {
        throw new Error("Not authenticated. Please run 'pulse login' first.");
    }

    const response = await fetch(
        `${URL.replace(/\/+$/, "")}/api/cli${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token.access_token}`,
                ...options.headers,
            },
        }
    );

    if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `API request failed: HTTP ${response.status}`);
    }

    if (response.status === 204) return null;

    return response.json();
}
    async createConversation(userId, mode = "chat", title = null) {
    return this.request("/conversations", {
        method: "POST",
        body: JSON.stringify({
            mode,
            title: title || `New ${mode} conversation`,
        }),
    });
}

async getOrCreateConversation(userId, conversationId = null, mode = "chat") {
    if (conversationId) {
        return this.request(
            `/conversations/${encodeURIComponent(conversationId)}`
        );
    }

    return this.createConversation(userId, mode);
}

    // user messages add to convo like {role:user ,message:"jhfdks"}
   async addMessage(conversationId, role, content) {
    const contentStr =
        typeof content === "string" ? content : JSON.stringify(content);

    return this.request(
        `/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
            method: "POST",
            body: JSON.stringify({
                role,
                content: contentStr,
            }),
        }
    );
}


  async getMessages(conversationId) {
    const messages = await this.request(
        `/conversations/${encodeURIComponent(conversationId)}/messages`
    );

    return messages.map((msg) => ({
        ...msg,
        content: this.parseContent(msg.content),
    }));
}
    async getUserConversation(userId) {
    return this.request("/conversations");
}

  async deleteConversation(conversationId, userId) {
    return this.request(
        `/conversations/${encodeURIComponent(conversationId)}`,
        {
            method: "DELETE",
        }
    );
}
   async updateTitle(conversationId, title) {
    return this.request(
        `/conversations/${encodeURIComponent(conversationId)}`,
        {
            method: "PATCH",
            body: JSON.stringify({ title }),
        }
    );
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