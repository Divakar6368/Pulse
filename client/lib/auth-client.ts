import { createAuthClient } from "better-auth/react"
import {deviceAuthorizationClient} from "better-auth/client/plugins"

export const authClient = createAuthClient({

    baseURL:  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  "http://localhost:3004",
  fetchOptions: {
      credentials: "include", 
    },
    plugins:[
      deviceAuthorizationClient()
    ]

})