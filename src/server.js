/*global process*/ 
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import routes from "./routes.js";
import cors from "cors";
dotenv.config();
const app=express();
const PORT=3000;

app.use(cors());
app.use(express.json());
app.use(routes);

app.get("/",(req,res)=>{
            res.send("Automation Project Backend is running");
        });
async function startServer(){
    try{
        await connectDB();
        app.listen(PORT,()=>{
            console.log(`Server is running on port ${PORT}`);
        })
    }catch(error){
        console.log("Error in starting server:",error);
        process.exit(1);
    }
}
startServer();


