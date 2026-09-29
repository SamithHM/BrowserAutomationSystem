/*global process*/
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
console.log(process.env);

export async function connectDB() {

    try {

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB");

    } catch (error) {

        console.error(
            "Error connecting to MongoDB:",
            error.message
        );

        throw error;
    }
}