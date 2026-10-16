import { createAuthClient } from "better-auth/react"
import {deviceAuthorization} from "better-auth/plugins"
export const authClient = createAuthClient({

    baseURL: "http://localhost:3004",
    plugins:[
      deviceAuthorization()
    ]

})