import express from "express"
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js"
import dotenv from "dotenv"
import cors from "cors"

dotenv.config()
const app=express();




app.use(
    cors({
        origin:[
            "http://localhost:3000",
            `${process.env.CLIENT_URL}`
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials:true,
    })
)

app.all("/api/auth/*splat", toNodeHandler(auth)); 
app.use(express.json());

app.get("/api/me", async (req, res) => {
 	const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
	return res.json(session);
});

app.get("/device", (req, res) => {
  const userCode = req.query.user_code;
  const frontendUrl = process.env.CLIENT_URL;

  if (!frontendUrl) {
    return res.status(500).send("CLIENT_URL is not configured");
  }

  const redirectUrl = new URL("/device", frontendUrl);

  if (typeof userCode === "string" && userCode) {
    redirectUrl.searchParams.set("user_code", userCode);
  }

  return res.redirect(redirectUrl.toString());
});

app.get("/",(req,res)=>{
    res.send("OK");
})

app.listen(process.env.PORT,"0.0.0.0",()=>{
    console.log(`Listening at port no:${process.env.PORT}`)
})
