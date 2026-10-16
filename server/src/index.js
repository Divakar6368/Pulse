import express from "express"
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js"
import dotenv from "dotenv"
import cors from "cors"

dotenv.config()
const app=express();




app.use(
    cors({
        origin:"http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials:true,
    })
)

app.all("/api/auth/*splat", toNodeHandler(auth)); 
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("OK");
})

app.listen(process.env.PORT,()=>{
    console.log(`Listening at port no:${process.env.PORT}`)
})
